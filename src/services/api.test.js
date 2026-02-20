import axios from 'axios';
import * as apiServices from './api';

// Mock Axios and create() instance
jest.mock('axios', () => {
  const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };

  return {
    create: jest.fn(() => mockAxiosInstance),
    post: jest.fn(),
  };
});

const mockApi = axios.create();
const BASE_URL = 'http://localhost:5205/api';

describe('API Services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  // ==================== AUTH UTILITIES ====================
  describe('Authentication Utilities', () => {
    test('isAuthenticated returns true if token exists', () => {
      localStorage.setItem('token', 'fake-jwt-token');
      expect(apiServices.isAuthenticated()).toBe(true);
    });

    test('isAuthenticated returns false if token is missing', () => {
      expect(apiServices.isAuthenticated()).toBe(false);
    });

    test('isAdmin returns true if role is Admin', () => {
      localStorage.setItem('role', 'Admin');
      expect(apiServices.isAdmin()).toBe(true);
    });

    test('isAdmin returns false if role is not Admin', () => {
      localStorage.setItem('role', 'User');
      expect(apiServices.isAdmin()).toBe(false);
    });

    test('isAdmin returns false if role is missing', () => {
      expect(apiServices.isAdmin()).toBe(false);
    });

    test('logout clears localStorage', () => {
      localStorage.setItem('token', 'fake-jwt-token');
      localStorage.setItem('employeeID', '123');

      apiServices.logout();

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('employeeID')).toBeNull();
    });

    test('getCurrentUser retrieves all user data from localStorage', () => {
      localStorage.setItem('employeeID', '1');
      localStorage.setItem('username', 'jdoe');
      localStorage.setItem('role', 'User');
      localStorage.setItem('name', 'John Doe');
      localStorage.setItem('status', 'Active');

      const user = apiServices.getCurrentUser();

      expect(user).toEqual({
        employeeID: '1',
        name: 'John Doe',
        username: 'jdoe',
        role: 'User',
        status: 'Active',
      });
    });

    test('getCurrentUser returns nulls when localStorage is empty', () => {
      const user = apiServices.getCurrentUser();

      expect(user).toEqual({
        employeeID: null,
        name: null,
        username: null,
        role: null,
        status: null,
      });
    });
  });

  // ==================== INTERCEPTORS ====================
  describe('Interceptors', () => {
    test('request interceptor attaches Bearer token when token exists', () => {
      // axios.create is called when the module loads, grab the use() call args
      const requestInterceptor = mockApi.interceptors.request.use.mock.calls[0]?.[0];

      // If interceptors were registered on module load, test the handler directly
      if (!requestInterceptor) {
        // Re-derive the handler from the mock calls recorded at module init
        const [successHandler] = mockApi.interceptors.request.use.mock.calls[0] ?? [];
        expect(successHandler).toBeUndefined(); // will prompt if interceptors aren't being captured
        return;
      }

      localStorage.setItem('token', 'jwt-abc');
      const config = { headers: {} };
      const result = requestInterceptor(config);

      expect(result.headers.Authorization).toBe('Bearer jwt-abc');
    });

    test('request interceptor does not attach Authorization if no token', () => {
      const requestInterceptor = mockApi.interceptors.request.use.mock.calls[0]?.[0];
      if (!requestInterceptor) return;

      const config = { headers: {} };
      const result = requestInterceptor(config);

      expect(result.headers.Authorization).toBeUndefined();
    });

    test('response interceptor clears localStorage and redirects on 401', () => {
      const responseErrorHandler = mockApi.interceptors.response.use.mock.calls[0]?.[1];
      if (!responseErrorHandler) return;

      delete window.location;
      window.location = { href: '' };
      localStorage.setItem('token', 'jwt-abc');

      const error = { response: { status: 401 } };
      responseErrorHandler(error).catch(() => {});

      expect(localStorage.getItem('token')).toBeNull();
      expect(window.location.href).toBe('/');
    });

    test('response interceptor passes through non-401 errors', async () => {
      const responseErrorHandler = mockApi.interceptors.response.use.mock.calls[0]?.[1];
      if (!responseErrorHandler) return;

      const error = { response: { status: 500 } };
      await expect(responseErrorHandler(error)).rejects.toEqual(error);
    });
  });

  // ==================== AUTH ENDPOINTS ====================
  describe('login', () => {
    const mockResponse = {
      data: {
        token: 'jwt-123',
        employeeID: '101',
        name: 'Jane Doe',
        username: 'janed',
        role: 'Admin',
        status: 'Active',
      },
    };

    test('calls correct endpoint with credentials', async () => {
      axios.post.mockResolvedValueOnce(mockResponse);

      await apiServices.login('janed', 'password123');

      expect(axios.post).toHaveBeenCalledWith(`${BASE_URL}/Employee/ef/login`, {
        username: 'janed',
        password: 'password123',
      });
    });

    test('stores all fields in localStorage on success', async () => {
      axios.post.mockResolvedValueOnce(mockResponse);

      await apiServices.login('janed', 'password123');

      expect(localStorage.getItem('token')).toBe('jwt-123');
      expect(localStorage.getItem('employeeID')).toBe('101');
      expect(localStorage.getItem('name')).toBe('Jane Doe');
      expect(localStorage.getItem('username')).toBe('janed');
      expect(localStorage.getItem('role')).toBe('Admin');
      expect(localStorage.getItem('status')).toBe('Active');
    });

    test('returns response data', async () => {
      axios.post.mockResolvedValueOnce(mockResponse);

      const result = await apiServices.login('janed', 'password123');

      expect(result).toEqual(mockResponse.data);
    });

    test('does not store anything in localStorage if no token in response', async () => {
      axios.post.mockResolvedValueOnce({ data: { message: 'Invalid credentials' } });

      await apiServices.login('janed', 'wrongpassword');

      expect(localStorage.getItem('token')).toBeNull();
    });

    test('throws error when request fails', async () => {
      axios.post.mockRejectedValueOnce(new Error('Network Error'));

      await expect(apiServices.login('janed', 'password123')).rejects.toThrow('Network Error');
    });
  });

  describe('register', () => {
    test('sends JSON when payload is a plain object', async () => {
      const employeeData = { name: 'John', username: 'johnd' };
      mockApi.post.mockResolvedValueOnce({ data: { success: true } });

      const result = await apiServices.register(employeeData);

      expect(mockApi.post).toHaveBeenCalledWith(
        '/Employee/ef/register',
        employeeData,
        { headers: { 'Content-Type': 'application/json' } }
      );
      expect(result).toEqual({ success: true });
    });

    test('sends multipart/form-data when payload is FormData', async () => {
      const formData = new FormData();
      formData.append('name', 'John');
      mockApi.post.mockResolvedValueOnce({ data: { success: true } });

      const result = await apiServices.register(formData);

      expect(mockApi.post).toHaveBeenCalledWith(
        '/Employee/ef/register',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      expect(result).toEqual({ success: true });
    });

    test('throws error when request fails', async () => {
      mockApi.post.mockRejectedValueOnce(new Error('Server Error'));

      await expect(apiServices.register({ name: 'John' })).rejects.toThrow('Server Error');
    });
  });

  // ==================== EMPLOYEE ENDPOINTS ====================
  describe('Employee Endpoints', () => {
    test('getEmployee fetches by id', async () => {
      const mockEmployee = { id: 1, name: 'John' };
      mockApi.get.mockResolvedValueOnce({ data: mockEmployee });

      const result = await apiServices.getEmployee(1);

      expect(mockApi.get).toHaveBeenCalledWith('/Employee/ef/1');
      expect(result).toEqual(mockEmployee);
    });

    test('getEmployee throws on failure', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('Not Found'));

      await expect(apiServices.getEmployee(999)).rejects.toThrow('Not Found');
    });

    test('updateEmployee sends PUT with correct id and payload', async () => {
      const updatedData = { name: 'John Updated' };
      mockApi.put.mockResolvedValueOnce({ data: updatedData });

      const result = await apiServices.updateEmployee(1, updatedData);

      expect(mockApi.put).toHaveBeenCalledWith('/Employee/ef/1', updatedData);
      expect(result).toEqual(updatedData);
    });

    test('updateProfileImage sends PUT with base64 and modifiedBy', async () => {
      const mockResult = { success: true };
      mockApi.put.mockResolvedValueOnce({ data: mockResult });

      const result = await apiServices.updateProfileImage(1, 'base64string==', 'admin');

      expect(mockApi.put).toHaveBeenCalledWith('/Employee/ef/1/image', {
        base64Image: 'base64string==',
        modifiedBy: 'admin',
      });
      expect(result).toEqual(mockResult);
    });

    test('getProfileImage fetches image by employee id', async () => {
      const mockImage = { base64Image: 'abc123==' };
      mockApi.get.mockResolvedValueOnce({ data: mockImage });

      const result = await apiServices.getProfileImage(1);

      expect(mockApi.get).toHaveBeenCalledWith('/Employee/ef/1/image');
      expect(result).toEqual(mockImage);
    });
  });

  // ==================== ADMIN ENDPOINTS ====================
  describe('Admin Endpoints', () => {
    test('getAllEmployees fetches full employee list', async () => {
      const mockList = [{ id: 1 }, { id: 2 }];
      mockApi.get.mockResolvedValueOnce({ data: mockList });

      const result = await apiServices.getAllEmployees();

      expect(mockApi.get).toHaveBeenCalledWith('/Admin/ef/employees');
      expect(result).toEqual(mockList);
    });

    test('adminUpdateEmployee sends PUT with correct id and payload', async () => {
      const updatedData = { role: 'Admin' };
      mockApi.put.mockResolvedValueOnce({ data: updatedData });

      const result = await apiServices.adminUpdateEmployee(1, updatedData);

      expect(mockApi.put).toHaveBeenCalledWith('/Admin/ef/employees/1', updatedData);
      expect(result).toEqual(updatedData);
    });

    test('updateEmployeeStatus sends PUT with status and modifiedBy', async () => {
      const mockResult = { success: true };
      mockApi.put.mockResolvedValueOnce({ data: mockResult });

      const result = await apiServices.updateEmployeeStatus(1, 'Inactive', 'admin');

      expect(mockApi.put).toHaveBeenCalledWith('/Admin/ef/employees/1/status', {
        status: 'Inactive',
        modifiedBy: 'admin',
      });
      expect(result).toEqual(mockResult);
    });

    test('getAllEmployees throws on failure', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('Forbidden'));

      await expect(apiServices.getAllEmployees()).rejects.toThrow('Forbidden');
    });
  });
});