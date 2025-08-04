
import { db } from '../db';
import { charactersTable } from '../db/schema';
import { type Character } from '../schema';
import { eq } from 'drizzle-orm';

export async function getUserCharacters(userId: number): Promise<Character[]> {
  try {
    const results = await db.select()
      .from(charactersTable)
      .where(eq(charactersTable.user_id, userId))
      .execute();

    return results.map(character => ({
      ...character,
      // All fields are already in correct types from database schema
      // No numeric conversions needed as all character fields are integers/booleans/dates/text
    }));
  } catch (error) {
    console.error('Get user characters failed:', error);
    throw error;
  }
}
