const rawBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
const formatUrl = (url: string) => {
  if (!url) return "";
  let clean = url.trim();
  if (clean.startsWith("http:/") && !clean.startsWith("http://")) {
    clean = clean.replace("http:/", "http://");
  } else if (clean.startsWith("https:/") && !clean.startsWith("https://")) {
    clean = clean.replace("https:/", "https://");
  } else if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
    clean = `http://${clean}`;
  }
  return clean.replace(/\/+$/, "");
};

export const BACKEND_URL = formatUrl(rawBackendUrl);
export const API_BASE = formatUrl(process.env.NEXT_PUBLIC_API_URL || `${BACKEND_URL}/api`);

export const sipanduApi = {
  // Auth (Login & Lupa Password)
  login: async (credentials: { email?: string; username?: string; password: string }) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    return res.json();
  },
  forgotPassword: async (email: string) => {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return res.json();
  },
  verifyResetToken: async (token: string, email: string) => {
    const res = await fetch(`${API_BASE}/auth/verify-reset-token?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`);
    return res.json();
  },
  resetPassword: async (payload: { token: string; email: string; newPassword: string }) => {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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
  getDocuments: async (params?: {
    status?: string;
    search?: string;
    unit_kerja?: string;
    jenis_dokumen?: string;
    page?: number;
    limit?: number;
    user_role?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.status && params.status !== "ALL") query.append("status", params.status);
    if (params?.search) query.append("search", params.search);
    if (params?.unit_kerja && params.unit_kerja !== "ALL") query.append("unit_kerja", params.unit_kerja);
    if (params?.jenis_dokumen && params.jenis_dokumen !== "ALL") query.append("jenis_dokumen", params.jenis_dokumen);
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());
    if (params?.user_role) query.append("user_role", params.user_role);

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
  saveOfficialDoc: async (id: number, payload: { type: string; formData: any; user_name?: string; user_role?: string }) => {
    const res = await fetch(`${API_BASE}/documents/${id}/generate-official`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
  resetOfficialDocs: async (id: number, payload?: { user_name?: string; user_role?: string }) => {
    const res = await fetch(`${API_BASE}/documents/${id}/reset-official`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {}),
    });
    return res.json();
  },
  submitToBiro: async (id: number, payload: { user_name?: string; user_role?: string }) => {
    const res = await fetch(`${API_BASE}/documents/${id}/submit-to-biro`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
  markAsReview: async (id: number, payload: { user_name?: string; user_role?: string }) => {
    const res = await fetch(`${API_BASE}/documents/${id}/review`, {
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
  getAuditTrail: async (params?: { document_id?: number | string; search?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.document_id) query.append("document_id", params.document_id.toString());
    if (params?.search) query.append("search", params.search);
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());

    const queryString = query.toString() ? `?${query.toString()}` : "";
    const res = await fetch(`${API_BASE}/audit-trail${queryString}`);
    return res.json();
  },

  // Monitoring Stats
  getStats: async () => {
    const res = await fetch(`${API_BASE}/monitoring/stats`);
    return res.json();
  },

  // Master Data: Units
  getMasterUnits: async (params?: { search?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search);
    const queryString = query.toString() ? `?${query.toString()}` : "";
    const res = await fetch(`${API_BASE}/master/units${queryString}`);
    return res.json();
  },
  createMasterUnit: async (data: { nama: string; keterangan?: string; is_active?: boolean }) => {
    const res = await fetch(`${API_BASE}/master/units`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  updateMasterUnit: async (id: number, data: { nama?: string; keterangan?: string; is_active?: boolean }) => {
    const res = await fetch(`${API_BASE}/master/units/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  deleteMasterUnit: async (id: number) => {
    const res = await fetch(`${API_BASE}/master/units/${id}`, {
      method: "DELETE",
    });
    return res.json();
  },

  // Master Data: Jenis Dokumen
  getMasterJenisDokumen: async (params?: { search?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search);
    const queryString = query.toString() ? `?${query.toString()}` : "";
    const res = await fetch(`${API_BASE}/master/jenis-dokumen${queryString}`);
    return res.json();
  },
  createMasterJenisDokumen: async (data: { nama: string; keterangan?: string; is_active?: boolean }) => {
    const res = await fetch(`${API_BASE}/master/jenis-dokumen`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  updateMasterJenisDokumen: async (id: number, data: { nama?: string; keterangan?: string; is_active?: boolean }) => {
    const res = await fetch(`${API_BASE}/master/jenis-dokumen/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  deleteMasterJenisDokumen: async (id: number) => {
    const res = await fetch(`${API_BASE}/master/jenis-dokumen/${id}`, {
      method: "DELETE",
    });
    return res.json();
  },
};
