
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, charactersTable, afkSessionsTable } from '../db/schema';
import { completeAfkSession } from '../handlers/complete_afk_session';
import { eq } from 'drizzle-orm';

describe('completeAfkSession', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should complete an active AFK session', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    // Create test character
    const characters = await db.insert(charactersTable)
      .values({
        user_id: users[0].id,
        name: 'TestChar',
        experience: 100,
        is_afk: true
      })
      .returning()
      .execute();

    // Create AFK session that should be completed (end time in past)
    const pastTime = new Date();
    pastTime.setHours(pastTime.getHours() - 1); // 1 hour ago
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - 3); // 3 hours ago

    const sessions = await db.insert(afkSessionsTable)
      .values({
        character_id: characters[0].id,
        start_time: startTime,
        end_time: pastTime,
        realm: 'earth',
        is_completed: false
      })
      .returning()
      .execute();

    const result = await completeAfkSession(sessions[0].id);

    expect(result).not.toBeNull();
    expect(result!.is_completed).toBe(true);
    expect(result!.experience_gained).toBeGreaterThan(0);
    expect(result!.items_found).toBeDefined();
    expect(typeof result!.items_found).toBe('string');
  });

  it('should update character stats when completing session', async () => {
    // Create test data
    const users = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const characters = await db.insert(charactersTable)
      .values({
        user_id: users[0].id,
        name: 'TestChar',
        experience: 100,
        is_afk: true
      })
      .returning()
      .execute();

    const pastTime = new Date();
    pastTime.setHours(pastTime.getHours() - 1);
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - 3);

    const sessions = await db.insert(afkSessionsTable)
      .values({
        character_id: characters[0].id,
        start_time: startTime,
        end_time: pastTime,
        realm: 'moon',
        is_completed: false
      })
      .returning()
      .execute();

    await completeAfkSession(sessions[0].id);

    // Check character was updated
    const updatedCharacters = await db.select()
      .from(charactersTable)
      .where(eq(charactersTable.id, characters[0].id))
      .execute();

    const character = updatedCharacters[0];
    expect(character.is_afk).toBe(false);
    expect(character.afk_start_time).toBeNull();
    expect(character.afk_end_time).toBeNull();
    expect(character.experience).toBeGreaterThan(100); // Should have gained experience
  });

  it('should return null for non-existent session', async () => {
    const result = await completeAfkSession(999);
    expect(result).toBeNull();
  });

  it('should return null for already completed session', async () => {
    // Create test data
    const users = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const characters = await db.insert(charactersTable)
      .values({
        user_id: users[0].id,
        name: 'TestChar'
      })
      .returning()
      .execute();

    const sessions = await db.insert(afkSessionsTable)
      .values({
        character_id: characters[0].id,
        start_time: new Date(),
        end_time: new Date(),
        realm: 'earth',
        is_completed: true // Already completed
      })
      .returning()
      .execute();

    const result = await completeAfkSession(sessions[0].id);
    expect(result).toBeNull();
  });

  it('should return null for session not yet ready to complete', async () => {
    // Create test data
    const users = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const characters = await db.insert(charactersTable)
      .values({
        user_id: users[0].id,
        name: 'TestChar'
      })
      .returning()
      .execute();

    // Create session with future end time
    const futureTime = new Date();
    futureTime.setHours(futureTime.getHours() + 2); // 2 hours in future

    const sessions = await db.insert(afkSessionsTable)
      .values({
        character_id: characters[0].id,
        start_time: new Date(),
        end_time: futureTime,
        realm: 'earth',
        is_completed: false
      })
      .returning()
      .execute();

    const result = await completeAfkSession(sessions[0].id);
    expect(result).toBeNull();
  });
});
