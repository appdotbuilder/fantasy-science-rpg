
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, charactersTable, itemsTable, inventoryTable } from '../db/schema';
import { getCharacterInventory } from '../handlers/get_character_inventory';

describe('getCharacterInventory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when character has no inventory items', async () => {
    // Create user and character first
    const user = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const character = await db.insert(charactersTable)
      .values({
        user_id: user[0].id,
        name: 'TestCharacter'
      })
      .returning()
      .execute();

    const result = await getCharacterInventory(character[0].id);

    expect(result).toEqual([]);
  });

  it('should return inventory items for a character', async () => {
    // Create user and character
    const user = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const character = await db.insert(charactersTable)
      .values({
        user_id: user[0].id,
        name: 'TestCharacter'
      })
      .returning()
      .execute();

    // Create items
    const items = await db.insert(itemsTable)
      .values([
        {
          name: 'Iron Sword',
          description: 'A basic sword',
          type: 'weapon',
          rarity: 'common',
          equipment_slot: 'weapon',
          attack_bonus: 5,
          required_level: 1,
          market_value: '10.50'
        },
        {
          name: 'Health Potion',
          description: 'Restores health',
          type: 'potion',
          rarity: 'common',
          required_level: 1,
          market_value: '5.00'
        }
      ])
      .returning()
      .execute();

    // Create inventory entries
    const inventoryEntries = await db.insert(inventoryTable)
      .values([
        {
          character_id: character[0].id,
          item_id: items[0].id,
          quantity: 1,
          is_equipped: true
        },
        {
          character_id: character[0].id,
          item_id: items[1].id,
          quantity: 5,
          is_equipped: false
        }
      ])
      .returning()
      .execute();

    const result = await getCharacterInventory(character[0].id);

    expect(result).toHaveLength(2);
    
    // Verify first inventory item (sword)
    const swordInventory = result.find(inv => inv.item_id === items[0].id);
    expect(swordInventory).toBeDefined();
    expect(swordInventory!.character_id).toBe(character[0].id);
    expect(swordInventory!.quantity).toBe(1);
    expect(swordInventory!.is_equipped).toBe(true);
    expect(swordInventory!.id).toBeDefined();
    expect(swordInventory!.created_at).toBeInstanceOf(Date);
    expect(swordInventory!.updated_at).toBeInstanceOf(Date);

    // Verify second inventory item (potion)
    const potionInventory = result.find(inv => inv.item_id === items[1].id);
    expect(potionInventory).toBeDefined();
    expect(potionInventory!.character_id).toBe(character[0].id);
    expect(potionInventory!.quantity).toBe(5);
    expect(potionInventory!.is_equipped).toBe(false);
  });

  it('should only return inventory for the specified character', async () => {
    // Create users and characters
    const user1 = await db.insert(usersTable)
      .values({
        username: 'user1',
        email: 'user1@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const user2 = await db.insert(usersTable)
      .values({
        username: 'user2',
        email: 'user2@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const character1 = await db.insert(charactersTable)
      .values({
        user_id: user1[0].id,
        name: 'Character1'
      })
      .returning()
      .execute();

    const character2 = await db.insert(charactersTable)
      .values({
        user_id: user2[0].id,
        name: 'Character2'
      })
      .returning()
      .execute();

    // Create item
    const item = await db.insert(itemsTable)
      .values({
        name: 'Test Item',
        description: 'A test item',
        type: 'other',
        rarity: 'common',
        required_level: 1,
        market_value: '1.00'
      })
      .returning()
      .execute();

    // Create inventory for both characters
    await db.insert(inventoryTable)
      .values([
        {
          character_id: character1[0].id,
          item_id: item[0].id,
          quantity: 3
        },
        {
          character_id: character2[0].id,
          item_id: item[0].id,
          quantity: 7
        }
      ])
      .execute();

    // Get inventory for character 1
    const result = await getCharacterInventory(character1[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].character_id).toBe(character1[0].id);
    expect(result[0].quantity).toBe(3);
  });
});
