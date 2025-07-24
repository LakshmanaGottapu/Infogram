export interface User {
    id: string;
    username: string;
    email: string;
    profilePictureUrl?: string;
}

export interface UserProfile {
    user: User;
    bio?: string;
    website?: string;
    followersCount: number;
    followingCount: number;
    postsCount: number;
}