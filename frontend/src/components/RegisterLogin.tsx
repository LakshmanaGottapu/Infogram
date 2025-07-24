import { useState, useRef } from 'react'

function RegisterLogin() {
    const [isLogin, setIsLogin] = useState(true);
    const formRef = useRef<HTMLFormElement>(null);
    const [errors, setErrors] = useState<string[]>([]);
    const [successMessage, setSuccessMessage] = useState<string>('');
    const toggleForm = () => {
        setIsLogin(!isLogin);
        setErrors([]); // Clear errors when toggling forms
    };
    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        setErrors(() => []); // Clear previous errors
        // Handle form submission logic here
        if (formRef.current) {
            const formData = new FormData(formRef.current);
            let payload: string;
            const password = (formData.get('password') as string).trim();
            if (!validatePassword(password)) return setErrors(errors => [...errors, 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.']);
            if (isLogin) {
                const user = (formData.get('user') as string).trim();
                const isMail = validateEmail(user);
                if(!isMail && !validateUsername(user)) return setErrors(errors => [...errors, 'Invalid username or email.']);
                console.log(`Username: ${user}, Password: ${password}`);
                payload = isMail ? JSON.stringify({ email: user, password: password }) : JSON.stringify({ username: user, password: password });
            }
            else{
                const username = (formData.get('username') as string).trim();
                const email = (formData.get('email') as string).trim();
                if (!validateUsername(username)) return setErrors(errors => [...errors, 'Username must be at least 3 characters long and can only contain letters, numbers, and underscores.']);
                if (!validateEmail(email)) return setErrors(errors => [...errors, 'Invalid email format.']);
                console.log(`Username: ${username}, Email: ${email}, Password: ${password}`);
                payload = JSON.stringify({ username, email, password });
                // Add your API call logic here
            }
            try{
                const response = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json', }, body: payload })                 
                if (response.ok) {
                    // Handle successful registration
                    console.log('Registration successful');
                    setSuccessMessage('Registration successful! You can now log in.');
                    // Optionally redirect or update UI
                } else {
                    // Handle registration error
                    console.error('Registration failed');
                    const errorData = await response.json();
                    setErrors(errors => [...errors, errorData.message || 'Registration failed.']);
                    setSuccessMessage('');
                }
            } catch(e){
                console.log(e)
                setErrors(errors => [...errors, 'An error occurred while processing your request.']);
                setSuccessMessage('');
            }
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
        return !passwordPattern.test(input);
    }

    return (
        <div>
            {isLogin ? (
                <>
                    <h2>Login</h2>
                    <form ref={formRef} onSubmit={handleSubmit}>
                        <input type="text" name="user" placeholder="Username or Email" required />
                        <input type="password" name="password" placeholder="Password" required />
                        <button type="submit">Login</button>
                    </form>
                    <p>
                        Don't have an account? <button onClick={toggleForm}>Register</button>
                    </p>
                </>
            ) : (
                <>
                    <h2>Register</h2>
                    <form ref={formRef} onSubmit={handleSubmit}>
                        <input type="text" name="username" placeholder="Username" required />
                        <input type="email" name="email" placeholder="Email" required />
                        <input type="password" name="password" placeholder="Password" required />
                        <button type="submit">Register</button>
                    </form>
                    <p>
                        Already have an account? <button onClick={toggleForm}>Login</button>
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
