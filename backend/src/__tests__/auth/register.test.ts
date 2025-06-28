import request from 'supertest';
import app from '../../app.js'; // your express app
import { User } from '../../models/User.js';
import mongoose from 'mongoose';

describe('POST /api/auth/register', () => {
  it('should register successfully with valid data', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'P@ssword123'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('username', 'testuser');
    expect(res.body).toHaveProperty('email', 'test@example.com');
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
      email: 'email@gmail.co',
      password: 'NotValidPass1',
      username: 'valid'
    }
    await expect(User.create(maliciousRequest))
      .rejects.toThrow(mongoose.Error.ValidationError);
  })

})
