const API_BASE = (import.meta as any).env?.VITE_API_URL || '/api';

export interface RequestOptions extends RequestInit {
  data?: any;
  params?: Record<string, string | number | boolean | undefined>;
}

export async function apiRequest<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { data, params, headers, ...customConfig } = options;

  let url = `${API_BASE}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const qs = searchParams.toString();
    if (qs) {
      url += (url.includes('?') ? '&' : '?') + qs;
    }
  }

  const config: RequestInit = {
    ...customConfig,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    credentials: 'include',
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    let errorMessage = `HTTP error ${response.status}`;
    try {
      const errorJson = await response.json();
      errorMessage = errorJson.error || errorMessage;
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  get: <T = any>(url: string, options?: RequestOptions) => apiRequest<T>(url, { method: 'GET', ...options }),
  post: <T = any>(url: string, data?: any, options?: RequestOptions) =>
    apiRequest<T>(url, { method: 'POST', data, ...options }),
  put: <T = any>(url: string, data?: any, options?: RequestOptions) =>
    apiRequest<T>(url, { method: 'PUT', data, ...options }),
  delete: <T = any>(url: string, options?: RequestOptions) =>
    apiRequest<T>(url, { method: 'DELETE', ...options }),
};
