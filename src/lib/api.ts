/**
 * API client for the Admin Panel.
 * Connects to the Go backend at the configured API_BASE_URL.
 *
 * V2 (DESIGN_DOC 26-31): Full auth with access/refresh tokens, user management.
 */

// 架构原则：admin/mobile 通过 Nginx Gateway (port 16000) 反向代理访问 backend
// 生产/Docker 环境使用空字符串（相对路径，同源请求经 Nginx 路由 /api/ → go-backend:16080）
// 本地开发可通过 .env.local 设置 NEXT_PUBLIC_API_BASE_URL=http://localhost:16000（走 gateway）
// 或直接连 backend: NEXT_PUBLIC_API_BASE_URL=http://localhost:16080（仅开发调试）
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

// --- Auth ---

interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: {
    id: string;
    username: string;
    display_name: string;
    role: string;
    status: string;
  };
}

let cachedAccessToken: string | null = null;
let cachedRefreshToken: string | null = null;
let tokenExpiresAt: number = 0;

function getAccessToken(): string {
  if (cachedAccessToken && Date.now() < tokenExpiresAt) return cachedAccessToken;
  if (typeof window !== 'undefined') {
    cachedAccessToken = localStorage.getItem('admin_access_token');
    cachedRefreshToken = localStorage.getItem('admin_refresh_token');
    const exp = localStorage.getItem('admin_token_expires');
    if (exp) tokenExpiresAt = parseInt(exp, 10);
  }
  return cachedAccessToken || '';
}

function getRefreshToken(): string {
  if (cachedRefreshToken) return cachedRefreshToken;
  if (typeof window !== 'undefined') {
    cachedRefreshToken = localStorage.getItem('admin_refresh_token');
  }
  return cachedRefreshToken || '';
}

export function setTokens(accessToken: string, refreshToken: string, expiresIn: number): void {
  cachedAccessToken = accessToken;
  cachedRefreshToken = refreshToken;
  tokenExpiresAt = Date.now() + expiresIn * 1000;
  if (typeof window !== 'undefined') {
    localStorage.setItem('admin_access_token', accessToken);
    localStorage.setItem('admin_refresh_token', refreshToken);
    localStorage.setItem('admin_token_expires', tokenExpiresAt.toString());
    // Sync cookie for middleware authentication
    document.cookie = `auth_token=1; path=/; max-age=${expiresIn}; SameSite=Lax`;
  }
}

export function clearTokens(): void {
  cachedAccessToken = null;
  cachedRefreshToken = null;
  tokenExpiresAt = 0;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_refresh_token');
    localStorage.removeItem('admin_token_expires');
  }
}

export function getCachedUser(): AuthTokens['user'] | null {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem('admin_user');
    if (raw) {
      try { return JSON.parse(raw); } catch { /* ignore */ }
    }
  }
  return null;
}

function setCachedUser(user: AuthTokens['user']): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('admin_user', JSON.stringify(user));
  }
}

