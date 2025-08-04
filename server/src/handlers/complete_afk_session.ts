
import { db } from '../db';
import { afkSessionsTable, charactersTable } from '../db/schema';
import { type AfkSession } from '../schema';
import { eq, and, sql } from 'drizzle-orm';

export async function completeAfkSession(sessionId: number): Promise<AfkSession | null> {
  try {
    // Get the AFK session
    const sessions = await db.select()
      .from(afkSessionsTable)
      .where(and(
        eq(afkSessionsTable.id, sessionId),
        eq(afkSessionsTable.is_completed, false)
      ))
      .execute();

    if (sessions.length === 0) {
      return null;
    }

    const session = sessions[0];
    const currentTime = new Date();

    // Check if session should be completed (current time >= end_time)
    if (currentTime < session.end_time) {
      return null;
    }

    // Calculate rewards based on session duration and realm
    const durationHours = Math.floor((session.end_time.getTime() - session.start_time.getTime()) / (1000 * 60 * 60));
    
    // Base experience per hour varies by realm
    const baseExpPerHour = session.realm === 'earth' ? 50 : session.realm === 'moon' ? 75 : 100; // mars = 100
    const experienceGained = durationHours * baseExpPerHour;

    // Simple items found simulation (JSON string of item IDs found)
    const itemsFound = [];
    for (let i = 0; i < durationHours; i++) {
      if (Math.random() < 0.3) { // 30% chance per hour to find an item
        itemsFound.push({ item_id: 1, quantity: 1 }); // Simple placeholder item
      }
    }

    // Update the AFK session with rewards and mark as completed
    const updatedSessions = await db.update(afkSessionsTable)
      .set({
        experience_gained: experienceGained,
        items_found: JSON.stringify(itemsFound),
        is_completed: true
      })
      .where(eq(afkSessionsTable.id, sessionId))
      .returning()
      .execute();

    // Get current character experience for the update
    const currentCharacters = await db.select()
      .from(charactersTable)
      .where(eq(charactersTable.id, session.character_id))
      .execute();

    if (currentCharacters.length > 0) {
      const currentExp = currentCharacters[0].experience;
      
      // Update character's experience and AFK status
      await db.update(charactersTable)
        .set({
          experience: currentExp + experienceGained,
          is_afk: false,
          afk_start_time: null,
          afk_end_time: null,
          updated_at: currentTime
        })
        .where(eq(charactersTable.id, session.character_id))
        .execute();
    }

    return updatedSessions[0];
  } catch (error) {
    console.error('AFK session completion failed:', error);
    throw error;
  }
}
