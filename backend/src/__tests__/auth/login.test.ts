import request from "supertest";
import app from "../../app.js"; // Adjust path and extension as needed
import { User } from "../../models/User.js";

describe("POST /api/auth/login", () => {
  const testUser = {
    username: "testuser",
    email: "testuser@example.com",
    password: "P@ssword123"
  };

  beforeAll(async () => {
    const newUser = await User.create(testUser); // password will be hashed automatically
    console.log({newUser});
  });

  it("should login successfully with valid username and password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: testUser.username, password: testUser.password });

    expect(res.statusCode).toBe(200);
    expect(res.headers["set-cookie"]).toBeDefined();
    expect(res.body.msg).toBe("Login successful");
  });

  it("should login successfully with valid email and password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: testUser.email, password: testUser.password });

    expect(res.statusCode).toBe(200);
    expect(res.headers["set-cookie"]).toBeDefined();
    expect(res.body.msg).toBe("Login successful");
  });

  it("should return 401 with incorrect password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: testUser.email, password: "wrongpass" });

    expect(res.statusCode).toBe(401);
    expect(res.body.msg).toBe("Invalid credentials");
  });

  it("should return 401 for non-existent user", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nonexistent@example.com", password: "P@ssword123" });

    expect(res.statusCode).toBe(401);
    expect(res.body.msg).toBe("Invalid credentials");
  });

  it("should return 400 for missing fields", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "useronly" }); // no password

    expect(res.statusCode).toBe(400);
    expect(res.body.msg).toMatch(/required/i);
  });
});
