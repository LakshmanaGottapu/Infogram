import request from "supertest";
import app from "../../app.js"; // Adjust path and extension as needed
import { User } from "../../models/User.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { jest } from '@jest/globals';

describe('POST /api/auth/register', () => {
  const testUser = {
    username: "testuser",
    email: "testuser@example.com",
    password: "P@ssword123"
  };

  beforeEach(async () => {
    // Ensure there is no existing user with the same username or email
    await User.deleteMany({ $or: [{ username: testUser.username }, { email: testUser.email }] });
  });
  afterEach(async () => {
    // Clean up test data
    await User.deleteOne({ username: testUser.username });
  });
  it('should register successfully with valid data', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('username', testUser.username);
    expect(res.body).toHaveProperty('email', testUser.email);
    expect(res.body).not.toHaveProperty('password');
  });

  it('should fail with missing fields', async () => {
    const res1 = await request(app).post('/api/auth/register').send({});
    const res2 = await request(app).post('/api/auth/register').send({ username: 'username', email: '', password: 'password' });
    const res3 = await request(app).post('/api/auth/register').send({ username: 'username', email: 'sailakshman120@gmail.com', password: '' });
    const res4 = await request(app).post('/api/auth/register').send({ username: '', email: 'sailakshman120@gmail.com', password: 'password' });
    expect(res1.statusCode).toBe(400);
    expect(res1.body.msg).toContain("Mandatory fields are missing values");
    expect(res2.statusCode).toBe(400);
    expect(res2.body.msg).toContain("Mandatory fields are missing values");
    expect(res3.statusCode).toBe(400);
    expect(res3.body.msg).toContain("Mandatory fields are missing values");
    expect(res4.statusCode).toBe(400);
    expect(res4.body.msg).toContain("Mandatory fields are missing values");

  });

  it('should fail if email format is invalid', async () => {
    const testCases = ["email", "email.com", "emailgk.co"]
    testCases.forEach(async (email) => {
      const res = await request(app).post('/api/auth/register').send({ username: 'username', email, password: 'P@ssword123' });
      expect(res.statusCode).toBe(400);
      expect(res.body.msg).toContain("Invalid email format");
    })
  })

  it('should reject weak passwords', async () => {
    const testCases = [
      { password: 'Weak@12' }, // length < 8
      { password: 'weakpassword' }, // no uppercase/symbol/number
      { password: 'Weakpassword' }, // no symbol/number
      { password: 'Weakpass1' }, // no symbol
    ];

    for (const { password } of testCases) {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'validUser',
          email: 'test@example.com',
          password
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.msg).toContain("Password must contain: 8+ characters, 1 uppercase, 1 number, 1 symbol");
    }
  });

  it('should reject invalid usernames', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'a', // Too short
        email: 'test@example.com',
        password: 'ValidPass1!'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.msg).toContain('3-20 characters');
  });

  it('should fail if username is duplicate', async () => {
    await request(app).post('/api/auth/register').send({
      username: 'dupe',
      email: 'dupe@example.com',
      password: 'P@ssword123'
    });

    const res = await request(app).post('/api/auth/register').send({
      username: 'dupe',
      email: 'new@example.com',
      password: 'P@ssword123'
    });

    expect(res.statusCode).toBe(409);
    expect(res.body.msg).toContain("user already exists");
  });

  it('should fail if email is duplicate', async () => {
    await request(app).post('/api/auth/register').send({
      username: 'user1',
      email: 'dupe@example.com',
      password: 'P@ssword123'
    });

    const res = await request(app).post('/api/auth/register').send({
      username: 'user2',
      email: 'dupe@example.com',
      password: 'P@ssword123'
    });

    expect(res.statusCode).toBe(409);
    expect(res.body.msg).toContain("user already exists");
  })

  it('should reject invalid emails at Mongoose layer', async () => {
    // Bypassing Express validation (simulating malicious request)
    const maliciousRequest = {
      email: 'not-an-email',
      password: 'ValidPass1!',
      username: 'valid'
    }

    await expect(User.create(maliciousRequest))
      .rejects.toThrow(mongoose.Error.ValidationError);
  })
  it('should reject invalid passwords at Mongoose layer', async () => {
    // Bypassing Express validation (simulating malicious request)
    const maliciousRequest = {
      email: 'validemail@example.com',
      password: 'NotValidPass1',
      username: 'valid'
    }
    await expect(User.create(maliciousRequest))
      .rejects.toThrow(mongoose.Error.ValidationError);
  })
})

