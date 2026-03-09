export const LINEAR_CAPABILITIES_QUERY = `
  query LinearCapabilities($teamKey: String!) {
    teams(filter: { key: { eq: $teamKey } }, first: 1) {
      nodes {
        id
        key
        issueEstimationType
        defaultIssueState {
          id
          name
        }
        states {
          nodes {
            id
            name
            type
          }
        }
        labels {
          nodes {
            id
            name
            team {
              id
              key
            }
          }
        }
      }
    }
    issueLabels(first: 100) {
      nodes {
        id
        name
        team {
          id
          key
        }
      }
    }
  }
`;

export const LINEAR_PROJECT_CREATE_MUTATION = `
  mutation ProjectCreate($input: ProjectCreateInput!) {
    projectCreate(input: $input) {
      success
      project {
        id
      }
    }
  }
`;

export const LINEAR_PROJECT_UPDATE_MUTATION = `
  mutation ProjectUpdate($id: String!, $input: ProjectUpdateInput!) {
    projectUpdate(id: $id, input: $input) {
      success
      project {
        id
      }
    }
  }
`;

export const LINEAR_ISSUE_CREATE_MUTATION = `
  mutation IssueCreate($input: IssueCreateInput!) {
    issueCreate(input: $input) {
      success
      issue {
        id
        identifier
        description
      }
    }
  }
`;

export const LINEAR_ISSUE_UPDATE_MUTATION = `
  mutation IssueUpdate($id: String!, $input: IssueUpdateInput!) {
    issueUpdate(id: $id, input: $input) {
      success
      issue {
        id
        identifier
        description
      }
    }
  }
`;

export const LINEAR_ISSUE_RELATION_CREATE_MUTATION = `
  mutation IssueRelationCreate($input: IssueRelationCreateInput!) {
    issueRelationCreate(input: $input) {
      success
      issueRelation {
        id
      }
    }
  }
`;

export const LINEAR_ISSUE_QUERY = `
  query Issue($id: String!) {
    issue(id: $id) {
      id
      identifier
      description
    }
  }
`;

export const LINEAR_ISSUE_STATUS_QUERY = `
  query IssueStatus($id: String!) {
    issue(id: $id) {
      id
      identifier
      state {
        name
        type
      }
    }
  }
`;
