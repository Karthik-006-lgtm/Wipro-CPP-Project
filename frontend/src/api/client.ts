import {
  BackendHealthResponse,
  ResumeParseResponse,
  CodingLanguage,
  CodingProblem,
  CodeExecutionRequest,
  CodeExecutionResponse,
  CodeSubmitRequest,
  CodeSubmitResponse,
  Judge0StatusResponse,
  StarEvaluationRequest,
  StarEvaluationResponse,
  ArchitectureEvaluationRequest,
  ArchitectureEvaluationResponse,
  VideoAuditRequest,
  VideoAuditResponse,
  PreparationRecord,
  PreparationRecordCreate,
  PreparationRecordListResponse,
  ResumeGeneratorRequest,
  ResumePreviewResponse,
  AssistantStatusResponse,
  AssistantChatRequest,
  AssistantChatResponse,
  CompanyProfile,
  CompanyListResponse,
  CompanyMatchResponse,
  User,
  AuthResponse,
  ForgotPasswordResponse,
  UserActivity,
  ProfileDashboardResponse,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

let currentAuthToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('careernova_auth_token') : null;

export function setAuthToken(token: string | null) {
  currentAuthToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('careernova_auth_token', token);
    } else {
      localStorage.removeItem('careernova_auth_token');
    }
  }
}

export function getAuthToken(): string | null {
  return currentAuthToken;
}

export class ApiClientError extends Error {
  status?: number;
  data?: any;
  code?: string;
  email?: string;

  constructor(message: string, status?: number, data?: any) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.data = data;
    if (data && typeof data === 'object') {
      this.code = data.code;
      this.email = data.email;
    }
  }
}

/**
 * Standard fetch wrapper with timeout, token injection, and error handling.
 */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
  const controller = new AbortController();
  // Allow 20s timeout for document upload and code execution
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (currentAuthToken && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${currentAuthToken}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMsg = `Server error (${response.status})`;
      let errorData: any = null;
      try {
        errorData = await response.json();
        if (errorData?.detail) {
          if (typeof errorData.detail === 'string') {
            errorMsg = errorData.detail;
          } else if (typeof errorData.detail === 'object' && errorData.detail.message) {
            errorMsg = errorData.detail.message;
          } else {
            errorMsg = JSON.stringify(errorData.detail);
          }
        } else if (errorData?.message) {
          errorMsg = errorData.message;
        }
      } catch {
        // Fallback to text status
      }
      throw new ApiClientError(errorMsg, response.status, errorData?.detail || errorData);
    }

    return await response.json() as T;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new ApiClientError('Request timed out while connecting to backend service.');
    }
    if (err instanceof ApiClientError) {
      throw err;
    }
    throw new ApiClientError(err?.message || 'Failed to communicate with backend service.');
  }
}

