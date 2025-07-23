/* POST /api/auth/register – create a new user

POST /api/auth/login – login with email & password → returns JWT

GET /api/user/me – get current user (protected route) */

import { Router, Request, Response } from "express";
import { registerUser, loginUser, refreshToken, logOut, googleCallback } from "../controllers/authController.js";
import { authenticate, validateUserPayload } from "../middleware/authMiddleware.js";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { createGoogleUser, handleExistingUserWithEmail } from "../utils/authUtils.js";
const authRouter = Router();
authRouter.use(passport.initialize());


passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
}, async (_, __, profile, done) => {
    try {
        const email = Array.isArray(profile.emails) && profile.emails.length > 0 ? profile.emails[0].value : null;
        if (!email) return done(new Error("No email provided by Google"), null);

        // Try to link existing account or create new one
        const linkedUser = await handleExistingUserWithEmail(email, profile.id);
        if (linkedUser) return done(null, linkedUser);

        // Create new user
        const newUser = await createGoogleUser(profile, email);
        done(null, newUser);
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

authRouter.get('/api/user/me', authenticate, (req: Request, res: Response):void => {
    if (!req.user) {
        res.status(401).json({ msg: "Unauthorized" });
        return;
    }
    res.json({ msg: "User info", user: req.user });
});

export default authRouter;