import type { LinearClient } from "./client.js";
import { LINEAR_CAPABILITIES_QUERY } from "./queries.js";

export interface RawLinearCapabilities {
  initiatives: boolean;
  projects: boolean;
  estimates: boolean;
  labelScope: "workspace" | "team";
  teamKey: string;
  states: string[];
  teamId?: string;
  stateIdsByName?: Record<string, string>;
  labels?: Array<{ id: string; name: string }>;
}

export interface LinearCapabilities {
  initiatives: boolean;
  projects: boolean;
  estimates: boolean;
  labelScope: "workspace" | "team";
  teamKey: string;
  teamId?: string;
  states: string[];
  stateIdsByName?: Record<string, string>;
  labels: Array<{ id: string; name: string }>;
  defaultState: string;
  defaultStateId?: string;
}

export function detectLinearCapabilities(input: RawLinearCapabilities): LinearCapabilities {
  const defaultState = input.states.includes("Todo") ? "Todo" : input.states[0];
  if (!defaultState) {
    throw new Error(`No workflow states are configured for team ${input.teamKey}`);
  }

  return {
    ...input,
    labels: input.labels ?? [],
    defaultState,
    defaultStateId: input.stateIdsByName?.[defaultState]
  };
}

export async function discoverLinearCapabilities(input: {
  client: LinearClient;
  teamKey: string;
}): Promise<LinearCapabilities> {
  const response = (await input.client.execute({
    query: LINEAR_CAPABILITIES_QUERY,
    variables: {
      teamKey: input.teamKey
    }
  })) as {
    team?: {
      id: string;
      key: string;
      issueEstimationType: string | null;
      defaultIssueState?: {
        id: string;
        name: string;
      } | null;
      states: {
        nodes: Array<{
          id: string;
          name: string;
          type: string;
        }>;
      };
      labels: {
        nodes: Array<{
          id: string;
          name: string;
        }>;
      };
    };
    teams?: {
      nodes: Array<{
        id: string;
        key: string;
        issueEstimationType: string | null;
        defaultIssueState?: {
          id: string;
          name: string;
        } | null;
        states: {
          nodes: Array<{
            id: string;
            name: string;
            type: string;
          }>;
        };
        labels: {
          nodes: Array<{
            id: string;
            name: string;
            team?: { id: string; key: string } | null;
          }>;
        };
      }>;
    };
    issueLabels?: {
      nodes: Array<{
        id: string;
        name: string;
        team?: { id: string; key: string } | null;
      }>;
    };
  };

  const team = response.team ?? response.teams?.nodes[0];
  if (!team) {
    throw new Error(`Linear team ${input.teamKey} was not found`);
  }

  const labels = [
    ...(team.labels.nodes ?? []),
    ...((response.issueLabels?.nodes ?? []).filter((label) => !label.team || label.team.key === team.key))
  ].filter(
    (label, index, collection) =>
      collection.findIndex((candidate) => candidate.id === label.id) === index
  );

  return detectLinearCapabilities({
    initiatives: false,
    projects: true,
    estimates: Boolean(team.issueEstimationType) && team.issueEstimationType !== "notUsed",
    labelScope: "team",
    teamKey: team.key,
    teamId: team.id,
    states: team.states.nodes.map((state) => state.name),
    stateIdsByName: Object.fromEntries(
      team.states.nodes.map((state) => [state.name, state.id])
    ),
    labels: labels.map((label) => ({ id: label.id, name: label.name }))
  });
}
