import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEmployee, updateEmployee } from '../services/api';
import './EmployeeDashboard.css';

function EmployeeDashboard() {
    const [employee, setEmployee] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            navigate('/');
            return;
        } // if user not found redirect to login page 
        fetchEmployeeData(user.employeeID);
    }, [navigate]);

    const fetchEmployeeData = async (id) => {
        try {
            const data = await getEmployee(id);
            setEmployee(data);
            setFormData(data);
        } catch (err) {
            console.error('Error fetching employee data:', err);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleEdit = () => {
        setIsEditing(true);
        setMessage('');
    };

    const handleCancel = () => {
        setIsEditing(false);
        setFormData(employee);
        setMessage('');
    };

    const handleSave = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const updateData = {
                ...formData,
                modifiedBy: user.username
            };
            await updateEmployee(employee.employeeID, updateData);
            setMessage('Profile updated successfully!');
            setIsEditing(false);
            fetchEmployeeData(employee.employeeID);
        } catch (err) {
            setMessage('Error updating profile');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/');
    };

    if (!employee) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="employee-dashboard">
            <div className="dashboard-header">
                <h1>Employee Dashboard</h1>
                <button onClick={handleLogout} className="btn-logout">Logout</button>
            </div>

            <div className="profile-container">
                <h2>My Profile</h2>
                {message && <div className="message">{message}</div>}

                <div className="profile-content">
                    <div>
                        <div className="profile-field">
                            <label>Full Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name || ''}
                                onChange={handleChange}
                                disabled={!isEditing}
                            />
                        </div>
                    </div>

                    <div className="profile-row">
                        <div className="profile-field">
                            <label>Username</label>
                            <input type="text" value={employee.username} disabled />
                        </div>
                        <div className="profile-field">
                            <label>Designation</label>
                            <input
                                type="text"
                                name="designation"
                                value={formData.designation || ''}
                                onChange={handleChange}
                                disabled={!isEditing}
                            />
                        </div>
                    </div>

                    <div className="profile-field">
                        <label>Address</label>
                        <input
                            type="text"
                            name="address"
                            value={formData.address || ''}
                            onChange={handleChange}
                            disabled={!isEditing}
                        />
                    </div>

                    <div className="profile-row">
                        <div className="profile-field">
                            <label>Department</label>
                            <input
                                type="text"
                                name="department"
                                value={formData.department || ''}
                                onChange={handleChange}
                                disabled={!isEditing}
                            />
                        </div>
                        <div className="profile-field">
                            <label>Joining Date</label>
                            <input
                                type="date"
                                name="joiningDate"
                                value={formData.joiningDate ? formData.joiningDate.split('T')[0] : ''}
                                onChange={handleChange}
                                disabled={!isEditing}
                            />
                        </div>
                    </div>

                    <div className="profile-field">
                        <label>Skillset</label>
                        <input
                            type="text"
                            name="skillset"
                            value={formData.skillset || ''}
                            onChange={handleChange}
                            disabled={!isEditing}
                        />
                    </div>
                    <div className="button-group">
                        {!isEditing ? (
                            <button onClick={handleEdit} className="btn-edit">Edit Profile</button>
                        ) : (
                            <>
                                <button onClick={handleSave} className="btn-save">Save Changes</button>
                                <button onClick={handleCancel} className="btn-cancel">Cancel</button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default EmployeeDashboard;