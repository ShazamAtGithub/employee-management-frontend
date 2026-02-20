import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Register from '../Register';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../services/api', () => ({
  register: jest.fn(),
}));

const { register } = require('../../services/api');

describe('Register page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('renders registration form', () => {
    render(<Register />);

    expect(screen.getByText('Employee Registration')).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  test('shows validation errors for missing required fields', async () => {
    render(<Register />);

    await userEvent.click(screen.getByRole('button', { name: /register/i }));

    expect(screen.getByText('Full name is required.')).toBeInTheDocument();
    expect(screen.getByText('Username is required.')).toBeInTheDocument();
    expect(screen.getByText('Password is required.')).toBeInTheDocument();
    expect(screen.getByText('Please confirm your password.')).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  test('shows validation error when passwords do not match', async () => {
    render(<Register />);

    await userEvent.type(screen.getByLabelText(/full name/i), 'John Doe');
    await userEvent.type(screen.getByLabelText(/^username/i), 'jdoe');
    await userEvent.type(screen.getByLabelText(/^password/i), 'password123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'password124');

    await userEvent.click(screen.getByRole('button', { name: /register/i }));

    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  test('invalid profile image file shows field error', async () => {
    render(<Register />);

    const fileInput = screen.getByLabelText(/profile image/i);
    const badFile = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    await userEvent.upload(fileInput, badFile);

    expect(screen.getByText('Profile image must be an image file.')).toBeInTheDocument();
  });

  test('successful registration calls API with payload and redirects to login', async () => {
    jest.useFakeTimers();

    register.mockResolvedValueOnce({ success: true });

    render(<Register />);

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: ' John Doe ' } });
    fireEvent.change(screen.getByLabelText(/^username/i), { target: { value: ' jdoe ' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    expect(await screen.findByText(/Registration successful!/i)).toBeInTheDocument();

    expect(register).toHaveBeenCalledTimes(1);
    const payload = register.mock.calls[0][0];

    expect(payload).toMatchObject({
      Name: 'John Doe',
      Username: 'jdoe',
      Password: 'password123',
      CreatedBy: 'Self',
    });

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/');

    jest.useRealTimers();
  });

  test('login link navigates to /', async () => {
    render(<Register />);

    await userEvent.click(screen.getByText(/login/i));

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
