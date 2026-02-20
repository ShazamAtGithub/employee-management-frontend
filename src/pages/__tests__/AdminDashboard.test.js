import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminDashboard from '../AdminDashboard';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../services/api', () => ({
  getAllEmployees: jest.fn(),
  adminUpdateEmployee: jest.fn(),
  updateEmployeeStatus: jest.fn(),
  getCurrentUser: jest.fn(),
  isAdmin: jest.fn(),
  logout: jest.fn(),
}));

// Smart PrimeReact mocks: keep rendering simple, but expose the same hooks
// that AdminDashboard relies on (rowEditValidator, onRowEditComplete, and the
// Actions column body template with InputSwitch).
jest.mock('primereact/datatable', () => ({
  DataTable: ({ value, emptyMessage, onRowEditComplete, rowEditValidator, children }) => {
    const childrenArray = require('react').Children.toArray(children);
    const actionsColumn = childrenArray.find((child) => child?.props?.header === 'Actions');

    return (
      <div data-testid="datatable">
        <div data-testid="datatable-count">{Array.isArray(value) ? value.length : 0}</div>

        {Array.isArray(value) && value.length === 0 ? <div>{emptyMessage}</div> : null}

        {Array.isArray(value) && value.length > 0 && actionsColumn ? (
          <>
            <div data-testid="actions-container">
              {actionsColumn.props.body(value[0], { rowEditor: { editing: false } })}
            </div>
            <div data-testid="actions-container-editing">
              {actionsColumn.props.body(value[0], { rowEditor: { editing: true } })}
            </div>
          </>
        ) : null}

        <button
          type="button"
          data-testid="trigger-validate"
          onClick={(e) => {
            const payload = JSON.parse(e.currentTarget.getAttribute('data-payload') || 'null');
            rowEditValidator?.(payload);
          }}
        >
          Simulate Validate
        </button>

        <button
          type="button"
          data-testid="trigger-edit"
          onClick={(e) => {
            const payload = JSON.parse(e.currentTarget.getAttribute('data-payload') || 'null');
            const ok = rowEditValidator ? rowEditValidator(payload) : true;
            if (ok) onRowEditComplete?.({ newData: payload });
          }}
        >
          Simulate Edit
        </button>
      </div>
    );
  },
}));

jest.mock('primereact/column', () => ({
  Column: () => null,
}));

jest.mock('primereact/inputswitch', () => ({
  InputSwitch: ({ checked, disabled, onChange }) => (
    <input
      type="checkbox"
      data-testid="mock-input-switch"
      checked={!!checked}
      disabled={!!disabled}
      onChange={(e) => onChange({ value: e.target.checked })}
    />
  ),
}));

const {
  getAllEmployees,
  adminUpdateEmployee,
  updateEmployeeStatus,
  getCurrentUser,
  isAdmin,
  logout,
} = require('../../services/api');

