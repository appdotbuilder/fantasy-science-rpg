
import { db } from '../db';
import { afkSessionsTable, charactersTable, usersTable } from '../db/schema';
import { type StartAfkInput, type AfkSession } from '../schema';
import { eq } from 'drizzle-orm';

export async function startAfkSession(input: StartAfkInput): Promise<AfkSession> {
  try {
    // Get character with user info to check membership type
    const characterResult = await db.select()
      .from(charactersTable)
      .innerJoin(usersTable, eq(charactersTable.user_id, usersTable.id))
      .where(eq(charactersTable.id, input.character_id))
      .execute();

    if (characterResult.length === 0) {
      throw new Error('Character not found');
    }

    const character = characterResult[0].characters;
    const user = characterResult[0].users;

    // Check if character is already AFK
    if (character.is_afk) {
      throw new Error('Character is already AFK');
    }

    // Validate duration based on membership type
    const maxDuration = user.membership_type === 'premium' ? 12 : 6;
    if (input.duration_hours > maxDuration) {
      throw new Error(`Duration exceeds ${maxDuration}h limit for ${user.membership_type} membership`);
    }

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + (input.duration_hours * 60 * 60 * 1000));

    // Create AFK session
    const sessionResult = await db.insert(afkSessionsTable)
      .values({
        character_id: input.character_id,
        start_time: startTime,
        end_time: endTime,
        realm: character.current_realm,
        experience_gained: 0,
        items_found: '[]',
        is_completed: false
      })
      .returning()
      .execute();

    // Update character AFK status
    await db.update(charactersTable)
      .set({
        is_afk: true,
        afk_start_time: startTime,
        afk_end_time: endTime,
        updated_at: new Date()
      })
      .where(eq(charactersTable.id, input.character_id))
      .execute();

    return sessionResult[0];
  } catch (error) {
    console.error('AFK session creation failed:', error);
    throw error;
  }
}
