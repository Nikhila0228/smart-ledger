import React, { useState } from 'react';
import './Login.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

function Login({ onLoginSuccess, onNavigateToSignup }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const validateEmail = (val) => {
        if (!val) return '';
        if (!val.endsWith('@gmail.com')) return 'Enter correct mail id';
        return '';
    };

    const validatePasswordStrength = (val) => {
        if (!val) return '';
        const hasLetter = /[a-zA-Z]/.test(val);
        const hasNumber = /[0-9]/.test(val);
        const hasSymbol = /[^a-zA-Z0-9]/.test(val);
        if (!hasLetter || !hasNumber || !hasSymbol) {
            return 'Enter strong password using letters, numbers, symbols';
        }
        return '';
    };

    const handleEmailChange = (e) => {
        const val = e.target.value;
        setEmail(val);
        setEmailError(validateEmail(val));
    };

    const handlePasswordChange = (e) => {
        const val = e.target.value;
        setPassword(val);
        setPasswordError(validatePasswordStrength(val));
    };


    const tryLocalLogin = () => {
        const allUsers = JSON.parse(localStorage.getItem('smart_ledger_all_users') || '{}');
        const userRecord = allUsers[email];

        if (!userRecord) {
            setPasswordError('Create account');
            return false;
        }
        if (userRecord.password !== password) {
            setPasswordError('Incorrect password or mail');
            return false;
        }


        sessionStorage.setItem('token', 'local_token_' + email);
        sessionStorage.setItem('smart_ledger_current_user', email);
        sessionStorage.setItem('smart_ledger_current_name', userRecord.name || '');
        return true;
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        const eErr = validateEmail(email);
        const pErr = validatePasswordStrength(password);
        setEmailError(eErr);
        setPasswordError(pErr);
        if (eErr || pErr) return;


        try {
            const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                const data = await response.json();
                sessionStorage.setItem('token', data.token);
                sessionStorage.setItem('smart_ledger_current_user', email);
                sessionStorage.setItem('smart_ledger_current_name', data.name || '');
                onLoginSuccess();
                return;
            } else {

                const allUsers = JSON.parse(localStorage.getItem('smart_ledger_all_users') || '{}');
                if (allUsers[email]) {
                    setPasswordError('Incorrect password or mail');
                } else {
                    setPasswordError('Create account');
                }
                return;
            }
        } catch (_) {

        }


        if (!tryLocalLogin()) {
            setPasswordError('Create account');
            return;
        }
        onLoginSuccess();
    };

    return (
        <div className="login-wrapper">
            <h1 className="welcome-title">Smart Ledger</h1>
            <p className="welcome-subtitle">
                Track income, expenses & savings — all in one place
            </p>

            <div className="login-card">
                <div className="login-header">
                    <h2>Login</h2>
                </div>

                <form onSubmit={handleLogin}>
                    <div className="field-group">
                        <input
                            type="text"
                            placeholder="Email"
                            value={email}
                            onChange={handleEmailChange}
                            required
                            className={emailError ? 'input-error' : ''}
                        />
                        {emailError && (
                            <span className="field-error-text">{emailError}</span>
                        )}
                    </div>

                    <div className="field-group">
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={handlePasswordChange}
                            required
                            className={passwordError ? 'input-error' : ''}
                        />
                        {passwordError && (
                            <span className="field-error-text">{passwordError}</span>
                        )}
                    </div>

                    <button type="submit">Get Started</button>
                </form>

                <div className="signup-link">
                    <p>
                        Don't have an account?{' '}
                        <span onClick={onNavigateToSignup} style={{ cursor: 'pointer', color: 'blue' }}>
                            Sign up
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;