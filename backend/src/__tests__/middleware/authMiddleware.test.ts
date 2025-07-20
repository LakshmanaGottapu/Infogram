// Mock the userUtils functions 
import { jest } from "@jest/globals";

// 👇 Mock first using unstable_mockModule
jest.unstable_mockModule("../../utils/userUtils.js", () => ({
    isValidUsername: jest.fn(),
    isValidEmail: jest.fn(),
    isValidPassword: jest.fn(),
}));

// 👇 Now import everything AFTER the mock is registered
const { validateUserPayload } = await import("../../middleware/authMiddleware.js");
const {
    isValidUsername,
    isValidEmail,
    isValidPassword,
} = await import("../../utils/userUtils.js");

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
            status: statusMock,
            json: jsonMock,
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
