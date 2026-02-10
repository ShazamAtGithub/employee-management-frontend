import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllEmployees, updateEmployee } from '../services/api';
import './AdminDashboard.css';

function AdminDashboard() {
    const [employees, setEmployees] = useState([]);
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [formData, setFormData] = useState({});
    const [message, setMessage] = useState('');
    const [viewMode, setViewMode] = useState('table');
    const [currentPage, setCurrentPage] = useState(1);
    const [returnAfterEdit, setReturnAfterEdit] = useState(null);
    const navigate = useNavigate();

    const PAGE_SIZE = 10;

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

    useEffect(() => {
        // Reset pagination when search changes
        setCurrentPage(1);
    }, [searchTerm]);

    useEffect(() => {
        // Clamp page when filtered results change
        const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / PAGE_SIZE));
        setCurrentPage((prev) => Math.min(prev, totalPages));
    }, [filteredEmployees.length]);

    const fetchAllEmployees = async () => {
        try {
            const data = await getAllEmployees();
            setEmployees(data);
            setFilteredEmployees(data);
        } catch (err) {
            console.error('Error fetching employees:', err);
        }
    };

    const startEditingEmployee = (employee, { switchToTable } = { switchToTable: false }) => {
        if (switchToTable) {
            // Editing UI is implemented in the table layout; when the user starts editing from grid,
            // temporarily switch to table and then return to the prior view on save/cancel.
            setReturnAfterEdit({ viewMode, page: currentPage });
            setViewMode('table');
            const index = filteredEmployees.findIndex((e) => e.employeeID === employee.employeeID);
            if (index >= 0) {
                const page = Math.floor(index / PAGE_SIZE) + 1;
                setCurrentPage(page);
            }
        } else {
            setReturnAfterEdit(null);
        }
        setEditingEmployee(employee.employeeID);
        setFormData(employee);
        setMessage('');
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSave = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const updateData = {
                ...formData,
                modifiedBy: user.username
            };
            await updateEmployee(editingEmployee, updateData);
            setMessage('Employee updated successfully!');
            setEditingEmployee(null);
            if (returnAfterEdit) {
                setViewMode(returnAfterEdit.viewMode);
                setCurrentPage(returnAfterEdit.page);
                setReturnAfterEdit(null);
            }
            fetchAllEmployees();
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage('Error updating employee');
        }
    };

    const handleCancel = () => {
        setEditingEmployee(null);
        setFormData({});
        setMessage('');
        if (returnAfterEdit) {
            setViewMode(returnAfterEdit.viewMode);
            setCurrentPage(returnAfterEdit.page);
            setReturnAfterEdit(null);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/');
    };

    const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / PAGE_SIZE));
    const pagedEmployees = filteredEmployees.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    const goPrevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
    const goNextPage = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

    return (
        <div className="admin-dashboard">
            <div className="dashboard-header">
                <h1>Admin Dashboard</h1>
                <div className="header-actions">
                    <div className="view-toggle">
                        <button
                            type="button"
                            className={`btn-view ${viewMode === 'table' ? 'active' : ''}`}
                            onClick={() => setViewMode('table')}
                        >
                            Table
                        </button>
                        <button
                            type="button"
                            className={`btn-view ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => setViewMode('grid')}
                        >
                            Grid
                        </button>
                    </div>
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
                {filteredEmployees.length === 0 ? (
                    <div className="no-data">No employees found</div>
                ) : viewMode === 'table' ? (
                    <>
                        <table className="employee-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Username</th>
                                    <th>Designation</th>
                                    <th>Department</th>
                                    <th>Joining Date</th>
                                    <th>Skillset</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagedEmployees.map(emp => (
                                    editingEmployee === emp.employeeID ? (
                                        <tr key={emp.employeeID} className="editing-row">
                                            <td>{emp.employeeID}</td>
                                            <td>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={formData.name || ''}
                                                    onChange={handleChange}
                                                />
                                            </td>
                                            <td>{emp.username}</td>
                                            <td>
                                                <input
                                                    type="text"
                                                    name="designation"
                                                    value={formData.designation || ''}
                                                    onChange={handleChange}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    name="department"
                                                    value={formData.department || ''}
                                                    onChange={handleChange}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="date"
                                                    name="joiningDate"
                                                    value={formData.joiningDate ? formData.joiningDate.split('T')[0] : ''}
                                                    onChange={handleChange}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    name="skillset"
                                                    value={formData.skillset || ''}
                                                    onChange={handleChange}
                                                />
                                            </td>
                                            <td>
                                                <select
                                                    name="status"
                                                    value={formData.status || 'Active'}
                                                    onChange={handleChange}
                                                    className="status-select"
                                                >
                                                    <option value="Active">Active</option>
                                                    <option value="Inactive">Inactive</option>
                                                </select>
                                            </td>
                                            <td>
                                                <button onClick={handleSave} className="btn-save-small">Save</button>
                                                <button onClick={handleCancel} className="btn-cancel-small">Cancel</button>
                                            </td>
                                        </tr>
                                    ) : (
                                        <tr key={emp.employeeID}>
                                            <td>{emp.employeeID}</td>
                                            <td>{emp.name}</td>
                                            <td>{emp.username}</td>
                                            <td>{emp.designation || '-'}</td>
                                            <td>{emp.department || '-'}</td>
                                            <td>{emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : '-'}</td>
                                            <td>{emp.skillset || '-'}</td>
                                            <td>
                                                <span className={`status-badge ${(emp.status || '').toLowerCase()}`}>
                                                    {emp.status}
                                                </span>
                                            </td>
                                        <td>
                                            <button onClick={() => startEditingEmployee(emp)} className="btn-edit-small">Edit</button>
                                        </td>
                                        </tr>
                                    )
                                ))}
                            </tbody>
                        </table>
                    </>
                ) : (
                    <div className="grid-container">
                        {pagedEmployees.map((emp) => (
                            <div key={emp.employeeID} className="employee-card">
                                <div className="employee-card-header">
                                    <div className="employee-card-title">
                                        <div className="employee-name">{emp.name}</div>
                                        <div className="employee-username">{emp.username}</div>
                                    </div>
                                    <span className={`status-badge ${(emp.status || '').toLowerCase()}`}>
                                        {emp.status}
                                    </span>
                                </div>

                                <div className="employee-card-body">
                                    <div className="employee-card-row"><span className="employee-card-label">ID:</span> {emp.employeeID}</div>
                                    <div className="employee-card-row"><span className="employee-card-label">Designation:</span> {emp.designation || '-'}</div>
                                    <div className="employee-card-row"><span className="employee-card-label">Department:</span> {emp.department || '-'}</div>
                                    <div className="employee-card-row"><span className="employee-card-label">Joining Date:</span> {emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : '-'}</div>
                                    <div className="employee-card-row"><span className="employee-card-label">Skillset:</span> {emp.skillset || '-'}</div>
                                </div>

                                <div className="employee-card-actions">
                                    <button
                                        type="button"
                                        onClick={() => startEditingEmployee(emp, { switchToTable: true })}
                                        className="btn-edit-small"
                                    >
                                        Edit
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {filteredEmployees.length > 0 && (
                    <div className="pagination">
                        <button
                            type="button"
                            className="btn-page"
                            onClick={goPrevPage}
                            disabled={currentPage === 1}
                        >
                            Prev
                        </button>
                        <div className="page-info">Page {currentPage} of {totalPages}</div>
                        <button
                            type="button"
                            className="btn-page"
                            onClick={goNextPage}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminDashboard;