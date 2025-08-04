
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, charactersTable, professionsTable } from '../db/schema';
import { getCharacterProfessions } from '../handlers/get_character_professions';

describe('getCharacterProfessions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when character has no professions', async () => {
    // Create user and character
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const [character] = await db.insert(charactersTable)
      .values({
        user_id: user.id,
        name: 'TestCharacter'
      })
      .returning()
      .execute();

    const result = await getCharacterProfessions(character.id);

    expect(result).toEqual([]);
  });

  it('should return all professions for character', async () => {
    // Create user and character
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const [character] = await db.insert(charactersTable)
      .values({
        user_id: user.id,
        name: 'TestCharacter'
      })
      .returning()
      .execute();

    // Create professions
    await db.insert(professionsTable)
      .values([
        {
          character_id: character.id,
          type: 'mining',
          level: 5,
          experience: 150
        },
        {
          character_id: character.id,
          type: 'chopping',
          level: 3,
          experience: 80
        }
      ])
      .execute();

    const result = await getCharacterProfessions(character.id);

    expect(result).toHaveLength(2);
    
    // Check mining profession
    const miningProfession = result.find(p => p.type === 'mining');
    expect(miningProfession).toBeDefined();
    expect(miningProfession!.level).toBe(5);
    expect(miningProfession!.experience).toBe(150);
    expect(miningProfession!.character_id).toBe(character.id);
    expect(miningProfession!.created_at).toBeInstanceOf(Date);
    expect(miningProfession!.updated_at).toBeInstanceOf(Date);

    // Check chopping profession
    const choppingProfession = result.find(p => p.type === 'chopping');
    expect(choppingProfession).toBeDefined();
    expect(choppingProfession!.level).toBe(3);
    expect(choppingProfession!.experience).toBe(80);
    expect(choppingProfession!.character_id).toBe(character.id);
  });

  it('should only return professions for specified character', async () => {
    // Create two users and characters
    const [user1] = await db.insert(usersTable)
      .values({
        username: 'user1',
        email: 'user1@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const [user2] = await db.insert(usersTable)
      .values({
        username: 'user2',
        email: 'user2@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const [character1] = await db.insert(charactersTable)
      .values({
        user_id: user1.id,
        name: 'Character1'
      })
      .returning()
      .execute();

    const [character2] = await db.insert(charactersTable)
      .values({
        user_id: user2.id,
        name: 'Character2'
      })
      .returning()
      .execute();

    // Create professions for both characters
    await db.insert(professionsTable)
      .values([
        {
          character_id: character1.id,
          type: 'mining',
          level: 5,
          experience: 150
        },
        {
          character_id: character2.id,
          type: 'chopping',
          level: 8,
          experience: 300
        }
      ])
      .execute();

    const result = await getCharacterProfessions(character1.id);

    expect(result).toHaveLength(1);
    expect(result[0].character_id).toBe(character1.id);
    expect(result[0].type).toBe('mining');
    expect(result[0].level).toBe(5);
  });

  it('should return professions with all required fields', async () => {
    // Create user and character
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const [character] = await db.insert(charactersTable)
      .values({
        user_id: user.id,
        name: 'TestCharacter'
      })
      .returning()
      .execute();

    await db.insert(professionsTable)
      .values({
        character_id: character.id,
        type: 'mining',
        level: 10,
        experience: 500
      })
      .execute();

    const result = await getCharacterProfessions(character.id);

    expect(result).toHaveLength(1);
    const profession = result[0];

    // Verify all required fields exist
    expect(profession.id).toBeDefined();
    expect(typeof profession.id).toBe('number');
    expect(profession.character_id).toBe(character.id);
    expect(profession.type).toBe('mining');
    expect(profession.level).toBe(10);
    expect(profession.experience).toBe(500);
    expect(profession.created_at).toBeInstanceOf(Date);
    expect(profession.updated_at).toBeInstanceOf(Date);
  });
});
