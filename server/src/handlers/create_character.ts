
import { db } from '../db';
import { charactersTable, usersTable } from '../db/schema';
import { type CreateCharacterInput, type Character } from '../schema';
import { eq } from 'drizzle-orm';

export async function createCharacter(input: CreateCharacterInput): Promise<Character> {
  try {
    // Verify the user exists first to prevent foreign key constraint errors
    const existingUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (existingUser.length === 0) {
      throw new Error(`User with id ${input.user_id} does not exist`);
    }

    // Insert character with default starting stats
    const result = await db.insert(charactersTable)
      .values({
        user_id: input.user_id,
        name: input.name,
        // Default values are handled by the database schema:
        // level: 1, experience: 0, health: 100, max_health: 100,
        // attack: 10, defense: 5, current_realm: 'earth', is_afk: false
      })
      .returning()
      .execute();

    const character = result[0];
    return character;
  } catch (error) {
    console.error('Character creation failed:', error);
    throw error;
  }
}
