
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, charactersTable, afkSessionsTable } from '../db/schema';
import { type StartAfkInput } from '../schema';
import { startAfkSession } from '../handlers/start_afk_session';
import { eq } from 'drizzle-orm';

describe('startAfkSession', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should start an AFK session for free user', async () => {
    // Create user and character
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        membership_type: 'free'
      })
      .returning()
      .execute();

    const characterResult = await db.insert(charactersTable)
      .values({
        user_id: userResult[0].id,
        name: 'TestCharacter',
        current_realm: 'earth'
      })
      .returning()
      .execute();

    const testInput: StartAfkInput = {
      character_id: characterResult[0].id,
      duration_hours: 4
    };

    const result = await startAfkSession(testInput);

    // Verify session creation
    expect(result.character_id).toEqual(characterResult[0].id);
    expect(result.realm).toEqual('earth');
    expect(result.experience_gained).toEqual(0);
    expect(result.items_found).toEqual('[]');
    expect(result.is_completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.start_time).toBeInstanceOf(Date);
    expect(result.end_time).toBeInstanceOf(Date);

    // Verify duration is correct (4 hours)
    const duration = result.end_time.getTime() - result.start_time.getTime();
    expect(duration).toEqual(4 * 60 * 60 * 1000);
  });

  it('should update character AFK status', async () => {
    // Create user and character
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        membership_type: 'free'
      })
      .returning()
      .execute();

    const characterResult = await db.insert(charactersTable)
      .values({
        user_id: userResult[0].id,
        name: 'TestCharacter',
        current_realm: 'mars'
      })
      .returning()
      .execute();

    const testInput: StartAfkInput = {
      character_id: characterResult[0].id,
      duration_hours: 3
    };

    await startAfkSession(testInput);

    // Check character was updated
    const updatedCharacter = await db.select()
      .from(charactersTable)
      .where(eq(charactersTable.id, characterResult[0].id))
      .execute();

    expect(updatedCharacter[0].is_afk).toEqual(true);
    expect(updatedCharacter[0].afk_start_time).toBeInstanceOf(Date);
    expect(updatedCharacter[0].afk_end_time).toBeInstanceOf(Date);
    expect(updatedCharacter[0].updated_at).toBeInstanceOf(Date);
  });

  it('should enforce 6 hour limit for free users', async () => {
    // Create free user and character
    const userResult = await db.insert(usersTable)
      .values({
        username: 'freeuser',
        email: 'free@example.com',
        password_hash: 'hashedpassword',
        membership_type: 'free'
      })
      .returning()
      .execute();

    const characterResult = await db.insert(charactersTable)
      .values({
        user_id: userResult[0].id,
        name: 'FreeCharacter'
      })
      .returning()
      .execute();

    const testInput: StartAfkInput = {
      character_id: characterResult[0].id,
      duration_hours: 8 // Exceeds 6h limit
    };

    await expect(startAfkSession(testInput))
      .rejects.toThrow(/6h limit for free membership/i);
  });

  it('should allow 12 hour sessions for premium users', async () => {
    // Create premium user and character
    const userResult = await db.insert(usersTable)
      .values({
        username: 'premiumuser',
        email: 'premium@example.com',
        password_hash: 'hashedpassword',
        membership_type: 'premium'
      })
      .returning()
      .execute();

    const characterResult = await db.insert(charactersTable)
      .values({
        user_id: userResult[0].id,
        name: 'PremiumCharacter'
      })
      .returning()
      .execute();

    const testInput: StartAfkInput = {
      character_id: characterResult[0].id,
      duration_hours: 10
    };

    const result = await startAfkSession(testInput);

    expect(result.character_id).toEqual(characterResult[0].id);
    
    // Verify 10 hour duration
    const duration = result.end_time.getTime() - result.start_time.getTime();
    expect(duration).toEqual(10 * 60 * 60 * 1000);
  });

  it('should enforce 12 hour limit for premium users', async () => {
    // Create premium user and character
    const userResult = await db.insert(usersTable)
      .values({
        username: 'premiumuser',
        email: 'premium@example.com',
        password_hash: 'hashedpassword',
        membership_type: 'premium'
      })
      .returning()
      .execute();

    const characterResult = await db.insert(charactersTable)
      .values({
        user_id: userResult[0].id,
        name: 'PremiumCharacter'
      })
      .returning()
      .execute();

    const testInput: StartAfkInput = {
      character_id: characterResult[0].id,
      duration_hours: 15 // Exceeds 12h limit
    };

    await expect(startAfkSession(testInput))
      .rejects.toThrow(/12h limit for premium membership/i);
  });

  it('should throw error for non-existent character', async () => {
    const testInput: StartAfkInput = {
      character_id: 999,
      duration_hours: 4
    };

    await expect(startAfkSession(testInput))
      .rejects.toThrow(/character not found/i);
  });

  it('should throw error if character is already AFK', async () => {
    // Create user and character
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        membership_type: 'free'
      })
      .returning()
      .execute();

    const characterResult = await db.insert(charactersTable)
      .values({
        user_id: userResult[0].id,
        name: 'TestCharacter',
        is_afk: true // Already AFK
      })
      .returning()
      .execute();

    const testInput: StartAfkInput = {
      character_id: characterResult[0].id,
      duration_hours: 4
    };

    await expect(startAfkSession(testInput))
      .rejects.toThrow(/already afk/i);
  });

  it('should save session to database', async () => {
    // Create user and character
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        membership_type: 'free'
      })
      .returning()
      .execute();

    const characterResult = await db.insert(charactersTable)
      .values({
        user_id: userResult[0].id,
        name: 'TestCharacter',
        current_realm: 'moon'
      })
      .returning()
      .execute();

    const testInput: StartAfkInput = {
      character_id: characterResult[0].id,
      duration_hours: 5
    };

    const result = await startAfkSession(testInput);

    // Verify session was saved to database
    const sessions = await db.select()
      .from(afkSessionsTable)
      .where(eq(afkSessionsTable.id, result.id))
      .execute();

    expect(sessions).toHaveLength(1);
    expect(sessions[0].character_id).toEqual(characterResult[0].id);
    expect(sessions[0].realm).toEqual('moon');
    expect(sessions[0].experience_gained).toEqual(0);
    expect(sessions[0].items_found).toEqual('[]');
    expect(sessions[0].is_completed).toEqual(false);
  });
});
