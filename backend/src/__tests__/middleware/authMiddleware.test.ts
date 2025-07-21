// Mock the userUtils functions 
import { jest } from "@jest/globals";

// 👇 Mock first using unstable_mockModule
jest.unstable_mockModule("../../utils/userUtils.js", () => ({
    isValidUsername: jest.fn(),
    isValidEmail: jest.fn(),
    isValidPassword: jest.fn(),
}));
// 👇 Mock verifyToken and logger
jest.unstable_mockModule("../../utils/tokenUtils.js", () => ({
    verifyToken: jest.fn(),
}));
jest.unstable_mockModule("../../config/logger.js", () => ({
    default: {
        warn: jest.fn(),
        info: jest.fn(),
        error: jest.fn(),
    },
}));
// 👇 Now import everything AFTER the mock is registered
const { validateUserPayload } = await import("../../middleware/authMiddleware.js");
const { isValidUsername, isValidEmail, isValidPassword } = await import("../../utils/userUtils.js");
const { authenticate } = await import("../../middleware/authMiddleware.js");
const { verifyToken } = await import("../../utils/tokenUtils.js");
const logger = (await import("../../config/logger.js")).default;

import { Request, Response, NextFunction } from "express";

describe("validateUserPayload middleware", () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;
    let statusMock: jest.Mock;
    let jsonMock: jest.Mock;

    beforeEach(() => {
        statusMock = jest.fn().mockReturnThis();
        jsonMock = jest.fn();

        req = { body: {} };
         res = {
            status: statusMock as unknown as (code: number) => Response,
            json: jsonMock as unknown as (body: any) => Response,
        };
        next = jest.fn();

        jest.clearAllMocks();
    });

    it("should return 400 if any mandatory field is missing", () => {
        req.body = { username: "user", email: "test@test.com" }; // missing password
        validateUserPayload(req as Request, res as Response, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ msg: "Mandatory fields are missing values" });
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 400 if username is invalid", () => {
        req.body = { username: "u", email: "test@test.com", password: "Password1!" };
        (isValidUsername as jest.Mock).mockReturnValue(false);
        validateUserPayload(req as Request, res as Response, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            msg: "Username must be 3-20 characters (letters, numbers, underscores)",
        });
        expect(next).not.toHaveBeenCalled();
    });
    it("should return 400 if email is invalid", () => {
        req.body = { username: "validuser", email: "invalidemail", password: "Password1!" };
        (isValidUsername as jest.Mock).mockReturnValue(true);
        (isValidEmail as jest.Mock).mockReturnValue(false);
        validateUserPayload(req as Request, res as Response, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ msg: "Invalid email format" });
        expect(next).not.toHaveBeenCalled();
    });
    it("should return 400 if password is invalid", () => {
        req.body = { username: "validuser", email: "test@test.com", password: "pass" };
        (isValidUsername as jest.Mock).mockReturnValue(true);
        (isValidEmail as jest.Mock).mockReturnValue(true);
        (isValidPassword as jest.Mock).mockReturnValue(false);
        validateUserPayload(req as Request, res as Response, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            msg: "Password must contain: 8+ characters, 1 uppercase, 1 number, 1 symbol",
        });
        expect(next).not.toHaveBeenCalled();
    });
    it("should call next if all fields are valid", () => {
        req.body = { username: "validuser", email: "test@test.com", password: "Password1!" };
        (isValidUsername as jest.Mock).mockReturnValue(true);
        (isValidEmail as jest.Mock).mockReturnValue(true);
        (isValidPassword as jest.Mock).mockReturnValue(true);
        validateUserPayload(req as Request, res as Response, next);
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
    });
});

describe("authenticate middleware", () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;
    let statusMock: jest.Mock;
    let jsonMock: jest.Mock;

    beforeEach(() => {
        statusMock = jest.fn().mockReturnThis();
        jsonMock = jest.fn();
        req = { cookies: {} };
         res = {
            status: statusMock as unknown as (code: number) => Response,
            json: jsonMock as unknown as (body: any) => Response,
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    it("should return 401 if no token is present", () => {
        authenticate(req as Request, res as Response, next);
        expect(logger.warn).toHaveBeenCalledWith("Unauthorized access attempt without token");
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ msg: "Unauthorized access" });
        expect(next).not.toHaveBeenCalled();
    });

    it("should authenticate and attach user if decoded is object", () => {
        req.cookies = { SessionCookie: "validtoken" };
        (verifyToken as jest.Mock).mockReturnValue({ id: "123", username: "testuser" });
        authenticate(req as Request, res as Response, next);
        expect(logger.info).toHaveBeenCalledWith("User authenticated: testuser");
        expect(req.user).toEqual({ id: "123", username: "testuser" });
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    it("should authenticate and attach user if decoded is JSON string", () => {
        req.cookies = { SessionCookie: "validtoken" };
        const userObj = { id: "456", username: "jsonuser" };
        (verifyToken as jest.Mock).mockReturnValue(JSON.stringify(userObj));
        authenticate(req as Request, res as Response, next);
        expect(logger.info).toHaveBeenCalledWith("User authenticated: jsonuser");
        expect(req.user).toEqual(userObj);
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    it("should return 401 if decoded is invalid", () => {
        req.cookies = { SessionCookie: "invalidtoken" };
        (verifyToken as jest.Mock).mockReturnValue(null);
        authenticate(req as Request, res as Response, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ msg: "Invalid token" });
        expect(next).not.toHaveBeenCalled();
    });

    it("should handle TokenExpiredError", () => {
        req.cookies = { SessionCookie: "expiredtoken" };
        const error = { name: "TokenExpiredError", message: "Token expired" };
        (verifyToken as jest.Mock).mockImplementation(() => { throw error; });
        authenticate(req as Request, res as Response, next);
        expect(logger.warn).toHaveBeenCalledWith(`Token expired: ${error.message}`);
        expect(res.status).not.toHaveBeenCalled(); // No response sent for refresh logic
        expect(next).not.toHaveBeenCalled();
    });

    it("should handle other token verification errors", () => {
        req.cookies = { SessionCookie: "badtoken" };
        const error = { name: "OtherError", message: "Some error" };
        (verifyToken as jest.Mock).mockImplementation(() => { throw error; });
        authenticate(req as Request, res as Response, next);
        expect(logger.error).toHaveBeenCalledWith(`Token verification failed: ${error.message}`);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error, msg: "Invalid or expired token" });
        expect(next).not.toHaveBeenCalled();
    });
});

