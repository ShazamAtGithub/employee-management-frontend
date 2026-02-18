import axios from 'axios';

const BASE_URL = 'http://localhost:5205/api';

// Create axios instance with interceptors
const api = axios.create({
  baseURL: BASE_URL,
});

// Request interceptor 
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor 
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.clear();
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH ====================
export const login = async (username, password) => {
  const response = await axios.post(`${BASE_URL}/Employee/ef/login`, { username, password });
  
  // Store token and user info in localStorage
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('employeeID', response.data.employeeID);
    localStorage.setItem('name', response.data.name);
    localStorage.setItem('username', response.data.username);
    localStorage.setItem('role', response.data.role);
    localStorage.setItem('status', response.data.status);
  }
  
  return response.data;
};

export const register = async (employeeData) => {
  let response;
  if (employeeData instanceof FormData) {
    response = await api.post(`/Employee/ef/register`, employeeData, {
      headers: { "Content-Type": "multipart/form-data" } // incase switching to multipart upload
    });
  } else {
    response = await api.post(`/Employee/ef/register`, employeeData, {
      headers: { "Content-Type": "application/json" }
    });
  }
  return response.data;
};

export const logout = () => {
  localStorage.clear();
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

export const isAdmin = () => {
  return localStorage.getItem('role') === 'Admin';
};

export const getCurrentUser = () => {
  return {
    employeeID: localStorage.getItem('employeeID'),
    name: localStorage.getItem('name'),
    username: localStorage.getItem('username'),
    role: localStorage.getItem('role'),
    status: localStorage.getItem('status'),
  };
};

// ==================== EMPLOYEE ====================
export const getEmployee = async (id) => {
  const response = await api.get(`/Employee/ef/${id}`);
  return response.data;
};

export const updateEmployee = async (id, employeeData) => {
  const response = await api.put(`/Employee/ef/${id}`, employeeData);
  return response.data;
};

export const updateProfileImage = async (id, base64Image, modifiedBy) => {
  const response = await api.put(`/Employee/ef/${id}/image`, { base64Image, modifiedBy });
  return response.data;
};

export const getProfileImage = async (id) => {
  const response = await api.get(`/Employee/ef/${id}/image`);
  return response.data;
};

// ==================== ADMIN ====================
export const getAllEmployees = async () => {
  const response = await api.get(`/Admin/ef/employees`);
  return response.data;
};

export const adminUpdateEmployee = async (id, employeeData) => {
  const response = await api.put(`/Admin/ef/employees/${id}`, employeeData);
  return response.data;
};

export const updateEmployeeStatus = async (id, status, modifiedBy) => {
  const response = await api.put(`/Admin/ef/employees/${id}/status`, { status, modifiedBy });
  return response.data;
};