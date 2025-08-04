
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { charactersTable, usersTable } from '../db/schema';
import { type CreateCharacterInput } from '../schema';
import { createCharacter } from '../handlers/create_character';
import { eq } from 'drizzle-orm';

describe('createCharacter', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const createTestUser = async () => {
    const result = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should create a character with default stats', async () => {
    const user = await createTestUser();
    const input: CreateCharacterInput = {
      user_id: user.id,
      name: 'TestHero'
    };

    const result = await createCharacter(input);

    // Verify character properties
    expect(result.id).toBeDefined();
    expect(result.user_id).toEqual(user.id);
    expect(result.name).toEqual('TestHero');
    expect(result.level).toEqual(1);
    expect(result.experience).toEqual(0);
    expect(result.health).toEqual(100);
    expect(result.max_health).toEqual(100);
    expect(result.attack).toEqual(10);
    expect(result.defense).toEqual(5);
    expect(result.current_realm).toEqual('earth');
    expect(result.is_afk).toEqual(false);
    expect(result.afk_start_time).toBeNull();
    expect(result.afk_end_time).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save character to database', async () => {
    const user = await createTestUser();
    const input: CreateCharacterInput = {
      user_id: user.id,
      name: 'DatabaseHero'
    };

    const result = await createCharacter(input);

    // Verify character was saved to database
    const characters = await db.select()
      .from(charactersTable)
      .where(eq(charactersTable.id, result.id))
      .execute();

    expect(characters).toHaveLength(1);
    expect(characters[0].name).toEqual('DatabaseHero');
    expect(characters[0].user_id).toEqual(user.id);
    expect(characters[0].level).toEqual(1);
    expect(characters[0].experience).toEqual(0);
    expect(characters[0].health).toEqual(100);
    expect(characters[0].current_realm).toEqual('earth');
  });

  it('should throw error when user does not exist', async () => {
    const input: CreateCharacterInput = {
      user_id: 999999, // Non-existent user ID
      name: 'OrphanHero'
    };

    await expect(createCharacter(input)).rejects.toThrow(/User with id 999999 does not exist/i);
  });

  it('should create multiple characters for same user', async () => {
    const user = await createTestUser();
    
    const char1Input: CreateCharacterInput = {
      user_id: user.id,
      name: 'FirstHero'
    };
    
    const char2Input: CreateCharacterInput = {
      user_id: user.id,
      name: 'SecondHero'
    };

    const char1 = await createCharacter(char1Input);
    const char2 = await createCharacter(char2Input);

    expect(char1.id).not.toEqual(char2.id);
    expect(char1.name).toEqual('FirstHero');
    expect(char2.name).toEqual('SecondHero');
    expect(char1.user_id).toEqual(user.id);
    expect(char2.user_id).toEqual(user.id);

    // Verify both characters exist in database
    const characters = await db.select()
      .from(charactersTable)
      .where(eq(charactersTable.user_id, user.id))
      .execute();

    expect(characters).toHaveLength(2);
  });
});
