/* POST /api/auth/register – create a new user

POST /api/auth/login – login with email & password → returns JWT

GET /api/user/me – get current user (protected route) */

import { Router } from "express";
import { registerUser, loginUser, refreshToken, logOut, googleCallback } from "../controllers/authController.js";
import { validateUserPayload } from "../middleware/authMiddleware.js";
import passport from "passport";
import User from "../models/User.js"; // Assuming you have a User model defined
import {Strategy as GoogleStrategy} from "passport-google-oauth20";

const authRouter = Router();
authRouter.use(passport.initialize());
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
}, async (_, __, profile, done) => {
    try {
        let existingUser = await User.findOne({ googleId: profile.id });
        if (!existingUser) {
            existingUser = await User.create({
                username: profile.displayName,
                email: profile.emails[0].value,
                googleId: profile.id
            });
        }
        done(null, {id: existingUser._id, username: existingUser.username});
    } catch (error) {
        done(error, null);
    }
}));
authRouter.post("/api/auth/register", validateUserPayload, registerUser);

authRouter.post("/api/auth/login", loginUser);

// Refresh endpoint
authRouter.post('/api/auth/refresh', refreshToken);

authRouter.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google OAuth callback endpoint
authRouter.get('/api/auth/google/callback', googleCallback);

//Logout endpoint
authRouter.get('/api/auth/logout', logOut);

export default authRouter;