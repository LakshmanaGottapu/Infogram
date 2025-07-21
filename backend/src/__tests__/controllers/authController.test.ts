import { jest } from "@jest/globals";

jest.unstable_mockModule("../../models/User.js", () => ({
  default: {
    findOne: jest.fn(),
    create: jest.fn(),
  }
}));
jest.unstable_mockModule("../../config/logger.js", () => ({
  default: {
    warn: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}))

jest.unstable_mockModule("jsonwebtoken", () => ({
  default: {
    sign: jest.fn(() => "mockedToken"),
    verify: jest.fn(),
  },
}));

const jwt = (await import("jsonwebtoken")).default;
const { registerUser } = await import("../../controllers/authController.js");
const User = (await import("../../models/User.js")).default;
const logger = (await import("../../config/logger.js")).default;
const { loginUser } = await import("../../controllers/authController.js");
const { refreshToken } = await import("../../controllers/authController.js");

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
    (User.findOne as jest.Mock).mockResolvedValue({ _id: "123" } as never);

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
    (User.findOne as jest.Mock).mockResolvedValue(null as never);
    const createdUser = {
      id: "456",
      username: "testuser",
      email: "test@example.com",
      createdAt: "2024-06-01T00:00:00.000Z"
    };
    (User.create as jest.Mock).mockResolvedValue(createdUser as never);

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
    (User.findOne as jest.Mock).mockRejectedValue(new Error("DB error") as never);

    await registerUser(req, res);

    expect(logger.error).toHaveBeenCalledWith(
      "Login attempt failed: DB error"
    );
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: expect.any(Error) });
  });
});

describe("loginUser", () => {
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
      json: jest.fn(),
      cookie: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  it("should return 400 if password or username/email is missing", async () => {
    req.body = { username: "", email: "", password: "" };
    await loginUser(req, res);
    expect(logger.warn).toHaveBeenCalledWith(
      "Login attempt failed: Username/email and password are required."
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      msg: "Username/email and password are required."
    });
  });

  it("should return 401 if user not found", async () => {
    const findOneMock = jest.spyOn(User, "findOne");
    findOneMock.mockReturnValue({
      select: jest.fn().mockResolvedValue(null as never)
    } as never);
    await loginUser(req, res);
    expect(User.findOne).toHaveBeenCalledWith({
      $or: [
        { username: "testuser" },
        { email: "test@example.com" }
      ]
    });
    expect(logger.info).toHaveBeenCalledWith(
      "Login attempt for user: testuser with email: test@example.com"
    );
    expect(logger.warn).toHaveBeenCalledWith(
      "Login attempt failed: No user found with username testuser or email test@example.com."
    );
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ msg: "Invalid credentials" });
  });

  it("should return 401 if password does not match", async () => {
    const userMock = {
      comparePassword: jest.fn().mockResolvedValue(false as never),
      username: "testuser",
      email: "test@example.com"
    };
    const selectMock = jest.fn().mockResolvedValue(userMock as never);
    const findOneMock = jest.spyOn(User, "findOne");
    findOneMock.mockReturnValue({
      select: selectMock
    } as any);

    await loginUser(req, res);
    expect(logger.warn).toHaveBeenCalledWith("Login attempt failed: Password mismatch for user testuser or email test@example.com.");
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ msg: "Invalid credentials" });
  });

  it("should login user and set tokens if credentials are valid", async () => {
    const userMock = {
      _id: "789",
      username: "testuser",
      email: "test@example.com",
      comparePassword: jest.fn().mockResolvedValue(true as never)
    };
    const selectMock = jest.fn().mockResolvedValue(userMock as never);
    const findoneMock = jest.spyOn(User, "findOne");
    findoneMock.mockReturnValue({
      select: selectMock
    } as never);

    process.env.REFRESH_SECRET = "refresh_secret";
    process.env.JWT_SECRET = "jwt_secret";
    await loginUser(req, res);
    expect(logger.info).toHaveBeenCalledWith(
      "User logged in successfully: testuser with email test@example.com"
    );
    expect(jwt.sign).toHaveBeenCalledWith(
      { id: "789", username: "testuser" },
      "refresh_secret",
      { expiresIn: "7d" }
    );
    expect(jwt.sign).toHaveBeenCalledWith(
      { id: "789", username: "testuser" },
      "jwt_secret",
      { expiresIn: "15m" }
    );
    expect(res.cookie).toHaveBeenCalledWith(
      "refreshToken",
      "mockedToken",
      { httpOnly: true, secure: true, sameSite: "strict" }
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ accessToken: "mockedToken" });
  });

  it("should handle errors and return 500", async () => {
    const findOneMock = jest.spyOn(User, "findOne");
    findOneMock.mockReturnValue({
      select: jest.fn().mockRejectedValue(new Error("DB error") as never)
    } as never);
    await loginUser(req, res);
    expect(logger.error).toHaveBeenCalledWith("Login attempt failed: DB error");
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: expect.any(Error) });
  });
});

