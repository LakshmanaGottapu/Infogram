import { jest } from "@jest/globals";

jest.unstable_mockModule("../../models/User.js", () => ({
    default: {
      findOne: jest.fn(),
      create: jest.fn(),
      comparePassword: jest.fn()
    }
}));
jest.unstable_mockModule("../../config/logger.js", () => ({
  default: {
    warn: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}))
const { registerUser } = await import("../../controllers/authController.js");
const User = (await import("../../models/User.js")).default;
const logger = (await import("../../config/logger.js")).default;
describe("registerUser", () => {
  let req: any;
  let res: any;
 
  beforeEach(() => {
    req = {
      body: {
        username: "testuser",
        email: "test@example.com",
        password: "password123"
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  it("should return 409 if user already exists", async () => {
    (User.findOne as jest.Mock).mockResolvedValue({ _id: "123" });

    await registerUser(req, res);

    expect(User.findOne).toHaveBeenCalledWith({
      $or: [
        { username: "testuser" },
        { email: "test@example.com" }
      ]
    });
    expect(logger.info).toHaveBeenCalledWith(
      "User registration failed: User with username testuser or email test@example.com already exists."
    );
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ msg: "user already exists" });
  });

  it("should create user and return 201 if user does not exist", async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);
    const createdUser = {
      id: "456",
      username: "testuser",
      email: "test@example.com",
      createdAt: "2024-06-01T00:00:00.000Z"
    };
    (User.create as jest.Mock).mockResolvedValue(createdUser);

    await registerUser(req, res);

    expect(User.create).toHaveBeenCalledWith({
      username: "testuser",
      email: "test@example.com",
      password: "password123"
    });
    expect(logger.info).toHaveBeenCalledWith(
      "User registered successfully: testuser with email test@example.com"
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      id: "456",
      username: "testuser",
      email: "test@example.com",
      createdAt: "2024-06-01T00:00:00.000Z"
    });
  });

  it("should handle errors and return 500", async () => {
    (User.findOne as jest.Mock).mockRejectedValue(new Error("DB error"));

    await registerUser(req, res);

    expect(logger.error).toHaveBeenCalledWith(
      "Login attempt failed: DB error"
    );
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: expect.any(Error) });
  });
});