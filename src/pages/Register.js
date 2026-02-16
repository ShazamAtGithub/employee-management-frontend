import React, { useState, useEffect, useRef } from 'react';
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
    const [profileImageFile, setProfileImageFile] = useState(null);
    const [profilePreview, setProfilePreview] = useState(null);
    const fileInputRef = useRef(null);
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

        // profile image validation
        if (profileImageFile) {
            if (!profileImageFile.type.startsWith('image/')) nextErrors.profileImage = 'Profile image must be an image file.';
            const maxBytes = 2 * 1024 * 1024; // 2MB
            if (profileImageFile.size > maxBytes) nextErrors.profileImage = 'Profile image must be 2MB or smaller.';
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

    const handleFileChange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) {
            setProfileImageFile(null);
            if (profilePreview) {
                URL.revokeObjectURL(profilePreview);
                setProfilePreview(null);
            }
            setFieldErrors((prev) => ({ ...prev, profileImage: undefined }));
            return;
        }
        if (!file.type.startsWith('image/')) {
            setFieldErrors((prev) => ({ ...prev, profileImage: 'Profile image must be an image file.' }));
            return;
        }
        const maxBytes = 2 * 1024 * 1024;
        if (file.size > maxBytes) {
            setFieldErrors((prev) => ({ ...prev, profileImage: 'Profile image must be 2MB or smaller.' }));
            return;
        }
        if (profilePreview) URL.revokeObjectURL(profilePreview);
        const previewUrl = URL.createObjectURL(file);
        setProfileImageFile(file);
        setProfilePreview(previewUrl);
        setFieldErrors((prev) => ({ ...prev, profileImage: undefined }));
    };

    const handleRemoveImage = () => {
        setProfileImageFile(null);
        if (profilePreview) {
            URL.revokeObjectURL(profilePreview);
            setProfilePreview(null);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = null;
        }
        setFieldErrors((prev) => ({ ...prev, profileImage: undefined }));
    };

    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result;
                if (typeof result === 'string') {
                    // result is data:[<mediatype>][;base64],<data>
                    const idx = result.indexOf(',');
                    const base64 = idx >= 0 ? result.substring(idx + 1) : result;
                    resolve(base64);
                } else {
                    reject(new Error('Unable to read file as base64'));
                }
            };
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(file);
        });
    };

    useEffect(() => {
        return () => {
            if (profilePreview) URL.revokeObjectURL(profilePreview);
        };
    }, [profilePreview]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!validate()) return;

        try {
            // Build JSON payload expected by backend controller which accepts Base64ProfileImage
            let base64Image = null;
            if (profileImageFile) {
                base64Image = await fileToBase64(profileImageFile);
            }

            const payload = {
                Name: formData.name.trim(),
                Designation: formData.designation || null,
                Address: formData.address || null,
                Department: formData.department || null,
                JoiningDate: formData.joiningDate || null,
                Skillset: formData.skillset || null,
                Base64ProfileImage: base64Image,
                Username: formData.username.trim(),
                Password: formData.password,
                CreatedBy: 'Self'
            };

            await register(payload);
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
                <form onSubmit={handleSubmit} encType="multipart/form-data">
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

                    <div className="form-group">
                        <label>Profile Image (optional, max 2MB)</label>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} />
                        {fieldErrors.profileImage && <div className="field-error">{fieldErrors.profileImage}</div>}
                        {profilePreview && (
                            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <img src={profilePreview} alt="Preview" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 6 }} />
                                <button type="button" className="btn-remove" onClick={handleRemoveImage}>Remove</button>
                            </div>
                        )}
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