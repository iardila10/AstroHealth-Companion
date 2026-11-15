
const configuredApiUrl =
  import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const API_URL = (
  configuredApiUrl.startsWith("http://") ||
  configuredApiUrl.startsWith("https://")
    ? configuredApiUrl
    : `https://${configuredApiUrl}`
).replace(/\/$/, "");

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

// Main function for handling HTTP requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {

  const headers = new Headers(options.headers);

  headers.set("Content-Type", "application/json");

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  );

  if (!response.ok) {
    const body = await response.text();
    let detail = body;

    if (body) {
      try {
        const parsed = JSON.parse(body) as { detail?: unknown };
        detail =
          typeof parsed.detail === "string"
            ? parsed.detail
            : parsed.detail === undefined
              ? body
              : JSON.stringify(parsed.detail);
      } catch {
        detail = body;
      }
    }

    throw new ApiRequestError(
      detail || `Request failed: ${response.status} - ${response.statusText}`,
      response.status
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

const api = {
  get: <T>(endpoint: string) =>
    apiRequest<T>(endpoint),

  post: <T>(endpoint: string, data: unknown) =>
    apiRequest<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  put: <T>(endpoint: string, data: unknown) =>
    apiRequest<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: <T>(endpoint: string) =>
    apiRequest<T>(endpoint, {
      method: "DELETE",
    }),
};

export default api;
