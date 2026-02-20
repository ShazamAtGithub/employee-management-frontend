import { render, screen } from '@testing-library/react';
import App from './App';

describe('App routing', () => {
  beforeEach(() => {
    window.history.pushState({}, 'Test', '/');
  });

  test('renders Login on /', () => {
    render(<App />);
    expect(screen.getByText('Employee Management System')).toBeInTheDocument();
  });

  test('renders Register on /register', () => {
    window.history.pushState({}, 'Test', '/register');
    render(<App />);
    expect(screen.getByText('Employee Registration')).toBeInTheDocument();
  });
});
