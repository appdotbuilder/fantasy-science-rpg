
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, charactersTable, itemsTable, inventoryTable } from '../db/schema';
import { type UpdateInventoryInput } from '../schema';
import { updateInventory } from '../handlers/update_inventory';
import { eq, and } from 'drizzle-orm';

describe('updateInventory', () => {
  let testUserId: number;
  let testCharacterId: number;
  let testItemId: number;
  let testWeaponId: number;
  let testHelmetId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        membership_type: 'free'
      })
      .returning()
      .execute();
    testUserId = user[0].id;

    // Create test character
    const character = await db.insert(charactersTable)
      .values({
        user_id: testUserId,
        name: 'TestCharacter'
      })
      .returning()
      .execute();
    testCharacterId = character[0].id;

    // Create test items
    const item = await db.insert(itemsTable)
      .values({
        name: 'Test Potion',
        description: 'A test potion',
        type: 'potion',
        rarity: 'common',
        required_level: 1,
        market_value: '10.00'
      })
      .returning()
      .execute();
    testItemId = item[0].id;

    const weapon = await db.insert(itemsTable)
      .values({
        name: 'Test Sword',
        description: 'A test sword',
        type: 'weapon',
        rarity: 'common',
        equipment_slot: 'weapon',
        attack_bonus: 5,
        required_level: 1,
        market_value: '50.00'
      })
      .returning()
      .execute();
    testWeaponId = weapon[0].id;

    const helmet = await db.insert(itemsTable)
      .values({
        name: 'Test Helmet',
        description: 'A test helmet',
        type: 'armor',
        rarity: 'common',
        equipment_slot: 'helmet',
        defense_bonus: 3,
        required_level: 1,
        market_value: '30.00'
      })
      .returning()
      .execute();
    testHelmetId = helmet[0].id;
  });

  afterEach(resetDB);

  it('should create new inventory entry', async () => {
    const input: UpdateInventoryInput = {
      character_id: testCharacterId,
      item_id: testItemId,
      quantity: 5,
      is_equipped: false
    };

    const result = await updateInventory(input);

    expect(result.character_id).toEqual(testCharacterId);
    expect(result.item_id).toEqual(testItemId);
    expect(result.quantity).toEqual(5);
    expect(result.is_equipped).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update existing inventory entry quantity', async () => {
    // Create initial inventory entry
    await db.insert(inventoryTable)
      .values({
        character_id: testCharacterId,
        item_id: testItemId,
        quantity: 3
      })
      .execute();

    const input: UpdateInventoryInput = {
      character_id: testCharacterId,
      item_id: testItemId,
      quantity: 8
    };

    const result = await updateInventory(input);

    expect(result.quantity).toEqual(8);
    
    // Verify in database
    const inventory = await db.select()
      .from(inventoryTable)
      .where(and(
        eq(inventoryTable.character_id, testCharacterId),
        eq(inventoryTable.item_id, testItemId)
      ))
      .execute();

    expect(inventory).toHaveLength(1);
    expect(inventory[0].quantity).toEqual(8);
  });

  it('should equip item and update is_equipped status', async () => {
    const input: UpdateInventoryInput = {
      character_id: testCharacterId,
      item_id: testWeaponId,
      quantity: 1,
      is_equipped: true
    };

    const result = await updateInventory(input);

    expect(result.is_equipped).toEqual(true);
    expect(result.quantity).toEqual(1);
  });

  it('should handle equipment slot conflicts by unequipping existing item', async () => {
    // First, equip a weapon
    await db.insert(inventoryTable)
      .values({
        character_id: testCharacterId,
        item_id: testWeaponId,
        quantity: 1,
        is_equipped: true
      })
      .execute();

    // Create another weapon
    const weapon2 = await db.insert(itemsTable)
      .values({
        name: 'Test Axe',
        description: 'A test axe',
        type: 'weapon',
        rarity: 'common',
        equipment_slot: 'weapon',
        attack_bonus: 7,
        required_level: 1,
        market_value: '60.00'
      })
      .returning()
      .execute();

    // Try to equip the second weapon
    const input: UpdateInventoryInput = {
      character_id: testCharacterId,
      item_id: weapon2[0].id,
      quantity: 1,
      is_equipped: true
    };

    const result = await updateInventory(input);

    expect(result.is_equipped).toEqual(true);

    // Check that the first weapon is no longer equipped
    const firstWeaponInventory = await db.select()
      .from(inventoryTable)
      .where(and(
        eq(inventoryTable.character_id, testCharacterId),
        eq(inventoryTable.item_id, testWeaponId)
      ))
      .execute();

    expect(firstWeaponInventory[0].is_equipped).toEqual(false);
  });

  it('should allow different equipment slots to be equipped simultaneously', async () => {
    // Equip weapon
    await updateInventory({
      character_id: testCharacterId,
      item_id: testWeaponId,
      quantity: 1,
      is_equipped: true
    });

    // Equip helmet (different slot)
    const result = await updateInventory({
      character_id: testCharacterId,
      item_id: testHelmetId,
      quantity: 1,
      is_equipped: true
    });

    expect(result.is_equipped).toEqual(true);

    // Verify both items are still equipped
    const equippedItems = await db.select()
      .from(inventoryTable)
      .where(and(
        eq(inventoryTable.character_id, testCharacterId),
        eq(inventoryTable.is_equipped, true)
      ))
      .execute();

    expect(equippedItems).toHaveLength(2);
  });

  it('should remove inventory entry when quantity is set to 0', async () => {
    // Create initial inventory entry
    await db.insert(inventoryTable)
      .values({
        character_id: testCharacterId,
        item_id: testItemId,
        quantity: 5
      })
      .execute();

    const input: UpdateInventoryInput = {
      character_id: testCharacterId,
      item_id: testItemId,
      quantity: 0
    };

    const result = await updateInventory(input);

    expect(result.quantity).toEqual(0);
    expect(result.is_equipped).toEqual(false);

    // Verify entry is removed from database
    const inventory = await db.select()
      .from(inventoryTable)
      .where(and(
        eq(inventoryTable.character_id, testCharacterId),
        eq(inventoryTable.item_id, testItemId)
      ))
      .execute();

    expect(inventory).toHaveLength(0);
  });

  it('should throw error for non-existent character', async () => {
    const input: UpdateInventoryInput = {
      character_id: 99999,
      item_id: testItemId,
      quantity: 1
    };

    expect(updateInventory(input)).rejects.toThrow(/Character with id 99999 not found/i);
  });

  it('should throw error for non-existent item', async () => {
    const input: UpdateInventoryInput = {
      character_id: testCharacterId,
      item_id: 99999,
      quantity: 1
    };

    expect(updateInventory(input)).rejects.toThrow(/Item with id 99999 not found/i);
  });

  it('should throw error when trying to create new entry with negative quantity', async () => {
    const input: UpdateInventoryInput = {
      character_id: testCharacterId,
      item_id: testItemId,
      quantity: -1
    };

    expect(updateInventory(input)).rejects.toThrow(/Cannot create inventory entry with quantity <= 0/i);
  });
});
