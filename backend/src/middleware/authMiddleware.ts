import { NextFunction, Request, Response } from "express";
import { isValidEmail, isValidPassword, isValidUsername } from "../utils/userUtils.js";
import { verifyToken } from "../utils/tokenUtils.js"; // Assuming you have a utility to verify JWT tokens
import logger from "../config/logger.js";


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

export function authenticate(req: Request, res: Response, next: NextFunction):void {
    if (!req.headers?.authorization) {
        logger.warn("Unauthorized access attempt without authorization header");
        res.status(401).json({ msg: "Unauthorized access" });
        return;
    }
    const token = req.headers.authorization.split(" ")[1];
    // Check if token is present
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
        } 
        else if( typeof decoded === "string" && decoded!=="") {
            const user = JSON.parse(decoded);
            logger.info(`User authenticated: ${user.username}`);
            // Attach user information to the request object
            req.user = user;
            next();
        }
        else {
            res.status(401).json({ msg: "Invalid token" });
        }
    } catch (error) {
        if(error.name === "TokenExpiredError") {
            // Handle token expiration specifically
            logger.warn(`Token expired: ${error.message}`);
            // give me logic to refresh the token.
            
        }
        else{
            logger.error(`Token verification failed: ${error.message}`);
            res.status(401).json({ error, msg: "Invalid or expired token" });
        }
    }
}



