
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, charactersTable } from '../db/schema';
import { type CreateUserInput, type CreateCharacterInput } from '../schema';
import { getUserCharacters } from '../handlers/get_user_characters';

// Test data
const testUser: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123',
  membership_type: 'free'
};

const testCharacter1: CreateCharacterInput = {
  user_id: 0, // Will be set after user creation
  name: 'TestWarrior'
};

const testCharacter2: CreateCharacterInput = {
  user_id: 0, // Will be set after user creation
  name: 'TestMage'
};

describe('getUserCharacters', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when user has no characters', async () => {
    // Create user without characters
    const userResult = await db.insert(usersTable)
      .values({
        username: testUser.username,
        email: testUser.email,
        password_hash: 'hashed_password',
        membership_type: testUser.membership_type || 'free'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;
    const result = await getUserCharacters(userId);

    expect(result).toEqual([]);
  });

  it('should return all characters for a user', async () => {
    // Create user first
    const userResult = await db.insert(usersTable)
      .values({
        username: testUser.username,
        email: testUser.email,
        password_hash: 'hashed_password',
        membership_type: testUser.membership_type || 'free'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create characters for the user
    const character1Result = await db.insert(charactersTable)
      .values({
        user_id: userId,
        name: testCharacter1.name
      })
      .returning()
      .execute();

    const character2Result = await db.insert(charactersTable)
      .values({
        user_id: userId,
        name: testCharacter2.name
      })
      .returning()
      .execute();

    const result = await getUserCharacters(userId);

    expect(result).toHaveLength(2);
    
    // Verify character data
    const character1 = result.find(c => c.name === 'TestWarrior');
    const character2 = result.find(c => c.name === 'TestMage');

    expect(character1).toBeDefined();
    expect(character1!.user_id).toBe(userId);
    expect(character1!.level).toBe(1); // Default value
    expect(character1!.experience).toBe(0); // Default value
    expect(character1!.health).toBe(100); // Default value
    expect(character1!.max_health).toBe(100); // Default value
    expect(character1!.attack).toBe(10); // Default value
    expect(character1!.defense).toBe(5); // Default value
    expect(character1!.current_realm).toBe('earth'); // Default value
    expect(character1!.is_afk).toBe(false); // Default value
    expect(character1!.created_at).toBeInstanceOf(Date);
    expect(character1!.updated_at).toBeInstanceOf(Date);

    expect(character2).toBeDefined();
    expect(character2!.user_id).toBe(userId);
    expect(character2!.name).toBe('TestMage');
  });

  it('should only return characters belonging to the specified user', async () => {
    // Create two users
    const user1Result = await db.insert(usersTable)
      .values({
        username: 'user1',
        email: 'user1@example.com',
        password_hash: 'hashed_password',
        membership_type: 'free'
      })
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values({
        username: 'user2',
        email: 'user2@example.com',
        password_hash: 'hashed_password',
        membership_type: 'free'
      })
      .returning()
      .execute();

    const user1Id = user1Result[0].id;
    const user2Id = user2Result[0].id;

    // Create characters for both users
    await db.insert(charactersTable)
      .values({
        user_id: user1Id,
        name: 'User1Character'
      })
      .execute();

    await db.insert(charactersTable)
      .values({
        user_id: user2Id,
        name: 'User2Character'
      })
      .execute();

    // Get characters for user1 only
    const result = await getUserCharacters(user1Id);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('User1Character');
    expect(result[0].user_id).toBe(user1Id);
  });

  it('should return characters with correct data types', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values({
        username: testUser.username,
        email: testUser.email,
        password_hash: 'hashed_password',
        membership_type: 'free'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create character with custom values
    await db.insert(charactersTable)
      .values({
        user_id: userId,
        name: 'TestCharacter',
        level: 5,
        experience: 1000,
        health: 120,
        max_health: 150,
        attack: 25,
        defense: 15,
        current_realm: 'moon',
        is_afk: true
      })
      .execute();

    const result = await getUserCharacters(userId);

    expect(result).toHaveLength(1);
    const character = result[0];

    // Verify all data types are correct
    expect(typeof character.id).toBe('number');
    expect(typeof character.user_id).toBe('number');
    expect(typeof character.name).toBe('string');
    expect(typeof character.level).toBe('number');
    expect(typeof character.experience).toBe('number');
    expect(typeof character.health).toBe('number');
    expect(typeof character.max_health).toBe('number');
    expect(typeof character.attack).toBe('number');
    expect(typeof character.defense).toBe('number');
    expect(character.current_realm).toBe('moon');
    expect(typeof character.is_afk).toBe('boolean');
    expect(character.afk_start_time).toBeNull();
    expect(character.afk_end_time).toBeNull();
    expect(character.created_at).toBeInstanceOf(Date);
    expect(character.updated_at).toBeInstanceOf(Date);

    // Verify specific values
    expect(character.level).toBe(5);
    expect(character.experience).toBe(1000);
    expect(character.health).toBe(120);
    expect(character.is_afk).toBe(true);
  });
});
