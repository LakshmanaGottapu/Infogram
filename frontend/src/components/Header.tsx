import useAuth from '../context/useAuth'
import { Link } from 'react-router-dom'
function Header() {
    const { user, setUser } = useAuth();
    function handleLogout() {
        //clear refresh token by calling logout endpoint
        fetch('/api/auth/logout')
            .then(response => {
                if (!response.ok) {
                    console.error('Logout failed');
                    return;
                }
                sessionStorage.removeItem('accessToken');
                sessionStorage.removeItem('username');
                setUser(null);
                console.log('Logout successful');
            })
    }
    return (
        <header className="bg-gray-800 text-white p-4">
            <h1 className="text-2xl">Instagram Clone</h1>
            {user && (
                <>
                    <p>Welcome, {user.username}!</p>
                    <nav>
                        <ul className="flex space-x-4">
                            <li><Link to="/feed">Feed</Link></li>
                            <li><Link to="/profile">Profile</Link></li>
                            <li><button className="cursor-pointer" onClick={handleLogout}>Logout</button></li>
                        </ul>
                    </nav>
                </>
            )}
        </header>
    )
}

export default Header
