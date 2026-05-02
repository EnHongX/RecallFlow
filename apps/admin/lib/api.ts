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

export interface Subject {
  id: number;
  name: string;
  code: string;
}

export interface Question {
  id: number;
  user_id: number;
  student_id: number | null;
  subject_id: number;
  topic_id: number | null;
  type: string;
  prompt: string;
  answer: string;
  explanation: string | null;
  child_explanation: string | null;
  fun_hint: string | null;
  difficulty: string;
  tags: string | null;
  source: string | null;
  grading_method: string;
  status: string;
  subject_name?: string | null;
  student_name?: string | null;
}

export interface QuestionCreate {
  subject_id: number;
  type: string;
  prompt: string;
  answer: string;
  explanation?: string | null;
  child_explanation?: string | null;
  fun_hint?: string | null;
  difficulty?: string;
  tags?: string | null;
  source?: string | null;
  grading_method?: string;
  student_id?: number | null;
}

export interface QuestionUpdate {
  subject_id?: number | null;
  type?: string | null;
  prompt?: string | null;
  answer?: string | null;
  explanation?: string | null;
  child_explanation?: string | null;
  fun_hint?: string | null;
  difficulty?: string | null;
  tags?: string | null;
  source?: string | null;
  grading_method?: string | null;
  status?: string | null;
  student_id?: number | null;
}

export interface QuestionFilter {
  subject_id?: number;
  type?: string;
  grading_method?: string;
  status?: string;
  student_id?: number;
  keyword?: string;
}

export async function getSubjects(): Promise<Subject[]> {
  return fetchApi<Subject[]>("/api/v1/subjects", {
    method: "GET",
  });
}

export async function getQuestions(filter?: QuestionFilter): Promise<Question[]> {
  const params = new URLSearchParams();
  if (filter) {
    if (filter.subject_id !== undefined) params.append("subject_id", filter.subject_id.toString());
    if (filter.type) params.append("type", filter.type);
    if (filter.grading_method) params.append("grading_method", filter.grading_method);
    if (filter.status) params.append("status", filter.status);
    if (filter.student_id !== undefined) params.append("student_id", filter.student_id.toString());
    if (filter.keyword) params.append("keyword", filter.keyword);
  }
  const queryString = params.toString();
  const url = queryString ? `/api/v1/questions?${queryString}` : "/api/v1/questions";
  return fetchApi<Question[]>(url, {
    method: "GET",
  });
}

export async function getQuestion(questionId: number): Promise<Question> {
  return fetchApi<Question>(`/api/v1/questions/${questionId}`, {
    method: "GET",
  });
}

export async function createQuestion(data: QuestionCreate): Promise<Question> {
  return fetchApi<Question>("/api/v1/questions", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateQuestion(questionId: number, data: QuestionUpdate): Promise<Question> {
  return fetchApi<Question>(`/api/v1/questions/${questionId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteQuestion(questionId: number): Promise<SuccessResponse> {
  return fetchApi<SuccessResponse>(`/api/v1/questions/${questionId}`, {
    method: "DELETE",
  });
}

export async function restoreQuestion(questionId: number): Promise<SuccessResponse> {
  return fetchApi<SuccessResponse>(`/api/v1/questions/${questionId}/restore`, {
    method: "POST",
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

export interface CardCreate {
  question_id: number;
  student_id: number;
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

export async function createCard(data: CardCreate): Promise<Card> {
  return fetchApi<Card>("/api/v1/cards", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCard(cardId: number, data: CardUpdate): Promise<Card> {
  return fetchApi<Card>(`/api/v1/cards/${cardId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteCard(cardId: number): Promise<SuccessResponse> {
  return fetchApi<SuccessResponse>(`/api/v1/cards/${cardId}`, {
    method: "DELETE",
  });
}

export async function submitCardPractice(cardId: number, result: "gotit" | "again"): Promise<Card> {
  return fetchApi<Card>(`/api/v1/cards/${cardId}/submit`, {
    method: "POST",
    body: JSON.stringify({ result }),
  });
}

export interface PracticeRecord {
  id: number;
  student_id: number;
  card_id: number;
  result: string;
  submitted_at: string;
  student_name?: string | null;
  card_front?: string | null;
  card_back?: string | null;
}

export async function getPracticeRecords(studentId?: number, limit?: number): Promise<PracticeRecord[]> {
  const params = new URLSearchParams();
  if (studentId !== undefined) params.append("student_id", studentId.toString());
  if (limit !== undefined) params.append("limit", limit.toString());
  const queryString = params.toString();
  const url = queryString ? `/api/v1/practice-records?${queryString}` : "/api/v1/practice-records";
  return fetchApi<PracticeRecord[]>(url, {
    method: "GET",
  });
}

export interface WrongCard {
  id: number;
  student_id: number;
  card_id: number;
  is_mastered: boolean;
  mastered_at: string | null;
  student_name?: string | null;
  card_front?: string | null;
  card_back?: string | null;
  card_status?: string | null;
}

export async function getWrongCards(studentId?: number, isMastered?: boolean): Promise<WrongCard[]> {
  const params = new URLSearchParams();
  if (studentId !== undefined) params.append("student_id", studentId.toString());
  if (isMastered !== undefined) params.append("is_mastered", isMastered.toString());
  const queryString = params.toString();
  const url = queryString ? `/api/v1/wrong-cards?${queryString}` : "/api/v1/wrong-cards";
  return fetchApi<WrongCard[]>(url, {
    method: "GET",
  });
}

export async function markWrongCardAsMastered(wrongCardId: number): Promise<SuccessResponse> {
  return fetchApi<SuccessResponse>(`/api/v1/wrong-cards/${wrongCardId}/master`, {
    method: "POST",
  });
}
