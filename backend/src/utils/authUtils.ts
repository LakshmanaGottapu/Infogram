import mongoose from "mongoose";
import User from "../models/User.js";
// Helper function to generate unique username
export async function generateUniqueUsername(baseUsername: string): Promise<string> {
  const cleanUsername = baseUsername.trim().toLowerCase().replace(/\s+/g, "_"); // Clean username to be URL-friendly
  let username = cleanUsername;
  let suffix = 1;
  while (await User.findOne({ username })) {
    username = `${cleanUsername}_${suffix++}`;
  }
  return username;
}

// Helper function to handle existing user with email
export async function handleExistingUserWithEmail(email: string, googleId: string) {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    existingUser.googleId = googleId;
    await existingUser.save();
    return { id: (existingUser._id as mongoose.Types.ObjectId).toString(), username: existingUser.username };
  }
  return null;
}

// Helper function to create new Google user
export async function createGoogleUser(profile: any, email: string) {
  const baseUsername = profile.displayName || "user";
  const username = await generateUniqueUsername(baseUsername);
  
  const newUser = await User.create({
    username,
    email,
    googleId: profile.id
  });

  return { id: (newUser._id as mongoose.Types.ObjectId).toString(), username: newUser.username };
}

