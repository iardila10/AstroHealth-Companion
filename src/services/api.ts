
const API_URL = "http://localhost:8000";

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

  // Check for request errors
  if (!response.ok) {
    throw new Error(
      `Request failed: ${response.status} - ${response.statusText}`
    );
  }

  // Handle empty responses
  if (response.status === 204) {
    return undefined as T;
  }

  // Parse JSON response
  return await response.json() as T;
}

// HTTP methods
const api = {

  // GET: Retrieve data
  get: <T>(endpoint: string) =>
    apiRequest<T>(endpoint),

  // POST: Send new data
  post: <T>(endpoint: string, data: unknown) =>
    apiRequest<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // PUT: Update existing data
  put: <T>(endpoint: string, data: unknown) =>
    apiRequest<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // DELETE: Remove data
  delete: <T>(endpoint: string) =>
    apiRequest<T>(endpoint, {
      method: "DELETE",
    }),

};

export default api;