describe("refreshToken", () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    req = {
      cookies: {
        refreshToken: "valid_refresh_token"
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      clearCookie: jest.fn().mockReturnThis(),
      sendStatus: jest.fn()
    };
    jest.clearAllMocks();
    process.env.JWT_SECRET = "jwt_secret";
    process.env.REFRESH_SECRET = "refresh_secret";
  });

  it("should return 500 if JWT secrets are missing", async () => {
    delete process.env.JWT_SECRET;
    await refreshToken(req, res);
    expect(logger.error).toHaveBeenCalledWith("JWT secret is not configured");
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ msg: "Server error" });
  });

  it("should return 401 if refresh token is missing", async () => {
    req.cookies = {};
    await refreshToken(req, res);
    expect(logger.warn).toHaveBeenCalledWith("Refresh token not found, forcing login.");
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ msg: "Unauthorized access" });
  });

  it("should refresh token if user is object with id and username", async () => {
    (jwt.verify as jest.Mock).mockReturnValue({ id: "123", username: "testuser" });
    await refreshToken(req, res);
    expect(logger.info).toHaveBeenCalledWith("Refreshing token for user: testuser");
    expect(jwt.sign).toHaveBeenCalledWith(
      { id: "123", username: "testuser" },
      "jwt_secret",
      { expiresIn: "15m" }
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ accessToken: "mockedToken" });
  });

  it("should refresh token if user is string and can be parsed", async () => {
    (jwt.verify as jest.Mock).mockReturnValue(JSON.stringify({ id: "456", username: "stringuser" }));
    await refreshToken(req, res);
    expect(logger.info).toHaveBeenCalledWith("Refreshing token for user: stringuser");
    expect(jwt.sign).toHaveBeenCalledWith(
      { id: "456", username: "stringuser" },
      "jwt_secret",
      { expiresIn: "15m" }
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ accessToken: "mockedToken" });
  });

  it("should clear cookie and return 401 if parsed user is invalid", async () => {
    (jwt.verify as jest.Mock).mockReturnValue(JSON.stringify({}));
    await refreshToken(req, res);
    expect(logger.warn).toHaveBeenCalledWith("Parsed user from refresh token is invalid, forcing login.");
    expect(res.clearCookie).toHaveBeenCalledWith("refreshToken");
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ msg: "Unauthorized access" });
  });

  it("should clear cookie and return 401 if parsing user throws error", async () => {
    (jwt.verify as jest.Mock).mockReturnValue("not_json");
    await refreshToken(req, res);
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining("Failed to parse user from refresh token:"));
    expect(res.clearCookie).toHaveBeenCalledWith("refreshToken");
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ msg: "Unauthorized access" });
  });

  it("should clear cookie and return 401 if user data is invalid", async () => {
    (jwt.verify as jest.Mock).mockReturnValue(12345);
    await refreshToken(req, res);
    expect(logger.warn).toHaveBeenCalledWith("Invalid user data in refresh token, forcing login.");
    expect(res.clearCookie).toHaveBeenCalledWith("refreshToken");
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ msg: "Unauthorized access" });
  });

  it("should handle expired token error", async () => {
    (jwt.verify as jest.Mock).mockImplementation(() => {
      const err: any = new Error("Token expired");
      err.name = "TokenExpiredError";
      throw err;
    });
    await refreshToken(req, res);
    expect(logger.warn).toHaveBeenCalledWith("Refresh token expired, forcing login.");
    expect(logger.error).toHaveBeenCalledWith("Failed to refresh token: Token expired");
    expect(res.clearCookie).toHaveBeenCalledWith("refreshToken");
    expect(res.sendStatus).toHaveBeenCalledWith(401);
  });

  it("should handle other errors", async () => {
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error("Some error");
    });
    await refreshToken(req, res);
    expect(logger.error).toHaveBeenCalledWith("Failed to refresh token: Some error");
    expect(res.clearCookie).toHaveBeenCalledWith("refreshToken");
    expect(res.sendStatus).toHaveBeenCalledWith(401);
  });
});