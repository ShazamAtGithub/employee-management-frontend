import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../Login';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../services/api', () => ({
  login: jest.fn(),
}));

const { login } = require('../../services/api');

describe('Login page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('renders login form', () => {
    render(<Login />);

    expect(screen.getByText('Employee Management System')).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('shows validation errors when submitting empty', async () => {
    render(<Login />);

    await userEvent.click(screen.getByRole('button', { name: /login/i }));

    expect(screen.getByText('Username is required.')).toBeInTheDocument();
    expect(screen.getByText('Password is required.')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  test('navigates to admin dashboard on successful admin login', async () => {
    login.mockResolvedValueOnce({ role: 'Admin' });

    render(<Login />);

    await userEvent.type(screen.getByLabelText(/username/i), ' admin ');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('admin', 'password123');
      expect(mockNavigate).toHaveBeenCalledWith('/admin-dashboard');
    });
  });

  test('navigates to employee dashboard on successful non-admin login', async () => {
    login.mockResolvedValueOnce({ role: 'Employee' });

    render(<Login />);

    await userEvent.type(screen.getByLabelText(/username/i), 'jdoe');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/employee-dashboard');
    });
  });

  test('navigates to disabled account when backend says inactive', async () => {
    const err = {
      response: {
        data: { message: 'Account is Inactive' },
      },
    };
    login.mockRejectedValueOnce(err);
    localStorage.setItem('token', 'should-be-cleared');

    render(<Login />);

    await userEvent.type(screen.getByLabelText(/username/i), 'jdoe');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/disabled-account');
    });
    expect(localStorage.getItem('token')).toBeNull();
  });

  test('shows server error message when provided', async () => {
    const err = {
      response: {
        data: { message: 'Invalid credentials' },
      },
    };
    login.mockRejectedValueOnce(err);

    render(<Login />);

    await userEvent.type(screen.getByLabelText(/username/i), 'jdoe');
    await userEvent.type(screen.getByLabelText(/password/i), 'bad');
    await userEvent.click(screen.getByRole('button', { name: /login/i }));

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
  });

  test('register link navigates to /register', async () => {
    render(<Login />);

    await userEvent.click(screen.getByText(/register/i));

    expect(mockNavigate).toHaveBeenCalledWith('/register');
  });
});