describe('AdminDashboard page (business logic coverage)', () => {
  const mockUser = { employeeID: '999', username: 'adminUser' };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    getCurrentUser.mockReturnValue(mockUser);
    isAdmin.mockReturnValue(true);
  });

  test('redirects to login when not admin', async () => {
    isAdmin.mockReturnValueOnce(false);

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  test('fetches employees and filters by search term', async () => {
    getAllEmployees.mockResolvedValueOnce([
      { employeeID: '1', name: 'Alice', username: 'alice', department: 'HR', status: 'Active', role: 'Employee' },
      { employeeID: '2', name: 'Bob', username: 'bob', department: 'Engineering', status: 'Active', role: 'Employee' },
    ]);

    render(<AdminDashboard />);

    expect(await screen.findByText('Admin Dashboard')).toBeInTheDocument();

    await waitFor(() => {
      expect(getAllEmployees).toHaveBeenCalled();
    });

    expect(screen.getByTestId('datatable-count')).toHaveTextContent('2');

    await userEvent.type(screen.getByPlaceholderText(/search by name/i), 'bob');

    await waitFor(() => {
      expect(screen.getByTestId('datatable-count')).toHaveTextContent('1');
    });
  });

  test('logout navigates home', async () => {
    getAllEmployees.mockResolvedValueOnce([]);

    render(<AdminDashboard />);

    expect(await screen.findByText('Admin Dashboard')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /logout/i }));

    expect(logout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('validateRowEdit blocks invalid edit (missing name/status) and prevents API call', async () => {
    getAllEmployees.mockResolvedValueOnce([]);

    render(<AdminDashboard />);

    const triggerBtn = screen.getByTestId('trigger-edit');
    const invalidPayload = { employeeID: '1', name: '', status: '' };
    triggerBtn.setAttribute('data-payload', JSON.stringify(invalidPayload));

    await userEvent.click(triggerBtn);

    expect(await screen.findByText('Name is required. Status is required.')).toBeInTheDocument();
    expect(adminUpdateEmployee).not.toHaveBeenCalled();
  });

  test('validateRowEdit blocks edit when name exceeds 100 characters (edge case)', async () => {
    getAllEmployees.mockResolvedValueOnce([]);

    render(<AdminDashboard />);

    const triggerBtn = screen.getByTestId('trigger-edit');
    const invalidPayload = { employeeID: '1', name: 'a'.repeat(101), status: 'Active' };
    triggerBtn.setAttribute('data-payload', JSON.stringify(invalidPayload));

    await userEvent.click(triggerBtn);

    expect(await screen.findByText('Name must be at most 100 characters.')).toBeInTheDocument();
    expect(adminUpdateEmployee).not.toHaveBeenCalled();
  });

  test('handleRowEditComplete calls adminUpdateEmployee with modifiedBy and refreshes', async () => {
    getAllEmployees.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    adminUpdateEmployee.mockResolvedValueOnce({});

    render(<AdminDashboard />);

    const triggerBtn = screen.getByTestId('trigger-edit');
    const validPayload = {
      employeeID: '1',
      name: 'John Doe',
      status: 'Active',
      username: 'jdoe',
      role: 'User',
    };
    triggerBtn.setAttribute('data-payload', JSON.stringify(validPayload));

    await userEvent.click(triggerBtn);

    expect(adminUpdateEmployee).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({
        name: 'John Doe',
        modifiedBy: 'adminUser',
      })
    );

    expect(await screen.findByText('Employee updated successfully!')).toBeInTheDocument();
    expect(getAllEmployees).toHaveBeenCalledTimes(2);
  });

  test('handleRowEditComplete shows API error details when update fails (getApiErrorMessage)', async () => {
    getAllEmployees.mockResolvedValueOnce([]);
    adminUpdateEmployee.mockRejectedValueOnce({
      response: {
        status: 400,
        data: {
          errors: {
            name: ['Name is invalid.'],
          },
        },
      },
    });

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<AdminDashboard />);

    const triggerBtn = screen.getByTestId('trigger-edit');
    const validPayload = {
      employeeID: '1',
      name: 'John Doe',
      status: 'Active',
      username: 'jdoe',
      role: 'User',
    };
    triggerBtn.setAttribute('data-payload', JSON.stringify(validPayload));

    await userEvent.click(triggerBtn);

    expect(await screen.findByText(/Error updating employee:/)).toBeInTheDocument();
    expect(screen.getByText(/name: Name is invalid\./i)).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  test('status toggle triggers updateEmployeeStatus and refreshes', async () => {
    getAllEmployees
      .mockResolvedValueOnce([{ employeeID: '123', name: 'Test User', role: 'Employee', status: 'Inactive' }])
      .mockResolvedValueOnce([{ employeeID: '123', name: 'Test User', role: 'Employee', status: 'Active' }]);
    updateEmployeeStatus.mockResolvedValueOnce({});

    render(<AdminDashboard />);

    const actionsContainer = await screen.findByTestId('actions-container');
    const inputSwitch = within(actionsContainer).getByTestId('mock-input-switch');
    await userEvent.click(inputSwitch);

    expect(updateEmployeeStatus).toHaveBeenCalledWith('123', 'Active', 'adminUser');
    expect(await screen.findByText('Status updated successfully!')).toBeInTheDocument();
    expect(getAllEmployees).toHaveBeenCalledTimes(2);
  });

  test('does not render toggle controls for protected Admin rows', async () => {
    getAllEmployees.mockResolvedValueOnce([
      { employeeID: '777', name: 'Protected', role: 'Admin', status: 'Active' },
    ]);

    render(<AdminDashboard />);

    await waitFor(() => expect(screen.getByTestId('datatable-count')).toHaveTextContent('1'));
    expect(screen.queryByTestId('mock-input-switch')).toBeNull();
  });

  test('disables InputSwitch while row is being edited', async () => {
    getAllEmployees.mockResolvedValueOnce([
      { employeeID: '123', name: 'Test User', role: 'Employee', status: 'Inactive' },
    ]);

    render(<AdminDashboard />);

    const editingContainer = await screen.findByTestId('actions-container-editing');
    const inputs = editingContainer.querySelectorAll('input[type="checkbox"]');
    expect(inputs.length).toBe(1);
    expect(inputs[0]).toBeDisabled();
  });

  test('shows error message when status update fails (getApiErrorMessage)', async () => {
    getAllEmployees.mockResolvedValueOnce([
      { employeeID: '123', name: 'Test User', role: 'Employee', status: 'Inactive' },
    ]);
    updateEmployeeStatus.mockRejectedValueOnce({
      response: {
        status: 403,
        data: { message: 'Forbidden' },
      },
    });

    render(<AdminDashboard />);

    const actionsContainer = await screen.findByTestId('actions-container');
    const inputSwitch = within(actionsContainer).getByTestId('mock-input-switch');
    await userEvent.click(inputSwitch);

    expect(await screen.findByText(/Error updating status: Forbidden/i)).toBeInTheDocument();
  });
});
