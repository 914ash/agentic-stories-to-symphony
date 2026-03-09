import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { saveStoredSession, loadStoredSession, getLatestIncompleteSession } from "../../adapters/fs/session-store.js";
import { saveSpecRevision } from "../../adapters/fs/spec-store.js";
import { discoverLinearCapabilities } from "../../adapters/linear/capabilities.js";
import type { LinearClient } from "../../adapters/linear/client.js";
import { buildProjectionPlan } from "../../adapters/linear/projector.js";
import type { IntakeDraft, StoredIntakeSession } from "../../types/intake.js";
import type { PromptIO } from "../../types/prompt.js";
import type { HarnessConfig } from "../../types/runtime.js";
import { executeProjectionPlan } from "../projection/executor.js";
import { approveSpecRevision } from "../spec/approval.js";
import { compileSpecRevision } from "../spec/compiler.js";
import { streamExecutionEvents, type ExecutionEvent } from "../watch/execution-watch.js";
import { createIntakeSession, updateIntakeDraft, advanceSession } from "./session.js";
import { parseMultilineEntries } from "./list-parser.js";
import { chooseLaunchMode } from "./wizard.js";

export interface ExecutionTracker {
  track(input: {
    issues: Array<{ id: string; identifier: string; initialState: string }>;
    client: LinearClient;
    pollIntervalSeconds: number;
  }): AsyncIterable<ExecutionEvent>;
}

export interface RunResult {
  savedSessionPath?: string;
  savedSpecPaths?: {
    markdownPath: string;
    jsonPath: string;
  };
  linearObjectIds?: {
    projectId: string;
    issueIds: string[];
  };
  watchSummary?: {
    watchedIssueIdentifiers: string[];
  };
}

interface RunTerminalIntakeInput {
  rootDir: string;
  prompt: PromptIO;
  client: LinearClient;
  config: HarnessConfig;
  tracker: ExecutionTracker;
  sessionId?: string;
  approveAs?: string;
  watch: boolean;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function nextSessionId(rootDir: string): Promise<string> {
  const sessionsDir = path.join(rootDir, "specs", "sessions");

  try {
    const entries = await fs.readdir(sessionsDir);
    return `sess-${entries.filter((entry) => entry.endsWith(".json")).length + 1}`;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return "sess-1";
    }
    throw error;
  }
}

async function nextRevisionNumber(rootDir: string, specId: string): Promise<number> {
  const revisionsDir = path.join(rootDir, "specs", specId, "revisions");

  try {
    const entries = await fs.readdir(revisionsDir);
    return entries.filter((entry) => entry.endsWith(".json")).length + 1;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return 1;
    }
    throw error;
  }
}

function getCreatedBy(): string {
  return process.env.USERNAME ?? process.env.USER ?? os.userInfo().username;
}

function buildStoredSession(session: ReturnType<typeof createIntakeSession>): StoredIntakeSession {
  const now = new Date().toISOString();
  return {
    ...session,
    currentStep: "product_outcome",
    reviewSummary: null,
    createdAt: now,
    updatedAt: now,
    status: "in_progress"
  };
}

async function saveProgress(rootDir: string, session: StoredIntakeSession): Promise<string> {
  return saveStoredSession(rootDir, {
    ...session,
    updatedAt: new Date().toISOString()
  });
}

async function collectDraft(rootDir: string, prompt: PromptIO, session: StoredIntakeSession): Promise<{
  session: StoredIntakeSession;
  action: "continue" | "save_and_exit";
}> {
  let current = session;

  const steps: Array<{
    key: keyof IntakeDraft;
    step: StoredIntakeSession["currentStep"];
    message: string;
  }> = [
    { key: "productOutcome", step: "product_outcome", message: "Describe the product outcome" },
    { key: "intendedUsers", step: "intended_users", message: "List the intended users" },
    { key: "coreWorkflow", step: "workflow", message: "Describe the core workflow" },
    { key: "mustHaveFeatures", step: "must_have_features", message: "List the must-have features" },
    { key: "outOfScope", step: "out_of_scope", message: "List what is out of scope" },
    { key: "constraints", step: "constraints", message: "List the implementation constraints" }
  ];

  if (current.currentStep !== "review") {
    const stepIndex = Math.max(0, steps.findIndex((step) => step.step === current.currentStep));

    for (const step of steps.slice(stepIndex)) {
      current = {
        ...current,
        currentStep: step.step
      };

      const existingValue = current.draft[step.key];
      const initialValue = Array.isArray(existingValue) ? existingValue.join("\n") : String(existingValue ?? "");
      const rawValue = await prompt.multiline(step.message, initialValue);
      const updatedDraft =
        step.key === "productOutcome" || step.key === "coreWorkflow"
          ? { [step.key]: rawValue.trim() }
          : { [step.key]: parseMultilineEntries(rawValue) };

      const advancedSession = advanceSession(updateIntakeDraft(current, updatedDraft));
      current = {
        ...current,
        ...advancedSession,
        draft: advancedSession.draft
      };
      await saveProgress(rootDir, current);
    }

    current = {
      ...current,
      currentStep: "review",
      reviewSummary: [
        `Outcome: ${current.draft.productOutcome}`,
        `Users: ${current.draft.intendedUsers.join(", ")}`,
        `Features: ${current.draft.mustHaveFeatures.join(", ")}`
      ].join("\n")
    };
    await saveProgress(rootDir, current);
  }

  prompt.renderStatus(current.reviewSummary ?? "");

  const reviewAction = await prompt.select("Review the compiled intake draft", [
    { value: "continue", label: "Continue to approval" },
    { value: "edit", label: "Edit answers" },
    { value: "save_and_exit", label: "Save and exit" }
  ]);

  if (reviewAction === "save_and_exit") {
    return {
      session: current,
      action: "save_and_exit"
    };
  }

  if (reviewAction === "edit") {
    const editTarget = await prompt.select("Which section should be edited?", [
      { value: "product_outcome", label: "Product outcome" },
      { value: "intended_users", label: "Intended users" },
      { value: "workflow", label: "Workflow" },
      { value: "must_have_features", label: "Must-have features" },
      { value: "out_of_scope", label: "Out of scope" },
      { value: "constraints", label: "Constraints" }
    ]);

    return collectDraft(rootDir, prompt, {
      ...current,
      currentStep: editTarget
    });
  }

  return {
    session: current,
    action: "continue"
  };
}

