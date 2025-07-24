import type { User } from '../types/user.ts';
export async function getCurrentUser() {
    try{
        const response = await fetch('/api/auth/current_user', {
            method: 'GET',
            credentials: 'include',
        });

        if (!response.ok) throw new Error('Failed to fetch current user');

        const user: User = await response.json();
        return user;
    } catch (error) {
        console.error('Error fetching current user:', error);
        return null;
    }
}