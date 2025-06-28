import { Types } from "mongoose";

export interface UserPayload {
    username?: string,
    email?: string,
    password?: string,

}
interface IUserProfile {
  name?: string;
  bio?: string;
  avatar?: string;
  website?: string;
}

export interface UserResponse {
  username: string;
  email: string;
  password: string;
  profile: IUserProfile;
  followers: Types.ObjectId[];
  following: Types.ObjectId[];
  postsCount: number;
  followersCount: number;
  followingCount: number;
  createdAt: Date;
  updatedAt: Date;
}