import { NextFunction, Request, Response } from "express";
import { isValidEmail, isValidPassword, isValidUsername } from "../utils/userUtils.js";
import { verifyToken } from "../utils/tokenUtils.js"; // Assuming you have a utility to verify JWT tokens
import logger from "../config/logger.js";
// Extend Express Request interface to include 'user'
// It's common to extend the Express Request interface in a central place (e.g., a types/global.d.ts file).
// However, if you only use req.user in files that import this middleware, it's acceptable here for small projects.
// For larger projects, move this to a global types file to ensure all files (controllers, etc.) recognize req.user.

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string; // or any other user properties you want to include
                username: string;
            };
        }
    }
}

export function validateUserPayload(req:Request, res:Response, next:NextFunction) {
    const { username, email, password } = req.body;
    if (!(username && email && password)) {
        res.status(400).json({ msg: "Mandatory fields are missing values" });
        return;
    }
    if (!isValidUsername(username)) {
        res.status(400).json({
            msg: "Username must be 3-20 characters (letters, numbers, underscores)"
        });
        return;
    }
    if (!isValidEmail(email)) {
        res.status(400).json({ msg: "Invalid email format" });
        return;
    }
    if (!isValidPassword(password)) {
        res.status(400).json({
            msg: "Password must contain: 8+ characters, 1 uppercase, 1 number, 1 symbol"
        });
        return ;
    }
    next();
}

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
    const token = req?.cookies?.SessionCookie;
    if (!token) {
        logger.warn("Unauthorized access attempt without token");
        res.status(401).json({ msg: "Unauthorized access" });
        return;
    }
    try {
        // Assuming you have a function to verify the token
        const decoded = verifyToken(token); // Implement this function based on your JWT library
        if (
            typeof decoded === "object" &&
            decoded !== null &&
            typeof decoded.id === "string" &&
            typeof decoded.username === "string"
        ) {
            logger.info(`User authenticated: ${decoded.username}`);
            // Attach user information to the request object    
            req.user = { id: decoded.id, username: decoded.username };
            next();
        } else {
            res.status(401).json({ msg: "Invalid or expired token" });
        }
    } catch (error) {
        res.status(401).json({ error, msg: "Invalid or expired token" });
    }
}



