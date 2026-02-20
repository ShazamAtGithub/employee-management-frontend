import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';
import './Login.css';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const navigate = useNavigate();

    const validate = () => {
        const nextErrors = {};
        const trimmedUsername = (username || '').trim();
        const rawPassword = password || '';

        if (!trimmedUsername) {
            nextErrors.username = 'Username is required.';
        } 
        if (!rawPassword) {
            nextErrors.password = 'Password is required.';
        }

        setFieldErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!validate()) return;
        
        try {
            const response = await login(username.trim(), password);
            
            if (response.role === 'Admin') {
                navigate('/admin-dashboard');
            } else {
                navigate('/employee-dashboard');
            }
        } catch (err) {
            const serverMessage = err?.response?.data?.message;
            if (serverMessage && serverMessage.toLowerCase().includes('inactive')) {
                localStorage.clear();
                navigate('/disabled-account');
                return;
            }

            if (serverMessage) {
                setError(serverMessage);
            } else {
                setError('Invalid username or password');
            }
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h2>Employee Management System</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="login-username">Username</label>
                        <input
                            id="login-username"
                            type="text"
                            value={username}
                            onChange={(e) => {
                                setUsername(e.target.value);
                                if (fieldErrors.username) {
                                    setFieldErrors((prev) => ({ ...prev, username: undefined }));
                                }
                            }}
                            required
                        />
                        {fieldErrors.username && <div className="field-error">{fieldErrors.username}</div>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="login-password">Password</label>
                        <input
                            id="login-password"
                            type="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if (fieldErrors.password) {
                                    setFieldErrors((prev) => ({ ...prev, password: undefined }));
                                }
                            }}
                            required
                        />
                        {fieldErrors.password && <div className="field-error">{fieldErrors.password}</div>}
                    </div>
                    {error && <div className="error">{error}</div>}
                    <button type="submit" className="btn-login">Login</button>
                </form>
                <p className="register-link">
                    Don't have an account? <span onClick={() => navigate('/register')}>Register</span>
                </p>
            </div>
        </div>
    );
}

export default Login;