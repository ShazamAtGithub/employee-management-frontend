import axios from 'axios';

const API_URL = 'http://localhost:5205/api/Employee'; 

export const login = async (username, password) => {
    const response = await axios.post(`${API_URL}/login`, { username, password });
    return response.data;
};

export const register = async (employeeData) => {
    const response = await axios.post(`${API_URL}/register`, employeeData);
    return response.data;
};

export const getEmployee = async (id) => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
};

export const getAllEmployees = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};

export const updateEmployee = async (id, employeeData) => {
    const response = await axios.put(`${API_URL}/${id}`, employeeData);
    return response.data;
};

export const updateEmployeeStatus = async (id, status, modifiedBy) => {
  const response = await axios.put(`${API_URL}/${id}/status`, { status, modifiedBy });
  return response.data;
};