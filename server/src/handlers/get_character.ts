
import { db } from '../db';
import { charactersTable } from '../db/schema';
import { type Character } from '../schema';
import { eq } from 'drizzle-orm';

export async function getCharacter(characterId: number): Promise<Character | null> {
  try {
    const results = await db.select()
      .from(charactersTable)
      .where(eq(charactersTable.id, characterId))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const character = results[0];
    return {
      ...character,
      // All other fields are already in the correct format
      // No numeric conversions needed for this table
    };
  } catch (error) {
    console.error('Character fetch failed:', error);
    throw error;
  }
}
