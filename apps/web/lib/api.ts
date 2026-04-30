const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5005";

export interface ApiError {
  success: boolean;
  code: string;
  message: string;
}

export interface User {
  id: number;
  phone: string;
  display_name: string | null;
}

export interface SuccessResponse {
  success: boolean;
  message: string;
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw data as ApiError;
  }

  return data as T;
}

export async function register(phone: string, password: string): Promise<User> {
  return fetchApi<User>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify({ phone, password }),
  });
}

export async function login(phone: string, password: string): Promise<User> {
  return fetchApi<User>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ phone, password }),
  });
}

export async function getCurrentUser(): Promise<User> {
  return fetchApi<User>("/api/v1/auth/me", {
    method: "GET",
  });
}

export async function logout(): Promise<SuccessResponse> {
  return fetchApi<SuccessResponse>("/api/v1/auth/logout", {
    method: "POST",
  });
}
