import type { LinearClient, LinearClientRequest } from "./client.js";

export function createLinearHttpClient(input: {
  apiKey: string;
  endpoint?: string;
}): LinearClient {
  const endpoint = input.endpoint ?? "https://api.linear.app/graphql";

  return {
    async execute(request: LinearClientRequest): Promise<unknown> {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: input.apiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(request)
      });

      const payload = (await response.json()) as {
        data?: unknown;
        errors?: Array<{ message: string }>;
      };

      if (!response.ok || payload.errors?.length) {
        const message = payload.errors?.map((error) => error.message).join("; ") ?? response.statusText;
        throw new Error(`Linear request failed: ${message}`);
      }

      return payload.data;
    }
  };
}
