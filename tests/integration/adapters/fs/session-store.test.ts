import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import {
  getLatestIncompleteSession,
  loadStoredSession,
  saveStoredSession
} from "../../../../src/adapters/fs/session-store.js";
import type { StoredIntakeSession } from "../../../../src/types/intake.js";

const tempRoots: string[] = [];

async function createRoot(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "harness-sessions-"));
  tempRoots.push(root);
  return root;
}

function createStoredSession(overrides: Partial<StoredIntakeSession> = {}): StoredIntakeSession {
  return {
    sessionId: "sess-1",
    entryPoint: "agent",
    createdBy: "eshli",
    state: "collecting_context",
    draft: {
      productOutcome: "Turn ideas into planned work.",
      intendedUsers: ["Authorized collaborator"],
      coreWorkflow: "",
      mustHaveFeatures: [],
      outOfScope: [],
      constraints: []
    },
    missingFields: ["coreWorkflow", "mustHaveFeatures"],
    currentStep: "workflow",
    reviewSummary: null,
    createdAt: "2026-03-09T10:00:00.000Z",
    updatedAt: "2026-03-09T10:00:00.000Z",
    status: "in_progress",
    ...overrides
  };
}

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })));
});

describe("session-store", () => {
  test("persists and reloads resumable intake sessions", async () => {
    const root = await createRoot();
    const session = createStoredSession();

    const savedPath = await saveStoredSession(root, session);
    const reloaded = await loadStoredSession(root, session.sessionId);

    expect(savedPath).toBe(path.join(root, "specs", "sessions", `${session.sessionId}.json`));
    expect(reloaded).toEqual(session);
  });

  test("returns the most recently updated incomplete session", async () => {
    const root = await createRoot();
    await saveStoredSession(
      root,
      createStoredSession({
        sessionId: "sess-old",
        updatedAt: "2026-03-09T10:00:00.000Z"
      })
    );
    await saveStoredSession(
      root,
      createStoredSession({
        sessionId: "sess-new",
        updatedAt: "2026-03-09T10:05:00.000Z"
      })
    );
    await saveStoredSession(
      root,
      createStoredSession({
        sessionId: "sess-complete",
        updatedAt: "2026-03-09T10:10:00.000Z",
        status: "completed"
      })
    );

    const latest = await getLatestIncompleteSession(root);

    expect(latest?.sessionId).toBe("sess-new");
  });
});
