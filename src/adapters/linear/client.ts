export interface LinearClientRequest {
  query: string;
  variables?: Record<string, unknown>;
}

export interface LinearClient {
  execute(request: LinearClientRequest): Promise<unknown>;
}