export function clearCachedUser(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('admin_user');
  }
}

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    setTokens(data.access_token, data.refresh_token, data.expires_in);
    return true;
  } catch {
    return false;
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

  let token = getAccessToken();

  // Auto-refresh if token expired
  if (!token || Date.now() >= tokenExpiresAt) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      token = getAccessToken();
    } else {
      clearTokens();
      clearCachedUser();
    }
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });

  // If 401, try refresh once and retry
  if (res.status === 401 && getRefreshToken()) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${getAccessToken()}`;
      const retryRes = await fetch(url, { ...options, headers });
      if (!retryRes.ok) {
        const errorBody = await retryRes.json().catch(() => ({ error: `HTTP ${retryRes.status}` }));
        throw new Error(errorBody.error || `Request failed with status ${retryRes.status}`);
      }
      return retryRes.json();
    }
    clearTokens();
    clearCachedUser();
    throw new Error('AUTH_TOKEN_EXPIRED: 会话已过期，请重新登录');
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(errorBody.error || `Request failed with status ${res.status}`);
  }

  return res.json();
}

// --- Auth API ---

export async function login(username: string, password: string): Promise<AuthTokens> {
  const data = await apiFetch<AuthTokens>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password, client_type: 'admin' }),
  });
  setTokens(data.access_token, data.refresh_token, data.expires_in);
  setCachedUser(data.user);
  return data;
}

export async function register(
  username: string,
  password: string,
  displayName: string,
  phone?: string,
  email?: string,
  inviteCode?: string
): Promise<AuthTokens> {
  const data = await apiFetch<AuthTokens>('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      username,
      password,
      display_name: displayName,
      phone: phone || '',
      email: email || '',
      invite_code: inviteCode || '',
    }),
  });
  setTokens(data.access_token, data.refresh_token, data.expires_in);
  setCachedUser(data.user);
  return data;
}

export async function getMe(): Promise<AuthTokens['user']> {
  const data = await apiFetch<AuthTokens['user']>('/api/v1/auth/me');
  setCachedUser(data);
  return data;
}

export async function logout(): Promise<void> {
  try {
    await apiFetch('/api/v1/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: getRefreshToken() }),
    });
  } catch { /* best effort */ }
  clearTokens();
  clearCachedUser();
}

// --- User Management API (DESIGN_DOC 29.2) ---

export interface UserItem {
  id: string;
  username: string;
  display_name: string;
  phone: string;
  email: string;
  role: string;
  status: string;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserListResponse {
  data: UserItem[];
  page: number;
  page_size: number;
  total_count: number;
}

export async function listUsers(params: {
  page?: number;
  pageSize?: number;
  keyword?: string;
  role?: string;
  status?: string;
} = {}): Promise<UserListResponse> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
  if (params.keyword) searchParams.set('keyword', params.keyword);
  if (params.role) searchParams.set('role', params.role);
  if (params.status) searchParams.set('status', params.status);

  const qs = searchParams.toString();
  return apiFetch<UserListResponse>(`/api/v1/admin/users${qs ? `?${qs}` : ''}`);
}

export async function getUser(id: string): Promise<UserItem> {
  return apiFetch<UserItem>(`/api/v1/admin/users/${id}`);
}

export async function createUser(data: {
  username: string;
  display_name: string;
  password: string;
  role: string;
  phone?: string;
  email?: string;
}): Promise<UserItem> {
  return apiFetch<UserItem>('/api/v1/admin/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateUser(id: string, data: {
  display_name?: string;
  phone?: string;
  email?: string;
  role?: string;
  status?: string;
}): Promise<UserItem> {
  return apiFetch<UserItem>(`/api/v1/admin/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function updateUserStatus(id: string, status: string): Promise<void> {
  await apiFetch(`/api/v1/admin/users/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export async function resetPassword(id: string, password: string): Promise<void> {
  await apiFetch(`/api/v1/admin/users/${id}/password/reset`, {
    method: 'PUT',
    body: JSON.stringify({ password }),
  });
}

// --- Admin QRCode API (DESIGN_DOC 35.8) ---

export interface AdminQrCodeRecord {
  id: string;
  target_url: string;
  channel: string;
  campaign: string;
  note: string;
  final_url: string;
  access_url?: string;
  status: 'active' | 'disabled';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AdminQrCodeListResponse {
  data: AdminQrCodeRecord[];
  page: number;
  page_size: number;
  total_count: number;
}

export async function createAdminQrCode(data: {
  target_url: string;
  channel?: string;
  campaign?: string;
  note?: string;
  access_base_url?: string;
}): Promise<AdminQrCodeRecord> {
  return apiFetch<AdminQrCodeRecord>('/api/v1/admin/qrcodes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function listAdminQrCodes(params: {
  page?: number;
  pageSize?: number;
  status?: 'active' | 'disabled';
} = {}): Promise<AdminQrCodeListResponse> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
  if (params.status) searchParams.set('status', params.status);

  const qs = searchParams.toString();
  return apiFetch<AdminQrCodeListResponse>(`/api/v1/admin/qrcodes${qs ? `?${qs}` : ''}`);
}

export async function updateAdminQrCodeStatus(id: string, status: 'active' | 'disabled'): Promise<void> {
  await apiFetch(`/api/v1/admin/qrcodes/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
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
  // V2 fields (DESIGN_DOC 16.3)
  customer_type?: "individual" | "enterprise";
  enterprise_name?: string | null;
  unified_social_credit_code?: string | null;
  enterprise_years?: number | null;
  main_business?: string | null;
  monthly_revenue?: number | null;
  controller_cooperate?: boolean | null;
  enterprise_highlights?: string[] | null;
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