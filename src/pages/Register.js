import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../services/api';
import './Register.css';

function Register() {
    const [formData, setFormData] = useState({
        name: '',
        designation: '',
        address: '',
        department: '',
        joiningDate: '',
        skillset: '',
        username: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const navigate = useNavigate();

    const validate = () => {
        const nextErrors = {};
        const name = (formData.name || '').trim();
        const username = (formData.username || '').trim();
        const password = formData.password || '';
        const confirmPassword = formData.confirmPassword || '';

        if (!name) nextErrors.name = 'Full name is required.';
        else if (name.length > 100) nextErrors.name = 'Full name must be at most 100 characters.';

        if (formData.designation && formData.designation.length > 100) nextErrors.designation = 'Designation must be at most 100 characters.';
        if (formData.address && formData.address.length > 200) nextErrors.address = 'Address must be at most 200 characters.';
        if (formData.department && formData.department.length > 100) nextErrors.department = 'Department must be at most 100 characters.';
        if (formData.skillset && formData.skillset.length > 200) nextErrors.skillset = 'Skillset must be at most 200 characters.';

        if (!username) nextErrors.username = 'Username is required.';
        else if (username.length < 3 || username.length > 50) nextErrors.username = 'Username must be 3–50 characters.';

        if (!password) nextErrors.password = 'Password is required.';
        else if (password.length < 8) nextErrors.password = 'Password must be at least 8 characters.';

        if (!confirmPassword) nextErrors.confirmPassword = 'Please confirm your password.';
        else if (password !== confirmPassword) nextErrors.confirmPassword = 'Passwords do not match.';

        if (formData.joiningDate) {
            const parsed = Date.parse(formData.joiningDate);
            if (Number.isNaN(parsed)) nextErrors.joiningDate = 'Joining date must be a valid date.';
        }

        setFieldErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name } = e.target;
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        if (fieldErrors[name]) {
            setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!validate()) return;

        try {
            const employeeData = {
                name: formData.name.trim(),
                designation: formData.designation,
                address: formData.address,
                department: formData.department,
                joiningDate: formData.joiningDate || null,
                skillset: formData.skillset,
                username: formData.username.trim(),
                password: formData.password,
                // provide defaults to satisfy server-side validation (adjust if backend expects different values)
                role: 'Employee',
                status: 'Active',
                createdBy: 'Self'
            };

            await register(employeeData);
            setSuccess('Registration successful! Redirecting to login...');
            setTimeout(() => navigate('/'), 2000);
        } catch (err) {
            console.error('Registration error:', err);
            if (err.response) {
                setError(err.response.data?.message || `Registration failed (status ${err.response.status}).`);
            } else if (err.request) {
                setError('Registration failed: no response from server. Is the backend running?');
            } else {
                setError(`Registration failed: ${err.message}`);
            }
        }
    };

    return (
        <div className="register-container">
            <div className="register-box">
                <h2>Employee Registration</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Full Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                            {fieldErrors.name && <div className="field-error">{fieldErrors.name}</div>}
                        </div>
                        <div className="form-group">
                            <label>Designation</label>
                            <input
                                type="text"
                                name="designation"
                                value={formData.designation}
                                onChange={handleChange}
                            />
                            {fieldErrors.designation && <div className="field-error">{fieldErrors.designation}</div>}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Address</label>
                        <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                        />
                        {fieldErrors.address && <div className="field-error">{fieldErrors.address}</div>}
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Department</label>
                            <input
                                type="text"
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                            />
                            {fieldErrors.department && <div className="field-error">{fieldErrors.department}</div>}
                        </div>
                        <div className="form-group">
                            <label>Joining Date</label>
                            <input
                                type="date"
                                name="joiningDate"
                                value={formData.joiningDate}
                                onChange={handleChange}
                            />
                            {fieldErrors.joiningDate && <div className="field-error">{fieldErrors.joiningDate}</div>}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Skillset (comma separated)</label>
                        <input
                            type="text"
                            name="skillset"
                            value={formData.skillset}
                            onChange={handleChange}
                            placeholder="e.g., C#, React, SQL"
                        />
                        {fieldErrors.skillset && <div className="field-error">{fieldErrors.skillset}</div>}
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Username *</label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                            />
                            {fieldErrors.username && <div className="field-error">{fieldErrors.username}</div>}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Password *</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                            {fieldErrors.password && <div className="field-error">{fieldErrors.password}</div>}
                        </div>
                        <div className="form-group">
                            <label>Confirm Password *</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                            {fieldErrors.confirmPassword && <div className="field-error">{fieldErrors.confirmPassword}</div>}
                        </div>
                    </div>

                    {error && <div className="error">{error}</div>}
                    {success && <div className="success">{success}</div>}

                    <button type="submit" className="btn-register">Register</button>
                </form>
                <p className="login-link">
                    Already have an account? <span onClick={() => navigate('/')}>Login</span>
                </p>
            </div>
        </div>
    );
}

export default Register;