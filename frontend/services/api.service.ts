const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const sipanduApi = {
  // Auth (Login menggunakan Email)
  login: async (credentials: { email?: string; username?: string; password: string }) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    return res.json();
  },

  // Users CRUD with Search, Page, Size, Role params
  getUsers: async (params?: { search?: string; role?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search);
    if (params?.role && params.role !== "ALL") query.append("role", params.role);
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());

    const res = await fetch(`${API_BASE}/users?${query.toString()}`);
    return res.json();
  },
  getUserById: async (id: number) => {
    const res = await fetch(`${API_BASE}/users/${id}`);
    return res.json();
  },
  createUser: async (userData: any) => {
    const res = await fetch(`${API_BASE}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    return res.json();
  },
  updateUser: async (id: number, userData: any) => {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    return res.json();
  },
  changePassword: async (id: number, payload: { currentPassword: string; newPassword: string }) => {
    const res = await fetch(`${API_BASE}/users/${id}/password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
  deleteUser: async (id: number) => {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: "DELETE",
    });
    return res.json();
  },

  // Documents
  getDocuments: async (params?: { status?: string; search?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.status && params.status !== "ALL") query.append("status", params.status);
    if (params?.search) query.append("search", params.search);
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());

    const res = await fetch(`${API_BASE}/documents?${query.toString()}`);
    return res.json();
  },
  getDocumentById: async (id: number) => {
    const res = await fetch(`${API_BASE}/documents/${id}`);
    return res.json();
  },
  createDocument: async (formData: FormData) => {
    const res = await fetch(`${API_BASE}/documents`, {
      method: "POST",
      body: formData,
    });
    return res.json();
  },
  editDocument: async (id: number, formData: FormData) => {
    const res = await fetch(`${API_BASE}/documents/${id}`, {
      method: "PUT",
      body: formData,
    });
    return res.json();
  },
  verifyDocument: async (id: number, payload: { action: string; pesan?: string; verifier_name?: string; verifier_role?: string; verifier_id?: string }) => {
    const res = await fetch(`${API_BASE}/documents/${id}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
  reviseDocument: async (id: number, formData: FormData) => {
    const res = await fetch(`${API_BASE}/documents/${id}/revisi`, {
      method: "PUT",
      body: formData,
    });
    return res.json();
  },
  updateStage: async (id: number, payload: { next_stage: string; user_name?: string; user_role?: string; note?: string }) => {
    const res = await fetch(`${API_BASE}/documents/${id}/stage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
  deleteDocument: async (id: number, params?: { user_name?: string; user_role?: string }) => {
    const query = new URLSearchParams();
    if (params?.user_name) query.append("user_name", params.user_name);
    if (params?.user_role) query.append("user_role", params.user_role);

    const res = await fetch(`${API_BASE}/documents/${id}?${query.toString()}`, {
      method: "DELETE",
    });
    return res.json();
  },
  deleteAttachment: async (attachmentId: number | string, params?: { user_name?: string; user_role?: string }) => {
    const query = new URLSearchParams();
    if (params?.user_name) query.append("user_name", params.user_name);
    if (params?.user_role) query.append("user_role", params.user_role);

    const res = await fetch(`${API_BASE}/documents/attachments/${attachmentId}?${query.toString()}`, {
      method: "DELETE",
    });
    return res.json();
  },

  // Audit Trail
  getAuditTrail: async (documentId?: number) => {
    const query = documentId ? `?document_id=${documentId}` : "";
    const res = await fetch(`${API_BASE}/audit-trail${query}`);
    return res.json();
  },

  // Monitoring Stats
  getStats: async () => {
    const res = await fetch(`${API_BASE}/monitoring/stats`);
    return res.json();
  },
};
