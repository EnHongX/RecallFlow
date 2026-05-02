const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5005";

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
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

interface ApiErrorResponse {
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, unknown>;
  };
  code?: string;
  message?: string;
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

  const data = (await response.json()) as ApiErrorResponse | T;

  if (!response.ok) {
    const errorData = data as ApiErrorResponse;
    throw {
      code: errorData.error?.code ?? errorData.code ?? `HTTP_${response.status}`,
      message: errorData.error?.message ?? errorData.message ?? "请求失败",
      details: errorData.error?.details,
    } as ApiError;
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

export interface Card {
  id: number;
  student_id: number;
  question_id: number;
  card_type: string;
  front: string;
  back: string;
  child_explanation: string | null;
  fun_hint: string | null;
  status: string;
  grading_method: string;
  next_review_at: string | null;
  student_name?: string | null;
  question_prompt?: string | null;
}

export interface CardUpdate {
  front?: string | null;
  back?: string | null;
  child_explanation?: string | null;
  fun_hint?: string | null;
  status?: string | null;
}

export interface CardFilter {
  student_id?: number;
  status?: string;
}

export async function getCards(filter?: CardFilter): Promise<Card[]> {
  const params = new URLSearchParams();
  if (filter) {
    if (filter.student_id !== undefined) params.append("student_id", filter.student_id.toString());
    if (filter.status) params.append("status", filter.status);
  }
  const queryString = params.toString();
  const url = queryString ? `/api/v1/cards?${queryString}` : "/api/v1/cards";
  return fetchApi<Card[]>(url, {
    method: "GET",
  });
}

export async function getCard(cardId: number): Promise<Card> {
  return fetchApi<Card>(`/api/v1/cards/${cardId}`, {
    method: "GET",
  });
}

export async function updateCard(cardId: number, data: CardUpdate): Promise<Card> {
  return fetchApi<Card>(`/api/v1/cards/${cardId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function submitCardPractice(cardId: number, result: "gotit" | "again"): Promise<Card> {
  return fetchApi<Card>(`/api/v1/cards/${cardId}/submit`, {
    method: "POST",
    body: JSON.stringify({ result }),
  });
}
