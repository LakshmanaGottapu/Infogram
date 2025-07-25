import React, { useState, useRef } from 'react'
import type { User } from '../types/user';
function RegisterLogin({setUser}: {setUser: React.Dispatch<React.SetStateAction<User | null>>}) {
    const [isLogin, setIsLogin] = useState(true);
    const formRef = useRef<HTMLFormElement>(null);
    const [errors, setErrors] = useState<string[]>([]);
    const [successMessage, setSuccessMessage] = useState<string>('');
    const toggleForm = () => {
        setIsLogin(!isLogin);
        formRef.current?.reset(); // Reset form fields when toggling
        setSuccessMessage(''); // Clear success message when toggling forms
        setErrors([]); // Clear errors when toggling forms
    };
    async function handleLogin(event: React.FormEvent) {
        event.preventDefault();
        // Handle login logic here
        if (!formRef.current) return;
        setErrors(() => []); // Clear previous errors
        // Validate form inputs
        const formData = new FormData(formRef.current);
        const errors = [];
        console.log('Form Data:', Object.fromEntries(formData.entries()));
        const user = (formData.get('user') as string).trim();
        const password = (formData.get('password') as string).trim();
        const isMail = validateEmail(user);
        if(!(isMail || validateUsername(user))) errors.push("Invalid username or email.");
        if(!validatePassword(password)) errors.push("Password must contain: 8+ characters, 1 uppercase, 1 number, 1 symbol.")
        if(errors.length>0) return setErrors(errors);
        const payload = isMail ? JSON.stringify({ email: user, password: password }) : JSON.stringify({ username: user, password: password });
        try {
            const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload });
            const data = await response.json();
            if (response.ok) {
                // Handle successful login
                console.log('Login successful');
                setSuccessMessage('Login successful! Redirecting...');
                // Store access token and user info in session storage
                sessionStorage.setItem('accessToken', data.accessToken);
                sessionStorage.setItem('username', data.username);
                delete data.accessToken;
                setUser(data); // Update user state
            } else {
                // Handle login error
                console.error('Login failed');
                setErrors(errors => [...errors, data.message || data.msg]);
                setSuccessMessage('');
            }
        } catch (e) {
            console.error('An error occurred while logging in:', e);
            setErrors(errors => [...errors, 'An error occurred while processing your request.']);
            setSuccessMessage('');
        }
    }
    async function handleRegister(event: React.FormEvent) {
        event.preventDefault();
        // Handle registration logic here
        if (!formRef.current) return;
        setErrors(() => []); // Clear previous errors
        // Validate form inputs
        const formData = new FormData(formRef.current);
        const errors = [];
        console.log('Form Data:', Object.fromEntries(formData.entries()));
        const username = (formData.get('username') as string).trim();
        const email = (formData.get('email') as string).trim();
        const password = (formData.get('password') as string).trim();
        if (!validateUsername(username)) errors.push('Username must be at least 3 characters long and can only contain letters, numbers, and underscores.');
        if (!validateEmail(email)) errors.push('Invalid email format.');
        if (!validatePassword(password)) errors.push('Password must contain: 8+ characters, 1 uppercase, 1 number, 1 symbol.');
        if(errors.length>0) return setErrors(errors);
        const payload = JSON.stringify({ username, email, password });
        try {
            const response = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload });
            const data = await response.json();
            if (response.ok) {
                // Handle successful registration
                console.log('Registration successful');
                setSuccessMessage('Registration successful! You can now log in.');
                formRef.current.reset();
                // Optionally redirect or update UI
            } else {
                // Handle registration error
                console.error('Registration failed');
                setErrors(errors => [...errors, data.error || data.msg || data.message]);
                setSuccessMessage('');
            }
        } catch (e) {
            console.error('An error occurred while registering:', e);
            setErrors(errors => [...errors, 'An error occurred while processing your request.']);
            setSuccessMessage('');
        }

    }
    function validateEmail(input: string): boolean {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(input);
    }
    function validateUsername(input: string): boolean {
        const usernamePattern = /^\w{3,}$/;
        return usernamePattern.test(input.trim());
    }
    function validatePassword(input: string): boolean {
        const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return passwordPattern.test(input);
    }

    return (
        <div className="login-form">
            {isLogin ? (
                <>
                    <h2>Login</h2>
                    <form className="auth-form" ref={formRef} onSubmit={handleLogin}>
                        <input type="text" name="user" placeholder="Username or Email" required />
                        <input type="password" name="password" placeholder="Password" required />
                        <button type="submit">Login</button>
                    </form>
                    <p>
                        Don't have an account? <button className="toggle-link" onClick={toggleForm}>Register</button>
                    </p>
                </>
            ) : (
                <>
                    <h2>Register</h2>
                    <form className="auth-form" ref={formRef} onSubmit={handleRegister}>
                        <input type="text" name="username" placeholder="Username" required />
                        <input type="email" name="email" placeholder="Email" required />
                        <input type="password" name="password" placeholder="Password" required />
                        <button type="submit">Register</button>
                    </form>
                    <p>
                        Already have an account? <button className="toggle-link" onClick={toggleForm}>Login</button>
                    </p>
                </>
            )}
            {errors.length > 0 && (
                <div className="error-messages">
                    {errors.map((error, index) => (
                        <p key={index} className="text-red-500">{error}</p>
                    ))}
                </div>
            )}
            {successMessage && (
                <div className="success-message">
                    <p className="text-green-500">{successMessage}</p>
                </div>
            )}
        </div>
    )
}

export default RegisterLogin;
