import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// In-memory token storage (XSS immune - never stored in localStorage)
let inMemoryAccessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  inMemoryAccessToken = token;
};

export const getAccessToken = (): string | null => {
  return inMemoryAccessToken;
};

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api/v1',
  withCredentials: true, // Guarantees HttpOnly refresh cookies are sent
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Injects Bearer token from memory
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (inMemoryAccessToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${inMemoryAccessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Concurrency queue for token rotation
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token!);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Catches 401 and performs Silent Token Refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Ignore 401s from login or refresh requests themselves to prevent loops
    if (
      !originalRequest ||
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/refresh')
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue parallel requests while refresh is in-flight
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call backend /auth/refresh with HttpOnly cookie automatically passed
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/auth/refresh`,
          {},
          { withCredentials: true },
        );

        const newAccessToken = response.data?.data?.accessToken;
        setAccessToken(newAccessToken);

        // Notify and retry all waiting requests
        processQueue(null, newAccessToken);
        isRefreshing = false;

        // Retry original failed request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        setAccessToken(null);

        // If refresh fails in browser, navigate to login
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login?session_expired=true';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

