import User from "../models/User.js";

// Helper function to generate unique username
export async function generateUniqueUsername(baseUsername: string): Promise<string> {
  let username = baseUsername;
  let suffix = 1;
  while (await User.findOne({ username })) {
    username = `${baseUsername}_${suffix++}`;
  }
  return username;
}

// Helper function to handle existing user with email
export async function handleExistingUserWithEmail(email: string, googleId: string) {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    existingUser.googleId = googleId;
    await existingUser.save();
    return { id: existingUser._id, username: existingUser.username };
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
  
  return { id: newUser._id, username: newUser.username };
}

