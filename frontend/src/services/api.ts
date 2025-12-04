import axios from '../config/axios';

// Types
export interface User {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

export interface SetPasswordRequest {
  token: string;
  password: string;
}

export interface ApiError {
  error: string;
  message: string;
}

export interface Document {
  id: number;
  label: string;
  description: string;
  document_type: {
    id: number;
    label: string;
  };
  datetime_created: string;
  language: string;
  uuid: string;
}

export interface DocumentType {
  id: number;
  label: string;
}

export interface DocumentAnalysis {
  documentId: number;
  summary: string;
  keywords: string[];
}

export interface AnalysisJob {
  id: string;
  documentId: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  result?: DocumentAnalysis;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

// Authentication API
export const authApi = {
  // Login
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await axios.post<LoginResponse>('/auth/login', data);
    return response.data;
  },

  // Get current user info
  async me(): Promise<{ user: User }> {
    const response = await axios.get<{ user: User }>('/auth/me');
    return response.data;
  },

  // Set password (from email token)
  async setPassword(data: SetPasswordRequest): Promise<{ message: string }> {
    const response = await axios.post<{ message: string }>('/auth/set-password', data);
    return response.data;
  },

  // Request password reset
  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await axios.post<{ message: string }>('/auth/forgot-password', { email });
    return response.data;
  },
};

// Documents API
export const documentsApi = {
  // Get all documents
  async list(page: number = 1, pageSize: number = 50): Promise<{
    count: number;
    results: Document[];
    next: string | null;
    previous: string | null;
  }> {
    const response = await axios.get('/documents', {
      params: { page, page_size: pageSize },
    });
    return response.data;
  },

  // Get document by ID
  async get(id: number): Promise<Document> {
    const response = await axios.get(`/documents/${id}`);
    return response.data;
  },

  // Upload document
  async upload(file: File, documentTypeId: number, label?: string): Promise<{ message: string; document: Document }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentTypeId', documentTypeId.toString());
    if (label) {
      formData.append('label', label);
    }
    const response = await axios.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Download document
  async download(id: number): Promise<Blob> {
    const response = await axios.get(`/documents/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Delete document
  async delete(id: number): Promise<{ message: string }> {
    const response = await axios.delete(`/documents/${id}`);
    return response.data;
  },

  // Get document types
  async getTypes(): Promise<DocumentType[]> {
    const response = await axios.get('/documents/types');
    return response.data;
  },

  // Search documents
  async search(query: string): Promise<Document[]> {
    const response = await axios.get('/documents/search', {
      params: { q: query },
    });
    return response.data;
  },

  // Check OCR processing status
  async checkOCRStatus(id: number): Promise<{
    ready: boolean;
    pageCount: number;
    processedPages: number;
  }> {
    const response = await axios.get(`/documents/${id}/ocr-status`);
    return response.data;
  },
};

// AI API
export const aiApi = {
  // Analyze document with AI (async - returns jobId)
  async analyze(documentId: number): Promise<{ success: boolean; message: string; jobId: string; documentId: number }> {
    const response = await axios.post('/ai/analyze', { documentId });
    return response.data;
  },

  // Check AI service health
  async health(): Promise<{ status: string; service: string; model: string }> {
    const response = await axios.get('/ai/health');
    return response.data;
  },
};

// Jobs API
export const jobsApi = {
  // Get job status
  async getJobStatus(jobId: string): Promise<{ success: boolean; data: AnalysisJob }> {
    const response = await axios.get(`/jobs/${jobId}`);
    return response.data;
  },

  // Get all user jobs
  async getUserJobs(limit: number = 20): Promise<{ success: boolean; data: AnalysisJob[] }> {
    const response = await axios.get('/jobs', {
      params: { limit },
    });
    return response.data;
  },

  // Poll job until completed (helper function)
  async pollJobUntilComplete(
    jobId: string,
    onProgress?: (job: AnalysisJob) => void,
    maxAttempts: number = 60,
    intervalMs: number = 3000
  ): Promise<AnalysisJob> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const response = await this.getJobStatus(jobId);
      const job = response.data;

      // Call progress callback
      if (onProgress) {
        onProgress(job);
      }

      // Check if job is finished
      if (job.status === 'COMPLETED') {
        return job;
      }

      if (job.status === 'FAILED') {
        throw new Error(job.error || 'Analyse échouée');
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    throw new Error('Délai d\'attente dépassé pour l\'analyse');
  },
};

// Admin API
export const adminApi = {
  // Get all users
  async getUsers(): Promise<User[]> {
    const response = await axios.get<User[]>('/admin/users');
    return response.data;
  },

  // Create user (invite)
  async inviteUser(email: string, firstName?: string, lastName?: string, role?: 'USER' | 'CONSULTANT' | 'ADMIN'): Promise<any> {
    const response = await axios.post('/admin/invite', {
      email,
      firstName,
      lastName,
      role,
      sendEmail: true,
    });
    return response.data;
  },

  // Update user role
  async updateUserRole(userId: string, role: 'USER' | 'CONSULTANT' | 'ADMIN'): Promise<{ message: string }> {
    const response = await axios.patch(`/admin/users/${userId}/role`, { role });
    return response.data;
  },

  // Delete user
  async deleteUser(userId: string): Promise<{ message: string }> {
    const response = await axios.delete(`/admin/users/${userId}`);
    return response.data;
  },
};

// Access API
export interface TemporaryAccess {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
}

export const accessApi = {
  // Admin: Create temporary access for a user
  async createAccess(userId: string, startDate: string, endDate: string): Promise<TemporaryAccess> {
    const response = await axios.post('/access', {
      userId,
      startDate,
      endDate,
    });
    return response.data;
  },

  // Admin: Get all accesses
  async getAllAccesses(): Promise<TemporaryAccess[]> {
    const response = await axios.get('/access/all');
    return response.data.accesses;
  },

  // Admin: Get access by ID
  async getAccessById(id: string): Promise<TemporaryAccess> {
    const response = await axios.get(`/access/${id}`);
    return response.data.access;
  },

  // Admin: Update access
  async updateAccess(id: string, data: {
    startDate?: string;
    endDate?: string;
    isActive?: boolean;
  }): Promise<TemporaryAccess> {
    const response = await axios.put(`/access/${id}`, data);
    return response.data;
  },

  // Admin: Delete access
  async deleteAccess(id: string): Promise<{ message: string }> {
    const response = await axios.delete(`/access/${id}`);
    return response.data;
  },

  // User: Get my accesses
  async getMyAccesses(): Promise<TemporaryAccess[]> {
    const response = await axios.get('/access/my-access');
    return response.data.accesses;
  },

  // User: Get current active access
  async getCurrentAccess(): Promise<TemporaryAccess | null> {
    const response = await axios.get('/access/current');
    return response.data;
  },

  // User: Check if I have valid access
  async checkAccess(): Promise<{ hasAccess: boolean }> {
    const response = await axios.get('/access/check');
    return response.data;
  },
};
