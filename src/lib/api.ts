/**
 * API client for the Admin Panel.
 * Connects to the Go backend at the configured API_BASE_URL.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

// --- Auth ---

let cachedToken: string | null = null;

function getToken(): string {
  if (cachedToken) return cachedToken;
  if (typeof window !== 'undefined') {
    cachedToken = localStorage.getItem('admin_token');
  }
  return cachedToken || '';
}

export function setToken(token: string): void {
  cachedToken = token;
  if (typeof window !== 'undefined') {
    localStorage.setItem('admin_token', token);
  }
}

export function clearToken(): void {
  cachedToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('admin_token');
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(errorBody.error || `Request failed with status ${res.status}`);
  }

  return res.json();
}

// --- Auth API ---

export async function login(username: string, password: string): Promise<{ token: string; username: string; role: string }> {
  const data = await apiFetch<{ token: string; username: string; role: string }>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  setToken(data.token);
  return data;
}

// --- Review API (Admin) ---

export interface ReviewResponse {
  id: string;
  customer_name: string;
  gender: string;
  age: number;
  marital_status: string;
  loan_amount: number;
  is_enterprise: boolean;
  main_bank: string;
  total_debt: number;
  credit_status: string;
  credit_query_1m: number;
  credit_query_3m: number;
  credit_query_6m: number;
  spouse_info: string;
  spouse_cooperate: boolean;
  highlights: string[];
  can_match: boolean;
  visit_time: string;
  created_by: string;
  ai_score: number | null;
  ai_risk_level: string | null;
  ai_summary: string | null;
  created_at: string;
  debt_details: Array<{
    id: string;
    institution: string;
    total_amount: number;
    balance: number;
    loan_method: string;
    loan_due: string;
    repayment_method: string;
  }>;
}

export interface ReviewListResponse {
  data: ReviewResponse[];
  page: number;
  page_size: number;
  total_count: number;
}

export async function listReviews(page = 1, pageSize = 20): Promise<ReviewListResponse> {
  return apiFetch<ReviewListResponse>(`/api/v1/reviews?page=${page}&pageSize=${pageSize}`);
}

export async function getReview(id: string): Promise<ReviewResponse> {
  return apiFetch<ReviewResponse>(`/api/v1/reviews/${id}`);
}

export async function deleteReview(id: string): Promise<void> {
  await apiFetch(`/api/v1/reviews/${id}`, { method: 'DELETE' });
}

// --- Lottery API (Admin) ---

export interface Prize {
  id: string;
  name: string;
  probability: number;
  stock: number;
  image_url: string;
  is_active: boolean;
}

export interface LotteryActivity {
  id: string;
  name: string;
  is_active: boolean;
  start_time: string;
  end_time: string;
  prizes: Prize[];
}

export async function getLotteryActivity(): Promise<LotteryActivity> {
  return apiFetch<LotteryActivity>('/api/v1/lottery/activity');
}

export async function updateLotteryActivity(data: Partial<LotteryActivity>): Promise<LotteryActivity> {
  return apiFetch<LotteryActivity>('/api/v1/lottery/activity', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function addPrize(prize: Omit<Prize, 'id'>): Promise<Prize> {
  return apiFetch<Prize>('/api/v1/lottery/prizes', {
    method: 'POST',
    body: JSON.stringify(prize),
  });
}

export async function deletePrize(prizeId: string): Promise<void> {
  await apiFetch(`/api/v1/lottery/prizes/${prizeId}`, { method: 'DELETE' });
}

export async function getLotteryStats(): Promise<{
  activity_name: string;
  is_active: boolean;
  prize_count: number;
  total_prizes: number;
}> {
  return apiFetch('/api/v1/lottery/stats');
}