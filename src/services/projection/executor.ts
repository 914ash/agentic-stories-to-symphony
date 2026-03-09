import fs from "node:fs/promises";
import path from "node:path";
import type { LinearCapabilities } from "../../adapters/linear/capabilities.js";
import type { LinearClient } from "../../adapters/linear/client.js";
import {
  LINEAR_ISSUE_CREATE_MUTATION,
  LINEAR_ISSUE_QUERY,
  LINEAR_ISSUE_RELATION_CREATE_MUTATION,
  LINEAR_ISSUE_UPDATE_MUTATION,
  LINEAR_PROJECT_CREATE_MUTATION,
  LINEAR_PROJECT_UPDATE_MUTATION
} from "../../adapters/linear/queries.js";
import type { ProjectionPlan } from "../../adapters/linear/projector.js";
import type { SpecRevision } from "../../types/spec.js";

interface ProjectionMapping {
  specId: string;
  revision: number;
  project: {
    specNodeId: string;
    linearId: string;
  };
  issues: Record<
    string,
    {
      linearId: string;
      identifier: string;
    }
  >;
}

interface ProjectionExecutionResult {
  mappingPath: string;
  project: {
    id: string;
  };
  issues: Array<{
    id: string;
    identifier: string;
  }>;
}

function getMappingPath(rootDir: string, specId: string): string {
  return path.join(rootDir, "specs", specId, "projection.json");
}

