import axios from 'axios';

const BASE_URL = 'http://localhost:5205/api';
const EMPLOYEE_URL = `${BASE_URL}/Employee`;
const ADMIN_URL    = `${BASE_URL}/Admin`;

export const login = async (username, password) => {
    const response = await axios.post(`${EMPLOYEE_URL}/login`, { username, password });
    return response.data;
};

export const register = async (employeeData) => {
    const response = await axios.post(`${EMPLOYEE_URL}/register`, employeeData);
    return response.data;
};

export const getEmployee = async (id) => {
    const response = await axios.get(`${EMPLOYEE_URL}/${id}`);
    return response.data;
};

export const getAllEmployees = async () => {
    const response = await axios.get(`${ADMIN_URL}/employees`);
    return response.data;
};

export const updateEmployee = async (id, employeeData) => {
    const response = await axios.put(`${EMPLOYEE_URL}/${id}`, employeeData);
    return response.data;
};

export const adminUpdateEmployee = async (id, employeeData) => {
    const response = await axios.put(`${ADMIN_URL}/employees/${id}`, employeeData);
    return response.data;
};

export const updateEmployeeStatus = async (id, status, modifiedBy) => {
  const response = await axios.put(`${ADMIN_URL}/employees/${id}/status`, { status, modifiedBy });
  return response.data;
};

export const updateProfileImage = async (id, base64Image, modifiedBy) => {
    const response = await axios.put(`${EMPLOYEE_URL}/${id}/image`, { base64Image, modifiedBy });
    return response.data;
};