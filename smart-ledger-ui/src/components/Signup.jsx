import React, { useState } from 'react';
import './Login.css';

function Signup({ onNavigateToLogin, onSignupSuccess }) {
    const [name, setName] = useState('');
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

    const handleSignup = async (e) => {
        e.preventDefault();

        const eErr = validateEmail(email);
        const pErr = validatePasswordStrength(password);
        setEmailError(eErr);
        setPasswordError(pErr);
        if (eErr || pErr) return;


        const allUsers = JSON.parse(localStorage.getItem('smart_ledger_all_users') || '{}');
        if (allUsers[email]) {
            setEmailError('Login to your account');
            return;
        }


        const updatedUsers = { ...allUsers };
        updatedUsers[email] = {
            name: name.trim(),
            email: email.trim(),
            password: password,   // plain text — login లో same గా compare చేస్తాం
            createdAt: new Date().toISOString()
        };
        localStorage.setItem('smart_ledger_all_users', JSON.stringify(updatedUsers));


        const dataKey = `smart_ledger_data_${email}_incomes`;
        localStorage.setItem(dataKey, JSON.stringify([]));

        const budgetKey = `smart_ledger_data_${email}_budgetLimits`;
        localStorage.setItem(budgetKey, JSON.stringify({
            Food: 5000,
            Travel: 3000,
            Shopping: 7000,
            Bill: 10000,
            Other: 500
        }));


        sessionStorage.setItem('token', 'local_token_' + email);
        sessionStorage.setItem('smart_ledger_current_user', email);
        sessionStorage.setItem('smart_ledger_current_name', name.trim());


        try {
            const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';
            await fetch(`${BACKEND_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), email: email.trim(), password })
            });
        } catch (_) {

        }

        onSignupSuccess();
    };

    return (
        <div className="login-wrapper">
            <h1 className="welcome-title">Smart Ledger</h1>
            <p className="welcome-subtitle">
                Track income, expenses & savings — all in one place
            </p>
            <div className="login-card">
                <div className="login-header">
                    <h2>Create Account</h2>
                </div>

                <form onSubmit={handleSignup}>
                    <div className="field-group">
                        <input
                            type="text"
                            placeholder="Full Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

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
                            placeholder="Create Password"
                            value={password}
                            onChange={handlePasswordChange}
                            required
                            className={passwordError ? 'input-error' : ''}
                        />
                        {passwordError && (
                            <span className="field-error-text">{passwordError}</span>
                        )}
                    </div>

                    <button type="submit">Sign Up</button>
                </form>

                <div className="signup-link" style={{ marginTop: '15px' }}>
                    <p>
                        Already have an account?
                        <span
                            onClick={onNavigateToLogin}
                            style={{ cursor: 'pointer', color: 'blue', fontWeight: 'bold', marginLeft: '5px' }}
                        >
                            Login
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Signup;