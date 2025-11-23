import { API_BASE } from '../config';

// Generic API call function
async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

// Admin Authentication
export const adminAPI = {
  login: async (username, password) => {
    return apiCall('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  create: async (username, password) => {
    return apiCall('/api/admin/create', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  getAdmins: async () => {
    return apiCall('/api/admin/');
  },
};

// Plantation Management
export const plantationAPI = {
  getAll: async () => {
    return apiCall('/api/plantations');
  },

  getOne: async (id) => {
    return apiCall(`/api/plantations/${id}`);
  },

  create: async (plantationData) => {
    return apiCall('/api/admin/plantations', {
      method: 'POST',
      body: JSON.stringify(plantationData),
    });
  },

  update: async (id, updateData) => {
    return apiCall(`/api/admin/plantations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  },

  delete: async (id) => {
    return apiCall(`/api/admin/plantations/${id}`, {
      method: 'DELETE',
    });
  },

  addDetectionRecord: async (id, record) => {
    return apiCall(`/api/plantations/${id}/history`, {
      method: 'POST',
      body: JSON.stringify(record),
    });
  },

  predictFolder: async (folderName) => {
    return apiCall('/predict_folder', {
      method: 'POST',
      body: JSON.stringify({ folder_name: folderName }),
    });
  },
};

export default apiCall;