describe("POST /api/auth/login", () => {
  const testUser = {
    username: "testuser",
    email: "testuser@example.com",
    password: "P@ssword123"
  };

  beforeAll(async () => {
    // Ensure there is no existing user with the same username or email
    await User.deleteMany({ $or: [{ username: testUser.username }, { email: testUser.email }] });
    // Create a new user for testing
    const newUser = await User.create(testUser); // password will be hashed automatically
    console.log({ newUser });
  });
  afterAll(async () => {
    // Clean up test data
    await User.deleteOne({ username: testUser.username });
  });
  it("should login successfully with valid username and password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: testUser.username, password: testUser.password });

    expect(res.statusCode).toBe(200);
    expect(res.headers["set-cookie"]).toBeDefined();
    const cookies = res.headers['set-cookie'];
    // Verify refresh token cookie properties
    const refreshTokenCookie = Array.isArray(cookies)
      ? cookies.find(c => c.startsWith('refreshToken='))
      : undefined;
    expect(refreshTokenCookie).toBeDefined();
    expect(refreshTokenCookie).toMatch(/HttpOnly/);
    expect(refreshTokenCookie).toMatch(/Secure/);
    expect(refreshTokenCookie).toMatch(/SameSite=Strict/);
    expect(res.body).toHaveProperty("accessToken");
    expect(typeof res.body.accessToken).toBe("string");
    // Verify access token structure
    expect(res.body.accessToken).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
    try {
      const decoded = jwt.verify(res.body.accessToken, process.env.JWT_SECRET);
      expect(decoded).toHaveProperty("id");
      expect(decoded).toHaveProperty("username");

    } catch (error) {
      console.error("Error verifying access token:", error);
      throw error; // Re-throw to fail the test
    }
  });

  it("should login successfully with valid email and password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: testUser.email, password: testUser.password });

    expect(res.statusCode).toBe(200);
    expect(res.headers["set-cookie"]).toBeDefined();
    const cookies = res.headers['set-cookie'];
    // Verify refresh token cookie properties
    const refreshTokenCookie = Array.isArray(cookies)
      ? cookies.find(c => c.startsWith('refreshToken='))
      : undefined;
    expect(refreshTokenCookie).toBeDefined();
    expect(refreshTokenCookie).toMatch(/HttpOnly/);
    expect(refreshTokenCookie).toMatch(/Secure/);
    expect(refreshTokenCookie).toMatch(/SameSite=Strict/);
    expect(res.body).toHaveProperty("accessToken");
    expect(typeof res.body.accessToken).toBe("string");
    // Verify access token structure
    expect(res.body.accessToken).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
    try {
      const decoded = jwt.verify(res.body.accessToken, process.env.JWT_SECRET);
      expect(decoded).toHaveProperty("id");
      expect(decoded).toHaveProperty("username");

    } catch (error) {
      console.error("Error verifying access token:", error);
      throw error; // Re-throw to fail the test
    }
  });

  it("should return 401 with incorrect password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: testUser.email, password: "wrongpass" });

    expect([401, 429]).toContain(res.statusCode);
    if (res.statusCode === 401) {
      expect(res.body.msg).toBe("Invalid credentials");
    }
  });

  it("should return 401 for non-existent user", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nonexistent@example.com", password: "P@ssword123" });
    console.log(res.statusCode);
    expect(res.statusCode).toBe(401);
    expect(res.body.msg).toBe("Invalid credentials");
  });
  it("shou;d return 500 for no body sent", async ()=>{
     const res = await request(app)
      .post("/api/auth/login")
    expect(res.statusCode).toBe(500);
  })
  it("should return 400 for missing fields", async () => {
    // Missing username/email
    const res1 = await request(app)
      .post("/api/auth/login")
      .send({ password: "somepassword" });

    expect([400, 429]).toContain(res1.statusCode);
    if (res1.statusCode === 400) {
      expect(res1.body.msg).toMatch(/required/i);
    }

    // Missing both
    const res2 = await request(app)
      .post("/api/auth/login")
      .send({});

    expect([400, 429]).toContain(res2.statusCode);
    if (res2.statusCode === 400) {
      expect(res2.body.msg).toMatch(/required/i);
    }
  });

  it("should return 500 if an internal error occurs", async () => {
    // Properly mock User.findOne to throw
    const findOneSpy = jest.spyOn(User, "findOne").mockImplementation(() => {
      throw new Error("DB error");
    });

    const res = await request(app).post("/api/auth/login")
      .send({ username: "testuser", password: "P@ssword123" });

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("error");

    findOneSpy.mockRestore();
  });
});
