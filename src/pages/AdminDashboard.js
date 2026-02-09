import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllEmployees, updateEmployee, deleteEmployee } from '../services/api';
import './AdminDashboard.css';

function AdminDashboard() {
    const [employees, setEmployees] = useState([]);
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [formData, setFormData] = useState({});
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

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

    const handleEdit = (employee) => {
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
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this employee?')) {
            try {
                const user = JSON.parse(localStorage.getItem('user'));
                await deleteEmployee(id, user.username);
                setMessage('Employee deleted successfully!');
                fetchAllEmployees();
                setTimeout(() => setMessage(''), 3000);
            } catch (err) {
                setMessage('Error deleting employee');
            }
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/');
    };

    return (
        <div className="admin-dashboard">
            <div className="dashboard-header">
                <h1>Admin Dashboard</h1>
                <button onClick={handleLogout} className="btn-logout">Logout</button>
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
                        {filteredEmployees.map(emp => (
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
                                    <td>{emp.status}</td>
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
                                        <span className={`status-badge ${emp.status.toLowerCase()}`}>
                                            {emp.status}
                                        </span>
                                    </td>
                                    <td>
                                        <button onClick={() => handleEdit(emp)} className="btn-edit-small">Edit</button>
                                        <button onClick={() => handleDelete(emp.employeeID)} className="btn-delete-small">Delete</button>
                                    </td>
                                </tr>
                            )
                        ))}
                    </tbody>
                </table>

                {filteredEmployees.length === 0 && (
                    <div className="no-data">No employees found</div>
                )}
            </div>
        </div>
    );
}

export default AdminDashboard;