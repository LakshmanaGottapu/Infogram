import type { User } from '../types/user.ts';
export async function getCurrentUser() {
    try{
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
                    // credentials:'include'
                });
                if(!response.ok) 
                    return null;
                else{
                    const newUser = await response.json();
                    sessionStorage.setItem('accessToken', newUser.accessToken);
                    return {id: newUser.id, username: newUser.username} as User;
                }
            }
            const user: User = await response.json();
        return user;
    } catch (error) {
        console.error('Error fetching current user:', error);
        return null;
    }
}

