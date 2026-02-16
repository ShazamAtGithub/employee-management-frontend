const API_URL = 'http://localhost:5205/api'; 

export const authService = {
  // Login
  async login(username, password) {
    try {
      const response = await fetch(`${API_URL}/employee/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token and user info
        localStorage.setItem('token', data.token);
        localStorage.setItem('employeeId', data.employeeID);
        localStorage.setItem('username', data.username);
        localStorage.setItem('name', data.name);
        localStorage.setItem('role', data.role);
        localStorage.setItem('status', data.status);
        return { success: true, data };
      } else {
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  },

  // Register
  async register(formData) {
    try {
      let response;
      if (formData instanceof FormData) {
        response = await fetch(`${API_URL}/employee/register`, {
          method: 'POST',
          // Let the browser set the Content-Type (with boundary)
          body: formData,
        });
      } else {
        response = await fetch(`${API_URL}/employee/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
      }

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, message: data.message || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  },

  // Logout
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('employeeId');
    localStorage.removeItem('username');
    localStorage.removeItem('name');
    localStorage.removeItem('role');
    localStorage.removeItem('status');
  },

  // Check if user is logged in
  isAuthenticated() {
    return !!localStorage.getItem('token');
  },

  // Get current user info
  getCurrentUser() {
    return {
      employeeId: localStorage.getItem('employeeId'),
      username: localStorage.getItem('username'),
      name: localStorage.getItem('name'),
      role: localStorage.getItem('role'),
      status: localStorage.getItem('status'),
    };
  },

  // Check if user is admin
  isAdmin() {
    return localStorage.getItem('role') === 'Admin';
  },
};