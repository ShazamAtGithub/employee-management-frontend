import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllEmployees, updateEmployee, updateEmployeeStatus } from '../services/api';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputSwitch } from 'primereact/inputswitch';
import './AdminDashboard.css';

function AdminDashboard() {
    const [employees, setEmployees] = useState([]);
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [message, setMessage] = useState('');

    
    const navigate = useNavigate();

    const PAGE_SIZE = 10;

    const validateEdit = (data) => {
        const errors = [];
        const name = (data?.name || '').trim();
        const status = (data?.status || '').trim();

        if (!name) errors.push('Name is required.');
        else if (name.length > 100) errors.push('Name must be at most 100 characters.');

        if (data?.designation && data.designation.length > 100) errors.push('Designation must be at most 100 characters.');
        if (data?.department && data.department.length > 100) errors.push('Department must be at most 100 characters.');
        if (data?.skillset && data.skillset.length > 200) errors.push('Skillset must be at most 200 characters.');

        if (!status) errors.push('Status is required.');
        else if (status.length > 50) errors.push('Status must be at most 50 characters.');

        if (data?.joiningDate) {
            const parsed = Date.parse(data.joiningDate);
            if (Number.isNaN(parsed)) errors.push('Joining date must be a valid date.');
        }

        return errors;
    };

    const validateRowEdit = (rowData) => {
        const errors = validateEdit(rowData);
        if (errors.length > 0) {
            setMessage(errors.join(' '));
            return false;
        }
        setMessage('');
        return true;
    };

    const getApiErrorMessage = (err) => {
        if (err?.response) {
            const data = err.response.data;
            if (typeof data === 'string' && data.trim()) return data;
            
            if (data?.errors && typeof data.errors === 'object') {
                const parts = [];
                for (const [field, messages] of Object.entries(data.errors)) {
                    if (Array.isArray(messages) && messages.length) {
                        parts.push(`${field}: ${messages.join(' ')}`);
                    }
                }
                if (parts.length) return parts.join(' | ');
            }
            if (data?.message) return data.message;
            if (data?.title) return data.title;
            return `Request failed (${err.response.status})`;
        }
        return err?.message || 'Request failed';
    };

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || user.role !== 'Admin') {
            navigate('/');
            return;
        }
        fetchAllEmployees();
    }, [navigate]);

    useEffect(() => {
        const filtered = employees.filter(emp =>
            emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredEmployees(filtered);
    }, [searchTerm, employees]);

    const fetchAllEmployees = async () => {
        try {
            const data = await getAllEmployees();
            setEmployees(data);
            setFilteredEmployees(data);
        } catch (err) {
            console.error('Error fetching employees:', err);
        }
    };

    const handleRowEditComplete = async (event) => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));

            const { newData } = event;
            const errors = validateEdit(newData);
            if (errors.length > 0) {
                setMessage(errors.join(' '));
                return;
            }
            
            const updateData = {
                name: newData.name,
                designation: newData.designation,
                address: newData.address,
                department: newData.department,
                joiningDate: newData.joiningDate,
                skillset: newData.skillset,
                username: newData.username,
                password: newData.password,
                role: newData.role,
                modifiedBy: user.username
            };

            await updateEmployee(newData.employeeID, updateData);
            setMessage('Employee updated successfully!');
            fetchAllEmployees();
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            console.error('Error updating employee:', err);
            setMessage(`Error updating employee: ${getApiErrorMessage(err)}`);
        }
    };

    const textEditor = (options) => (
        <input
            type="text"
            value={options.value || ''}
            onChange={(e) => options.editorCallback(e.target.value)}
            className="p-inputtext p-component"
        />
    );

    const actionsBodyTemplate = (row, options) => {
        const isActive = (row.status || '').trim() === 'Active';
        const isEditing = !!options?.rowEditor?.editing;

        return (
            <div className="actions-cell">
                <InputSwitch
                    checked={isActive}
                    disabled={isEditing}
                    onChange={async (e) => {
                        try {
                            const user = JSON.parse(localStorage.getItem('user'));
                            const nextStatus = e.value ? 'Active' : 'Inactive';

                            await updateEmployeeStatus(row.employeeID, nextStatus, user?.username || 'System');
                            setMessage('Status updated successfully!');
                            fetchAllEmployees();
                            setTimeout(() => setMessage(''), 3000);
                        } catch (err) {
                            setMessage(`Error updating status: ${getApiErrorMessage(err)}`);
                        }
                    }}
                />

                {options?.rowEditor?.element}
            </div>
        );
    };
    
    const dateEditor = (options) => {
        const value = options.value ? String(options.value).split('T')[0] : '';
        return (
            <input
                type="date"
                value={value}
                onChange={(e) => options.editorCallback(e.target.value)}
                className="p-inputtext p-component"
            />
        );
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/');
    };

    return (
        <div className="admin-dashboard">
            <div className="dashboard-header">
                <h1>Admin Dashboard</h1>
                    <div className="header-actions">
                        <button onClick={handleLogout} className="btn-logout">Logout</button>
                    </div>
            </div>

            {message && <div className="message">{message}</div>}

            <div className="search-container">
                <input
                    type="text"
                    placeholder="Search by name, username, or department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
            </div>

            <div className="table-container">
                <DataTable
                    value={filteredEmployees}
                    dataKey="employeeID"
                    editMode="row"
                    onRowEditComplete={handleRowEditComplete}
                    rowEditValidator={validateRowEdit}
                    paginator
                    rows={PAGE_SIZE}
                    rowsPerPageOptions={[5,10,25,50]}
                    stripedRows
                    emptyMessage="No employees found"
                    responsiveLayout="scroll"
                >
                    <Column field="employeeID" header="ID" sortable />
                    <Column field="name" header="Name" sortable editor={textEditor} />
                    <Column field="username" header="Username" sortable />
                    <Column field="designation" header="Designation" sortable body={(row) => row.designation || '-'} editor={textEditor} />
                    <Column field="department" header="Department" sortable body={(row) => row.department || '-'} editor={textEditor} />
                    <Column header="Joining Date" sortable sortField="joiningDate" body={(row) => (row.joiningDate ? new Date(row.joiningDate).toLocaleDateString() : '-')} editor={dateEditor} />
                    <Column field="skillset" header="Skillset" body={(row) => row.skillset || '-'} editor={textEditor} />
                    <Column field="status" header="Status" sortable body={(row) => (
                        <span className={`status-badge ${(row.status || '').toLowerCase()}`}>
                            {row.status || '-'}
                        </span>
                    )} />
                    <Column rowEditor header="Actions" body={actionsBodyTemplate} bodyStyle={{ overflow: 'visible' }} headerStyle={{ width: '10rem' }} />
                </DataTable>
            </div>
        </div>
    );
}

export default AdminDashboard;