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

export interface Student {
  id: number;
  name: string;
  grade: string;
  is_current: boolean;
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
  return fetchApi<User>("/api/v1/me", {
    method: "GET",
  });
}

export async function logout(): Promise<SuccessResponse> {
  return fetchApi<SuccessResponse>("/api/v1/auth/logout", {
    method: "POST",
  });
}

export async function getStudents(): Promise<Student[]> {
  return fetchApi<Student[]>("/api/v1/students", {
    method: "GET",
  });
}

export async function createStudent(name: string, grade: string): Promise<Student> {
  return fetchApi<Student>("/api/v1/students", {
    method: "POST",
    body: JSON.stringify({ name, grade }),
  });
}

export async function updateStudent(
  studentId: number,
  name: string,
  grade: string
): Promise<Student> {
  return fetchApi<Student>(`/api/v1/students/${studentId}`, {
    method: "PUT",
    body: JSON.stringify({ name, grade }),
  });
}

export async function setCurrentStudent(studentId: number): Promise<SuccessResponse> {
  return fetchApi<SuccessResponse>(`/api/v1/students/${studentId}/set-current`, {
    method: "POST",
  });
}

export async function getCurrentStudent(): Promise<Student | null> {
  return fetchApi<Student | null>("/api/v1/students/current", {
    method: "GET",
  });
}
