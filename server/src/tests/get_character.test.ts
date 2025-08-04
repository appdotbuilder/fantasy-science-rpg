
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, charactersTable } from '../db/schema';
import { type CreateUserInput, type CreateCharacterInput } from '../schema';
import { getCharacter } from '../handlers/get_character';

describe('getCharacter', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return character when found', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        membership_type: 'free'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test character
    const characterResult = await db.insert(charactersTable)
      .values({
        user_id: userId,
        name: 'Test Hero',
        level: 5,
        experience: 1200,
        health: 80,
        max_health: 120,
        attack: 15,
        defense: 8,
        current_realm: 'earth',
        is_afk: false
      })
      .returning()
      .execute();

    const characterId = characterResult[0].id;

    // Test the handler
    const result = await getCharacter(characterId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(characterId);
    expect(result!.user_id).toEqual(userId);
    expect(result!.name).toEqual('Test Hero');
    expect(result!.level).toEqual(5);
    expect(result!.experience).toEqual(1200);
    expect(result!.health).toEqual(80);
    expect(result!.max_health).toEqual(120);
    expect(result!.attack).toEqual(15);
    expect(result!.defense).toEqual(8);
    expect(result!.current_realm).toEqual('earth');
    expect(result!.is_afk).toEqual(false);
    expect(result!.afk_start_time).toBeNull();
    expect(result!.afk_end_time).toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when character not found', async () => {
    const result = await getCharacter(999);
    expect(result).toBeNull();
  });

  it('should return character with default values', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'defaultuser',
        email: 'default@example.com',
        password_hash: 'hashedpassword',
        membership_type: 'free'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create character with minimal data (will use defaults)
    const characterResult = await db.insert(charactersTable)
      .values({
        user_id: userId,
        name: 'Default Hero'
      })
      .returning()
      .execute();

    const characterId = characterResult[0].id;

    // Test the handler
    const result = await getCharacter(characterId);

    expect(result).not.toBeNull();
    expect(result!.name).toEqual('Default Hero');
    expect(result!.level).toEqual(1); // Default value
    expect(result!.experience).toEqual(0); // Default value
    expect(result!.health).toEqual(100); // Default value
    expect(result!.max_health).toEqual(100); // Default value
    expect(result!.attack).toEqual(10); // Default value
    expect(result!.defense).toEqual(5); // Default value
    expect(result!.current_realm).toEqual('earth'); // Default value
    expect(result!.is_afk).toEqual(false); // Default value
  });

  it('should return character with afk times when set', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'afkuser',
        email: 'afk@example.com',
        password_hash: 'hashedpassword',
        membership_type: 'premium'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    const afkStartTime = new Date();
    const afkEndTime = new Date(afkStartTime.getTime() + 3600000); // 1 hour later

    // Create character with AFK data
    const characterResult = await db.insert(charactersTable)
      .values({
        user_id: userId,
        name: 'AFK Hero',
        current_realm: 'moon',
        is_afk: true,
        afk_start_time: afkStartTime,
        afk_end_time: afkEndTime
      })
      .returning()
      .execute();

    const characterId = characterResult[0].id;

    // Test the handler
    const result = await getCharacter(characterId);

    expect(result).not.toBeNull();
    expect(result!.name).toEqual('AFK Hero');
    expect(result!.current_realm).toEqual('moon');
    expect(result!.is_afk).toEqual(true);
    expect(result!.afk_start_time).toBeInstanceOf(Date);
    expect(result!.afk_end_time).toBeInstanceOf(Date);
  });
});
