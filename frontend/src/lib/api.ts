import axios, { AxiosError } from "axios";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get("mrv_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      Cookies.remove("mrv_token");
      Cookies.remove("mrv_user");
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail.map((d) => d.msg).join(", ");
  }
  return "Beklenmedik bir hata oluştu";
}

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post("/api/v1/auth/login", { email, password }),
  register: (data: Record<string, unknown>) =>
    api.post("/api/v1/auth/register", data),
  me: () => api.get("/api/v1/auth/me"),
};

// Ships
export const shipsApi = {
  list: () => api.get("/api/ships"),
  get: (id: number) => api.get(`/api/ships/${id}`),
  create: (data: Record<string, unknown>) => api.post("/api/ships", data),
  update: (id: number, data: Record<string, unknown>) =>
    api.put(`/api/ships/${id}`, data),
  delete: (id: number) => api.delete(`/api/ships/${id}`),
};

// Monitoring Plans
export const plansApi = {
  list: (shipId?: number) =>
    api.get("/api/monitoring-plans", { params: shipId ? { ship_id: shipId } : {} }),
  get: (id: number) => api.get(`/api/monitoring-plans/${id}`),
  create: (data: Record<string, unknown>) => api.post("/api/monitoring-plans", data),
  update: (id: number, data: Record<string, unknown>) =>
    api.put(`/api/monitoring-plans/${id}`, data),
};

// Emission Reports
export const reportsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get("/api/emission-reports", { params }),
  get: (id: number) => api.get(`/api/emission-reports/${id}`),
  create: (data: Record<string, unknown>) => api.post("/api/emission-reports", data),
  update: (id: number, data: Record<string, unknown>) =>
    api.put(`/api/emission-reports/${id}`, data),
  submit: (id: number) => api.post(`/api/emission-reports/${id}/submit`),
  delete: (id: number) => api.delete(`/api/emission-reports/${id}`),
};

// Verifications
export const verificationsApi = {
  list: () => api.get("/api/verifications"),
  get: (id: number) => api.get(`/api/verifications/${id}`),
  assign: (data: Record<string, unknown>) => api.post("/api/verifications", data),
  update: (id: number, data: Record<string, unknown>) =>
    api.patch(`/api/verifications/${id}`, data),
};

// Compliance Documents
export const docsApi = {
  list: (shipId?: number) =>
    api.get("/api/compliance-documents", { params: shipId ? { ship_id: shipId } : {} }),
  get: (id: number) => api.get(`/api/compliance-documents/${id}`),
  create: (data: Record<string, unknown>) => api.post("/api/compliance-documents", data),
};

// Ship Reports & Dataset Versions
export const shipReportsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get("/api/ship-reports", { params }),
  datasetVersions: () => api.get("/api/dataset-versions"),
};

// Özel mod
export const ozelApi = {
  filom: (params?: Record<string, unknown>) => api.get("/api/ozel/filom", { params }),
  sirketlerim: (params?: Record<string, unknown>) => api.get("/api/ozel/sirketlerim", { params }),
  uyumluluk: (params?: Record<string, unknown>) => api.get("/api/ozel/uyumluluk", { params }),
};

// Stats
export const statsApi = {
  get: () => api.get("/api/stats"),
  verifiers: () => api.get("/api/stats/verifiers"),
};
