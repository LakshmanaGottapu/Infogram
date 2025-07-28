import type { User } from '../types/user.ts';
export async function getCurrentUser() {
    try {
        // Fetch current user from the backend
        if (!sessionStorage.getItem('accessToken')) {
            console.warn('No access token found in session storage');
            const tokenResponse = await refreshToken(); // Attempt to refresh token if not present
            if (!tokenResponse.ok) return null;
        }
        const response = await fetch('/api/user/me', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'authorization': `Bearer ${sessionStorage.getItem('accessToken') || ''}`
            },
        });

        if (!response.ok) {
            // Handle unauthorized access
            sessionStorage.removeItem('accessToken');
            const response = await fetch('/api/auth/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });
            if (!response.ok)
                return null;
            else {
                const newUser = await response.json();
                sessionStorage.setItem('accessToken', newUser.accessToken);
                return { id: newUser.id, username: newUser.username } as User;
            }
        }
        const user: User = await response.json();
        return user;
    } catch (error) {
        console.error('Error fetching current user:', error);
        return null;
    }
}
async function refreshToken() {
    try {
        const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include' // Ensure cookies are sent with the request
        });

        if (!response.ok) {
            console.error('Failed to refresh token');
            return null;
        }

        const data = await response.json();
        sessionStorage.setItem('accessToken', data.accessToken);
        return data;
    } catch (error) {
        console.error('Error refreshing token:', error);
        return null;
    }
}

