import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEmployee, updateEmployee, updateProfileImage, getCurrentUser, logout } from '../services/api';
import './EmployeeDashboard.css';

function EmployeeDashboard() {
    const [employee, setEmployee] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [message, setMessage] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [removeImage, setRemoveImage] = useState(false); // Track if user wants to remove image
    const navigate = useNavigate();

    const convertFileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                // .NET expects raw Base64, so strip the "data:image/jpeg;base64," header
                const base64String = reader.result.toString().replace(/^data:(.*,)?/, '');
                resolve(base64String);
            };
            reader.onerror = error => reject(error);
        });
    };

    useEffect(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || !currentUser.employeeID) {
            navigate('/');
            return;
        }
        fetchEmployeeData(currentUser.employeeID);
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
        setSelectedFile(null);
        setRemoveImage(false);
        setMessage('');
    };

    const handleRemoveImage = () => {
        setRemoveImage(true);
        setSelectedFile(null); // Clear any selected file
    };

    const handleSave = async () => {
        try {
            setMessage('Saving changes...');
            const currentUser = getCurrentUser();
            
            const updateData = {
                ...formData,
                modifiedBy: currentUser.username 
            };
            
            // Execute Text Update 
            await updateEmployee(employee.employeeID, updateData);

            // Handle image update or removal
            if (removeImage) {
                // Send null or empty string to remove the image
                await updateProfileImage(employee.employeeID, '', currentUser.username);
            } else if (selectedFile) {
                // Upload new image
                const base64Image = await convertFileToBase64(selectedFile);
                await updateProfileImage(employee.employeeID, base64Image, currentUser.username);
            }

            // Reset UI and fetch fresh data
            setMessage('Profile updated successfully!');
            setIsEditing(false);
            setSelectedFile(null);
            setRemoveImage(false);
            fetchEmployeeData(employee.employeeID);
            
        } catch (err) {
            console.error('Save failed:', err);
            setMessage('Error updating profile');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    if (!employee) {
        return <div className="loading">Loading...</div>;
    }

    // Determine which image to display
    const getProfileImageSrc = () => {
        if (removeImage) {
            return 'https://img.freepik.com/free-vector/user-circles-set_78370-4704.jpg';
        }
        if (selectedFile) {
            return URL.createObjectURL(selectedFile);
        }
        if (employee.profileImage) {
            return `data:image/jpeg;base64,${employee.profileImage}`;
        }
        return 'https://img.freepik.com/free-vector/user-circles-set_78370-4704.jpg';
    };

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
                    <div className="profile-picture-container" style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <img 
                            src={getProfileImageSrc()} 
                            alt={`${employee.name}'s Profile`} 
                            style={{ 
                                width: '150px', 
                                height: '150px', 
                                borderRadius: '50%', 
                                objectFit: 'cover', 
                                border: '3px solid #e0e0e0',
                                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                            }}
                        />
                        
                        {isEditing && (
                            <div style={{ marginTop: '15px' }}>
                                <input 
                                    type="file" 
                                    accept="image/jpeg, image/png, image/jpg" 
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files.length > 0) {
                                            setSelectedFile(e.target.files[0]);
                                            setRemoveImage(false); // Clear remove flag when new file selected
                                        }
                                    }} 
                                    className="file-input"
                                />
                                {(employee.profileImage || selectedFile) && !removeImage && (
                                    <button 
                                        onClick={handleRemoveImage}
                                        className="btn-remove-image"
                                        style={{
                                            marginTop: '10px',
                                            padding: '4px 6px',
                                            backgroundColor: '#dc3545',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '14px',
                                            cursor: 'pointer',
                                            fontSize: '14px'
                                        }}
                                    >
                                        Remove
                                    </button>
                                )}
                                {removeImage && (
                                    <p style={{ 
                                        marginTop: '10px', 
                                        color: '#dc3545', 
                                        fontSize: '14px',
                                        fontStyle: 'italic'
                                    }}>
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
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