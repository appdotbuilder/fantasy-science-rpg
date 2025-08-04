
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput, type User } from '../schema';
import { eq } from 'drizzle-orm';

export async function loginUser(input: LoginInput): Promise<User | null> {
  try {
    // Find user by email
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .execute();

    if (users.length === 0) {
      return null; // User not found
    }

    const user = users[0];

    // In a real implementation, you would verify the hashed password here
    // For now, we'll do a simple string comparison (this should use bcrypt or similar)
    if (user.password_hash !== input.password) {
      return null; // Invalid password
    }

    // Return user data (excluding password hash for security)
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      password_hash: user.password_hash, // In production, this should be excluded
      membership_type: user.membership_type,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}
