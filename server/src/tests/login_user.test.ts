
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput } from '../schema';
import { loginUser } from '../handlers/login_user';

describe('loginUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should login user with valid credentials', async () => {
    // Create test user first
    await db.insert(usersTable).values({
      username: 'testuser',
      email: 'test@example.com',
      password_hash: 'testpassword123', // In production, this would be hashed
      membership_type: 'free'
    }).execute();

    const loginInput: LoginInput = {
      email: 'test@example.com',
      password: 'testpassword123'
    };

    const result = await loginUser(loginInput);

    expect(result).not.toBeNull();
    expect(result!.email).toEqual('test@example.com');
    expect(result!.username).toEqual('testuser');
    expect(result!.membership_type).toEqual('free');
    expect(result!.id).toBeDefined();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent user', async () => {
    const loginInput: LoginInput = {
      email: 'nonexistent@example.com',
      password: 'anypassword'
    };

    const result = await loginUser(loginInput);

    expect(result).toBeNull();
  });

  it('should return null for invalid password', async () => {
    // Create test user first
    await db.insert(usersTable).values({
      username: 'testuser',
      email: 'test@example.com',
      password_hash: 'correctpassword',
      membership_type: 'premium'
    }).execute();

    const loginInput: LoginInput = {
      email: 'test@example.com',
      password: 'wrongpassword'
    };

    const result = await loginUser(loginInput);

    expect(result).toBeNull();
  });

  it('should handle case-sensitive email matching', async () => {
    // Create test user with lowercase email
    await db.insert(usersTable).values({
      username: 'testuser',
      email: 'test@example.com',
      password_hash: 'testpassword123',
      membership_type: 'free'
    }).execute();

    const loginInput: LoginInput = {
      email: 'Test@Example.com', // Different case
      password: 'testpassword123'
    };

    const result = await loginUser(loginInput);

    // Should return null because email doesn't match exactly
    expect(result).toBeNull();
  });

  it('should login premium user correctly', async () => {
    // Create premium user
    await db.insert(usersTable).values({
      username: 'premiumuser',
      email: 'premium@example.com',
      password_hash: 'premiumpass',
      membership_type: 'premium'
    }).execute();

    const loginInput: LoginInput = {
      email: 'premium@example.com',
      password: 'premiumpass'
    };

    const result = await loginUser(loginInput);

    expect(result).not.toBeNull();
    expect(result!.membership_type).toEqual('premium');
    expect(result!.username).toEqual('premiumuser');
  });
});
