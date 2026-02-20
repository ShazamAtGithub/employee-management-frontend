import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmployeeDashboard from '../EmployeeDashboard';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../services/api', () => ({
  getEmployee: jest.fn(),
  updateEmployee: jest.fn(),
  updateProfileImage: jest.fn(),
  getCurrentUser: jest.fn(),
  logout: jest.fn(),
}));

const {
  getEmployee,
  updateEmployee,
  updateProfileImage,
  getCurrentUser,
  logout,
} = require('../../services/api');

describe('EmployeeDashboard page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockNavigate.mockReset();

    // JSDOM may not implement this reliably
    global.URL.createObjectURL = jest.fn(() => 'blob:mock');
  });

  const installMockFileReader = (dataUrl) => {
    const RealFileReader = global.FileReader;

    class MockFileReader {
      constructor() {
        this.result = null;
        this.onload = null;
        this.onerror = null;
      }

      readAsDataURL() {
        this.result = dataUrl;
        // EmployeeDashboard sets onload *after* calling readAsDataURL,
        // so we must trigger asynchronously.
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 0);
      }
    }

    global.FileReader = MockFileReader;
    return () => {
      global.FileReader = RealFileReader;
    };
  };

  test('redirects to login when no current user', async () => {
    getCurrentUser.mockReturnValueOnce({ employeeID: null });

    render(<EmployeeDashboard />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  test('loads and renders employee profile', async () => {
    getCurrentUser.mockReturnValueOnce({ employeeID: '101', username: 'jdoe' });
    getEmployee.mockResolvedValueOnce({
      employeeID: '101',
      name: 'John Doe',
      username: 'jdoe',
      designation: 'Developer',
      address: '1 Main St',
      department: 'Engineering',
      joiningDate: '2024-01-15T00:00:00',
      skillset: 'React,SQL',
      profileImage: null,
    });

    render(<EmployeeDashboard />);

    expect(await screen.findByText('Employee Dashboard')).toBeInTheDocument();
    expect(screen.getByText('My Profile')).toBeInTheDocument();

    // Username field is always disabled and should show the value
    expect(screen.getByDisplayValue('jdoe')).toBeDisabled();
  });

  test('edit -> save calls updateEmployee with modifiedBy and shows success message', async () => {
    getCurrentUser.mockReturnValue({ employeeID: '101', username: 'jdoe' });
    getEmployee.mockResolvedValueOnce({
      employeeID: '101',
      name: 'John Doe',
      username: 'jdoe',
      designation: 'Developer',
      address: '1 Main St',
      department: 'Engineering',
      joiningDate: '2024-01-15T00:00:00',
      skillset: 'React,SQL',
      profileImage: null,
    });

    // after save, dashboard fetches again
    getEmployee.mockResolvedValueOnce({
      employeeID: '101',
      name: 'John Doe Updated',
      username: 'jdoe',
      designation: 'Developer',
      address: '1 Main St',
      department: 'Engineering',
      joiningDate: '2024-01-15T00:00:00',
      skillset: 'React,SQL',
      profileImage: null,
    });

    updateEmployee.mockResolvedValueOnce({ success: true });

    render(<EmployeeDashboard />);

    expect(await screen.findByText('Employee Dashboard')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /edit profile/i }));

    const nameInput = screen.getByLabelText(/full name/i);
    expect(nameInput).not.toBeDisabled();

    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'John Doe Updated');

    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(updateEmployee).toHaveBeenCalledTimes(1);
    });

    const [id, payload] = updateEmployee.mock.calls[0];
    expect(id).toBe('101');
    expect(payload).toMatchObject({
      employeeID: '101',
      name: 'John Doe Updated',
      modifiedBy: 'jdoe',
    });

    // No file selected and no remove flag -> should not call image update
    expect(updateProfileImage).not.toHaveBeenCalled();

    expect(await screen.findByText('Profile updated successfully!')).toBeInTheDocument();
  });

  test('logout calls service and navigates home', async () => {
    getCurrentUser.mockReturnValueOnce({ employeeID: '101', username: 'jdoe' });
    getEmployee.mockResolvedValueOnce({
      employeeID: '101',
      name: 'John Doe',
      username: 'jdoe',
    });

    render(<EmployeeDashboard />);

    expect(await screen.findByText('Employee Dashboard')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /logout/i }));

    expect(logout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('cancel reverts edits back to original employee data', async () => {
    getCurrentUser.mockReturnValueOnce({ employeeID: '101', username: 'jdoe' });
    getEmployee.mockResolvedValueOnce({
      employeeID: '101',
      name: 'John Doe',
      username: 'jdoe',
      designation: 'Developer',
      address: '1 Main St',
      department: 'Engineering',
      joiningDate: '2024-01-15T00:00:00',
      skillset: 'React,SQL',
      profileImage: null,
    });

    render(<EmployeeDashboard />);

    expect(await screen.findByText('Employee Dashboard')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /edit profile/i }));
    const nameInput = screen.getByLabelText(/full name/i);

    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Temp Name');
    expect(nameInput).toHaveValue('Temp Name');

    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

    // Should revert to original value and exit edit mode
    expect(screen.getByLabelText(/full name/i)).toHaveValue('John Doe');
    expect(screen.getByRole('button', { name: /edit profile/i })).toBeInTheDocument();
  });

  test('save with selected file converts to base64 and calls updateProfileImage', async () => {
    const restoreFileReader = installMockFileReader('data:image/png;base64,Zm9v');

    getCurrentUser.mockReturnValue({ employeeID: '101', username: 'jdoe' });
    getEmployee
      .mockResolvedValueOnce({
        employeeID: '101',
        name: 'John Doe',
        username: 'jdoe',
        designation: 'Developer',
        address: '1 Main St',
        department: 'Engineering',
        joiningDate: '2024-01-15T00:00:00',
        skillset: 'React,SQL',
        profileImage: null,
      })
      // refresh after save
      .mockResolvedValueOnce({
        employeeID: '101',
        name: 'John Doe',
        username: 'jdoe',
        designation: 'Developer',
        address: '1 Main St',
        department: 'Engineering',
        joiningDate: '2024-01-15T00:00:00',
        skillset: 'React,SQL',
        profileImage: null,
      });

    updateEmployee.mockResolvedValueOnce({ success: true });
    updateProfileImage.mockResolvedValueOnce({ success: true });

    const { container } = render(<EmployeeDashboard />);

    expect(await screen.findByText('Employee Dashboard')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /edit profile/i }));

    const fileInput = container.querySelector('input.file-input[type="file"]');
    expect(fileInput).not.toBeNull();

    const file = new File(['foo'], 'avatar.png', { type: 'image/png' });
    await userEvent.upload(fileInput, file);

    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(updateProfileImage).toHaveBeenCalledTimes(1);
    });

    expect(updateProfileImage).toHaveBeenCalledWith('101', 'Zm9v', 'jdoe');

    restoreFileReader();
  });

  test('remove image sets removeImage flag and sends empty string to backend', async () => {
    getCurrentUser.mockReturnValue({ employeeID: '101', username: 'jdoe' });
    getEmployee
      .mockResolvedValueOnce({
        employeeID: '101',
        name: 'John Doe',
        username: 'jdoe',
        profileImage: 'abc123',
      })
      .mockResolvedValueOnce({
        employeeID: '101',
        name: 'John Doe',
        username: 'jdoe',
        profileImage: null,
      });

    updateEmployee.mockResolvedValueOnce({ success: true });
    updateProfileImage.mockResolvedValueOnce({ success: true });

    render(<EmployeeDashboard />);

    expect(await screen.findByText('Employee Dashboard')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /edit profile/i }));

    // Remove button only shows when (employee.profileImage || selectedFile) && !removeImage
    await userEvent.click(screen.getByRole('button', { name: /^remove$/i }));

    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(updateProfileImage).toHaveBeenCalledTimes(1);
    });

    expect(updateProfileImage).toHaveBeenCalledWith('101', '', 'jdoe');
  });

  test('shows error message when text update succeeds but image upload fails', async () => {
    const restoreFileReader = installMockFileReader('data:image/jpeg;base64,QUJD');

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    getCurrentUser.mockReturnValue({ employeeID: '101', username: 'jdoe' });
    getEmployee.mockResolvedValueOnce({
      employeeID: '101',
      name: 'John Doe',
      username: 'jdoe',
      profileImage: null,
    });

    updateEmployee.mockResolvedValueOnce({ success: true });
    updateProfileImage.mockRejectedValueOnce(new Error('Upload failed'));

    const { container } = render(<EmployeeDashboard />);

    expect(await screen.findByText('Employee Dashboard')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /edit profile/i }));
    const fileInput = container.querySelector('input.file-input[type="file"]');
    const file = new File(['abc'], 'avatar.jpg', { type: 'image/jpeg' });
    await userEvent.upload(fileInput, file);

    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

    expect(await screen.findByText('Error updating profile')).toBeInTheDocument();

    restoreFileReader();

    consoleErrorSpy.mockRestore();
  });
});