function deriveSpecIdentity(session: StoredIntakeSession): { specId: string; title: string } {
  const baseTitle = session.draft.mustHaveFeatures[0] || session.draft.productOutcome || "Requirements Intake";
  const specId = slugify(baseTitle) || "requirements-intake";
  const title = baseTitle.endsWith("Workflow") ? baseTitle : `${baseTitle} Workflow`;

  return { specId, title };
}

async function resolveSession(input: {
  rootDir: string;
  prompt: PromptIO;
  sessionId?: string;
}): Promise<StoredIntakeSession> {
  if (input.sessionId) {
    const loaded = await loadStoredSession(input.rootDir, input.sessionId);
    if (!loaded) {
      throw new Error(`Session ${input.sessionId} was not found`);
    }
    return loaded;
  }

  const latestIncompleteSession = await getLatestIncompleteSession(input.rootDir);
  const launchMode = await chooseLaunchMode({
    prompt: input.prompt,
    latestIncompleteSession
  });

  if (launchMode === "resume_latest" && latestIncompleteSession) {
    input.prompt.renderStatus(`Resumed session ${latestIncompleteSession.sessionId}`);
    return latestIncompleteSession;
  }

  return buildStoredSession(
    createIntakeSession({
      sessionId: await nextSessionId(input.rootDir),
      entryPoint: "agent",
      createdBy: getCreatedBy()
    })
  );
}

export async function runTerminalIntake(input: RunTerminalIntakeInput): Promise<RunResult> {
  let storedSession = await resolveSession({
    rootDir: input.rootDir,
    prompt: input.prompt,
    sessionId: input.sessionId
  });

  const draftCollection = await collectDraft(input.rootDir, input.prompt, storedSession);
  storedSession = draftCollection.session;

  if (draftCollection.action === "save_and_exit") {
    const savedSessionPath = await saveStoredSession(input.rootDir, storedSession);
    input.prompt.renderStatus(`Saved session ${storedSession.sessionId} for later.`);
    return { savedSessionPath };
  }

  const approver = input.approveAs ?? (await input.prompt.input("Approve as"));
  const approveConfirmed = await input.prompt.confirm("Approve this spec revision and write it to Linear?", true);
  if (!approveConfirmed) {
    throw new Error("Approval cancelled");
  }

  const { specId, title } = deriveSpecIdentity(storedSession);
  const revisionNumber = await nextRevisionNumber(input.rootDir, specId);
  const compiledRevision = compileSpecRevision({
    specId,
    revision: revisionNumber,
    title,
    sessionId: storedSession.sessionId,
    entryPoint: storedSession.entryPoint,
    createdBy: storedSession.createdBy,
    draft: storedSession.draft
  });

  input.prompt.renderStatus(compiledRevision.markdown);

  const approvedRevision = approveSpecRevision({
    revision: compiledRevision,
    approver,
    authorizedApprovers: input.config.approverAllowlist
  }).revision;

  const savedSpecPaths = await saveSpecRevision(input.rootDir, approvedRevision);
  const capabilities = await discoverLinearCapabilities({
    client: input.client,
    teamKey: input.config.linear.teamKey
  });
  const projectionPlan = buildProjectionPlan({
    revision: approvedRevision,
    capabilities
  });
  const projectionResult = await executeProjectionPlan({
    rootDir: input.rootDir,
    client: input.client,
    revision: approvedRevision,
    plan: projectionPlan,
    capabilities
  });

  storedSession = {
    ...storedSession,
    currentStep: input.watch ? "watching" : "projecting",
    status: "completed",
    updatedAt: new Date().toISOString()
  };
  const savedSessionPath = await saveStoredSession(input.rootDir, storedSession);

  for (const issue of projectionResult.issues) {
    input.prompt.renderStatus(`Projected ${issue.identifier} (${issue.id})`);
  }

  let watchSummary: RunResult["watchSummary"];
  if (input.watch) {
    const watchedIssues = projectionResult.issues.map((issue) => ({
      id: issue.id,
      identifier: issue.identifier,
      initialState: capabilities.defaultState
    }));
    await streamExecutionEvents({
      prompt: input.prompt,
      events: input.tracker.track({
        issues: watchedIssues,
        client: input.client,
        pollIntervalSeconds: input.config.watch.pollIntervalSeconds
      })
    });
    watchSummary = {
      watchedIssueIdentifiers: watchedIssues.map((issue) => issue.identifier)
    };
  }

  return {
    savedSessionPath,
    savedSpecPaths,
    linearObjectIds: {
      projectId: projectionResult.project.id,
      issueIds: projectionResult.issues.map((issue) => issue.id)
    },
    watchSummary
  };
}
