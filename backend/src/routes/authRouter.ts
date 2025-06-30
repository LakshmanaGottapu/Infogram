/* POST /api/auth/register – create a new user

POST /api/auth/login – login with email & password → returns JWT

GET /api/user/me – get current user (protected route) */

import { Router } from "express";
import { registerUser, loginUser, refreshToken } from "../controllers/authController.js";
import { validateUserPayload } from "../middleware/authMiddleware.js";

const authRouter = Router();

authRouter.post("/api/auth/register", validateUserPayload, registerUser)

authRouter.post("/api/auth/login", loginUser)

// Refresh endpoint
// authRouter.post('/refresh', refreshToken);

export default authRouter;