async function loadProjectionMapping(rootDir: string, specId: string): Promise<ProjectionMapping | null> {
  const filePath = getMappingPath(rootDir, specId);

  try {
    return JSON.parse(await fs.readFile(filePath, "utf8")) as ProjectionMapping;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

async function saveProjectionMapping(rootDir: string, mapping: ProjectionMapping): Promise<string> {
  const filePath = getMappingPath(rootDir, mapping.specId);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(mapping, null, 2), "utf8");
  return filePath;
}

function getLabelIds(
  capabilities: LinearCapabilities,
  labels: string[]
): string[] {
  return labels
    .map((labelName) => capabilities.labels.find((label) => label.name === labelName)?.id)
    .filter((labelId): labelId is string => Boolean(labelId));
}

function mergeHumanNotes(generatedDescription: string, currentDescription: string | null | undefined): string {
  if (!currentDescription?.includes("## Human Notes")) {
    return generatedDescription;
  }

  const currentNotes = currentDescription.match(/## Human Notes\s*([\s\S]*)$/)?.[1]?.trim();
  if (!currentNotes) {
    return generatedDescription;
  }

  return generatedDescription.replace(/## Human Notes\s*([\s\S]*)$/, `## Human Notes\n${currentNotes}`);
}

export async function executeProjectionPlan(input: {
  rootDir: string;
  client: LinearClient;
  revision: SpecRevision;
  plan: ProjectionPlan;
  capabilities: LinearCapabilities;
}): Promise<ProjectionExecutionResult> {
  const mapping =
    (await loadProjectionMapping(input.rootDir, input.revision.metadata.specId)) ?? {
      specId: input.revision.metadata.specId,
      revision: input.revision.metadata.revision,
      project: {
        specNodeId: "project",
        linearId: ""
      },
      issues: {}
    };

  let projectId = mapping.project.linearId;
  if (!projectId) {
    const projectResponse = (await input.client.execute({
      query: LINEAR_PROJECT_CREATE_MUTATION,
      variables: {
        input: {
          name: input.plan.project.title,
          description: input.plan.project.summary,
          teamIds: input.capabilities.teamId ? [input.capabilities.teamId] : []
        }
      }
    })) as {
      projectCreate: {
        success: boolean;
        project: { id: string };
      };
    };

    if (!projectResponse.projectCreate.success) {
      throw new Error(`Linear projectCreate failed for ${input.plan.project.title}`);
    }

    projectId = projectResponse.projectCreate.project.id;
    mapping.project.linearId = projectId;
  } else {
    const projectUpdateResponse = (await input.client.execute({
      query: LINEAR_PROJECT_UPDATE_MUTATION,
      variables: {
        id: projectId,
        input: {
          name: input.plan.project.title,
          description: input.plan.project.summary
        }
      }
    })) as {
      projectUpdate: {
        success: boolean;
        project: { id: string };
      };
    };

    if (!projectUpdateResponse.projectUpdate.success) {
      throw new Error(`Linear projectUpdate failed for ${input.plan.project.title}`);
    }
  }

  const issues: ProjectionExecutionResult["issues"] = [];

  for (const issue of input.plan.issues) {
    const existingMapping = mapping.issues[issue.provenance.specNodeId];

    if (!existingMapping) {
      const issueCreateResponse = (await input.client.execute({
        query: LINEAR_ISSUE_CREATE_MUTATION,
        variables: {
          input: {
            teamId: input.capabilities.teamId,
            projectId,
            title: issue.title,
            description: issue.description,
            stateId: input.capabilities.defaultStateId,
            labelIds: getLabelIds(input.capabilities, issue.labels)
          }
        }
      })) as {
        issueCreate: {
          success: boolean;
          issue: { id: string; identifier: string; description: string };
        };
      };

      if (!issueCreateResponse.issueCreate.success) {
        throw new Error(`Linear issueCreate failed for ${issue.title}`);
      }

      mapping.issues[issue.provenance.specNodeId] = {
        linearId: issueCreateResponse.issueCreate.issue.id,
        identifier: issueCreateResponse.issueCreate.issue.identifier
      };
      issues.push({
        id: issueCreateResponse.issueCreate.issue.id,
        identifier: issueCreateResponse.issueCreate.issue.identifier
      });
      continue;
    }

    const currentIssue = (await input.client.execute({
      query: LINEAR_ISSUE_QUERY,
      variables: {
        id: existingMapping.linearId
      }
    })) as {
      issue: {
        id: string;
        identifier: string;
        description: string | null;
      } | null;
    };

    const issueUpdateResponse = (await input.client.execute({
      query: LINEAR_ISSUE_UPDATE_MUTATION,
      variables: {
        id: existingMapping.linearId,
        input: {
          projectId,
          title: issue.title,
          description: mergeHumanNotes(issue.description, currentIssue.issue?.description),
          stateId: input.capabilities.defaultStateId,
          labelIds: getLabelIds(input.capabilities, issue.labels)
        }
      }
    })) as {
      issueUpdate: {
        success: boolean;
        issue: { id: string; identifier: string; description: string };
      };
    };

    if (!issueUpdateResponse.issueUpdate.success) {
      throw new Error(`Linear issueUpdate failed for ${issue.title}`);
    }

    mapping.issues[issue.provenance.specNodeId] = {
      linearId: issueUpdateResponse.issueUpdate.issue.id,
      identifier: issueUpdateResponse.issueUpdate.issue.identifier
    };
    issues.push({
      id: issueUpdateResponse.issueUpdate.issue.id,
      identifier: issueUpdateResponse.issueUpdate.issue.identifier
    });
  }

  for (const issue of input.plan.issues) {
    for (const blocker of issue.blockedBy) {
      const currentIssue = mapping.issues[issue.provenance.specNodeId];
      const blockerIssue = mapping.issues[blocker.id];

      if (!currentIssue || !blockerIssue) {
        continue;
      }

      await input.client.execute({
        query: LINEAR_ISSUE_RELATION_CREATE_MUTATION,
        variables: {
          input: {
            type: "blocks",
            issueId: blockerIssue.linearId,
            relatedIssueId: currentIssue.linearId
          }
        }
      });
    }
  }

  mapping.revision = input.revision.metadata.revision;
  const mappingPath = await saveProjectionMapping(input.rootDir, mapping);

  return {
    mappingPath,
    project: {
      id: projectId
    },
    issues
  };
}
