import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DisabledAccount from '../DisabledAccount';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('DisabledAccount page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('renders disabled account message', () => {
    render(<DisabledAccount />);

    expect(screen.getByText('Account Disabled')).toBeInTheDocument();
    expect(
      screen.getByText(/Your account has been disabled/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to login/i })).toBeInTheDocument();
  });

  test('Back to Login clears localStorage and navigates home', async () => {
    localStorage.setItem('token', 'abc');

    render(<DisabledAccount />);

    await userEvent.click(screen.getByRole('button', { name: /back to login/i }));

    expect(localStorage.getItem('token')).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