export const apiClient = {
  getBaseUrl: () => API_BASE_URL,
  getHealth: () => request<BackendHealthResponse>('/api/v1/health'),
  getAvatarUrl: (urlOrPath: string | null | undefined): string | null => {
    if (!urlOrPath) return null;
    if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) return urlOrPath;
    return `${API_BASE_URL.replace(/\/$/, '')}${urlOrPath.startsWith('/') ? urlOrPath : `/${urlOrPath}`}`;
  },

  // Authentication & Sessions
  registerUser: (data: { email: string; full_name: string; password: string }) =>
    request<AuthResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  loginUser: (data: { email: string; password: string }) =>
    request<AuthResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logoutUser: () =>
    request<{ message: string }>('/api/v1/auth/logout', {
      method: 'POST',
    }),

  getCurrentUser: () =>
    request<User>('/api/v1/auth/me'),

  forgotPassword: (data: { email: string }) =>
    request<ForgotPasswordResponse>('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  resetPassword: (data: { token: string; new_password: string }) =>
    request<AuthResponse>('/api/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // User Profile & Activity
  getProfile: () =>
    request<User>('/api/v1/profile/'),

  updateProfile: (data: { full_name?: string; github_url?: string; linkedin_url?: string }) =>
    request<User>('/api/v1/profile/', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<User>('/api/v1/profile/photo', {
      method: 'POST',
      body: formData,
    });
  },

  removeAvatar: () =>
    request<User>('/api/v1/profile/photo', {
      method: 'DELETE',
    }),

  getProfileActivity: () =>
    request<ProfileDashboardResponse>('/api/v1/profile/activity'),

  recordActivity: (data: { activity_type: string; title: string; status?: string; metadata_json?: Record<string, any> }) =>
    request<UserActivity>('/api/v1/profile/activity', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Resume Parsing
  parseResume: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<ResumeParseResponse>('/api/v1/resumes/parse', {
      method: 'POST',
      body: formData,
    });
  },

  // Coding & Sandbox
  getCodingLanguages: () => request<CodingLanguage[]>('/api/v1/coding/languages'),
  getCodingTopics: () => request<string[]>('/api/v1/coding/topics'),
  getCodingProblems: (params?: { category?: string; difficulty?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append('category', params.category);
    if (params?.difficulty) searchParams.append('difficulty', params.difficulty);
    if (params?.search) searchParams.append('search', params.search);
    const queryStr = searchParams.toString();
    return request<CodingProblem[]>(`/api/v1/coding/problems${queryStr ? `?${queryStr}` : ''}`);
  },
  executeCode: (payload: CodeExecutionRequest) =>
    request<CodeExecutionResponse>('/api/v1/coding/execute', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  submitCode: (payload: CodeSubmitRequest) =>
    request<CodeSubmitResponse>('/api/v1/coding/submit', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getJudge0Status: () => request<Judge0StatusResponse>('/api/v1/coding/status'),

  // Interview & Audits
  evaluateStarBehavioral: (payload: StarEvaluationRequest) =>
    request<StarEvaluationResponse>('/api/v1/interview/behavioral/evaluate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  evaluateArchitecture: (payload: ArchitectureEvaluationRequest) =>
    request<ArchitectureEvaluationResponse>('/api/v1/interview/architecture/evaluate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  auditVideoSession: (payload: VideoAuditRequest) =>
    request<VideoAuditResponse>('/api/v1/interview/video/audit', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  auditVideo: (payload: VideoAuditRequest) =>
    request<VideoAuditResponse>('/api/v1/interview/video/audit', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Preparation Records (Database connection)
  createPreparationRecord: (payload: PreparationRecordCreate) =>
    request<PreparationRecord>('/api/v1/records/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getPreparationRecords: (practiceType?: string, limit = 50, offset = 0) => {
    const params = new URLSearchParams();
    if (practiceType && practiceType !== 'all') {
      params.append('practice_type', practiceType);
    }
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());
    return request<PreparationRecordListResponse>(`/api/v1/records/?${params.toString()}`);
  },
  getPreparationRecord: (id: number) =>
    request<PreparationRecord>(`/api/v1/records/${id}`),
  deletePreparationRecord: (id: number) =>
    request<{ success: boolean; message: string; id: number }>(`/api/v1/records/${id}`, {
      method: 'DELETE',
    }),

  // Resume Generator
  previewResume: (payload: ResumeGeneratorRequest) =>
    request<ResumePreviewResponse>('/api/v1/resumes/preview', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  exportResumePdf: (payload: ResumeGeneratorRequest) =>
    downloadBinaryFile('/api/v1/resumes/generate/pdf', payload),
  exportResumeDocx: (payload: ResumeGeneratorRequest) =>
    downloadBinaryFile('/api/v1/resumes/generate/docx', payload),

  // Global AI Assistant
  getAssistantStatus: () => request<AssistantStatusResponse>('/api/v1/assistant/status'),
  chatAssistant: (payload: AssistantChatRequest) =>
    request<AssistantChatResponse>('/api/v1/assistant/chat', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  sendAssistantChat: (payload: AssistantChatRequest) =>
    request<AssistantChatResponse>('/api/v1/assistant/chat', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Company Intelligence & Skills Matcher
  getCompanies: (query?: string) => {
    const params = new URLSearchParams();
    if (query?.trim()) params.append('q', query.trim());
    const qStr = params.toString();
    return request<CompanyListResponse>(`/api/v1/companies/${qStr ? `?${qStr}` : ''}`);
  },
  getCompany: (idOrSlug: string) =>
    request<CompanyProfile>(`/api/v1/companies/${encodeURIComponent(idOrSlug)}`),
  matchCompanies: (skills: string[]) =>
    request<CompanyMatchResponse>('/api/v1/companies/match', {
      method: 'POST',
      body: JSON.stringify({ skills }),
    }),
};

async function downloadBinaryFile(
  path: string,
  payload: any
): Promise<{ blob: Blob; filename: string }> {
  const url = `${API_BASE_URL}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (currentAuthToken) {
    headers['Authorization'] = `Bearer ${currentAuthToken}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMsg = `Export failed with status ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson?.detail) {
        errorMsg = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // Ignore non-json
    }
    throw new ApiClientError(errorMsg, response.status);
  }

  const contentDisposition = response.headers.get('Content-Disposition') || '';
  let filename = 'Resume_Export';
  const match = contentDisposition.match(/filename=["']?([^"';]+)["']?/i);
  if (match && match[1]) {
    filename = match[1].trim();
  }

  const blob = await response.blob();
  return { blob, filename };
}
