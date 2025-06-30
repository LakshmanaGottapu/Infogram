import jwt from "jsonwebtoken";
import logger from "../config/logger.js";

export function generateToken(payload: object, config: object): string {
    // – returns a signed JWT
    return jwt.sign(payload, process.env.JWT_SECRET, config);
}

export function verifyToken(token: string) {
    if (!process.env.JWT_SECRET) {
        logger.error("JWT secret is not configured");
        throw new Error("JWT secret not configured");
    }
    return jwt.verify(token, process.env.JWT_SECRET);
}

