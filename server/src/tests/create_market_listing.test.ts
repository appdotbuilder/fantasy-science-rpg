
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, charactersTable, itemsTable, inventoryTable, marketListingsTable } from '../db/schema';
import { type CreateMarketListingInput } from '../schema';
import { createMarketListing } from '../handlers/create_market_listing';
import { eq } from 'drizzle-orm';

describe('createMarketListing', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a market listing successfully', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
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

    const item = await db.insert(itemsTable)
      .values({
        name: 'Test Sword',
        description: 'A test weapon',
        type: 'weapon',
        rarity: 'common',
        equipment_slot: 'weapon',
        attack_bonus: 10,
        required_level: 1,
        market_value: '100.00'
      })
      .returning()
      .execute();

    // Add item to character's inventory
    await db.insert(inventoryTable)
      .values({
        character_id: character[0].id,
        item_id: item[0].id,
        quantity: 5
      })
      .execute();

    const input: CreateMarketListingInput = {
      seller_id: character[0].id,
      item_id: item[0].id,
      quantity: 3,
      price_per_unit: 150.50
    };

    const result = await createMarketListing(input);

    // Verify basic fields
    expect(result.seller_id).toEqual(character[0].id);
    expect(result.item_id).toEqual(item[0].id);
    expect(result.quantity).toEqual(3);
    expect(result.price_per_unit).toEqual(150.50);
    expect(result.total_price).toEqual(451.50); // 150.50 * 3
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    
    // Verify numeric types
    expect(typeof result.price_per_unit).toBe('number');
    expect(typeof result.total_price).toBe('number');
  });

  it('should save market listing to database', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
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

    const item = await db.insert(itemsTable)
      .values({
        name: 'Test Armor',
        description: 'Test armor piece',
        type: 'armor',
        rarity: 'uncommon',
        equipment_slot: 'chest',
        defense_bonus: 15,
        required_level: 1,
        market_value: '75.25'
      })
      .returning()
      .execute();

    await db.insert(inventoryTable)
      .values({
        character_id: character[0].id,
        item_id: item[0].id,
        quantity: 10
      })
      .execute();

    const input: CreateMarketListingInput = {
      seller_id: character[0].id,
      item_id: item[0].id,
      quantity: 2,
      price_per_unit: 99.99
    };

    const result = await createMarketListing(input);

    // Verify it was saved to database
    const listings = await db.select()
      .from(marketListingsTable)
      .where(eq(marketListingsTable.id, result.id))
      .execute();

    expect(listings).toHaveLength(1);
    expect(listings[0].seller_id).toEqual(character[0].id);
    expect(listings[0].item_id).toEqual(item[0].id);
    expect(listings[0].quantity).toEqual(2);
    expect(parseFloat(listings[0].price_per_unit)).toEqual(99.99);
    expect(parseFloat(listings[0].total_price)).toEqual(199.98);
    expect(listings[0].is_active).toBe(true);
  });

  it('should throw error when item not in inventory', async () => {
    // Create prerequisite data without adding item to inventory
    const user = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
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

    const item = await db.insert(itemsTable)
      .values({
        name: 'Test Potion',
        description: 'A healing potion',
        type: 'potion',
        rarity: 'common',
        required_level: 1,
        market_value: '10.00'
      })
      .returning()
      .execute();

    const input: CreateMarketListingInput = {
      seller_id: character[0].id,
      item_id: item[0].id,
      quantity: 1,
      price_per_unit: 15.00
    };

    await expect(createMarketListing(input)).rejects.toThrow(/item not found in seller inventory/i);
  });

  it('should throw error when insufficient quantity', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
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

    const item = await db.insert(itemsTable)
      .values({
        name: 'Rare Material',
        description: 'A rare crafting material',
        type: 'material',
        rarity: 'rare',
        required_level: 1,
        market_value: '50.00'
      })
      .returning()
      .execute();

    // Add only 2 items to inventory
    await db.insert(inventoryTable)
      .values({
        character_id: character[0].id,
        item_id: item[0].id,
        quantity: 2
      })
      .execute();

    const input: CreateMarketListingInput = {
      seller_id: character[0].id,
      item_id: item[0].id,
      quantity: 5, // Trying to sell more than available
      price_per_unit: 75.00
    };

    await expect(createMarketListing(input)).rejects.toThrow(/insufficient quantity in inventory/i);
  });

  it('should calculate total price correctly', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
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

    const item = await db.insert(itemsTable)
      .values({
        name: 'Gold Ore',
        description: 'Valuable mining material',
        type: 'material',
        rarity: 'epic',
        required_level: 10,
        market_value: '200.00'
      })
      .returning()
      .execute();

    await db.insert(inventoryTable)
      .values({
        character_id: character[0].id,
        item_id: item[0].id,
        quantity: 20
      })
      .execute();

    const input: CreateMarketListingInput = {
      seller_id: character[0].id,
      item_id: item[0].id,
      quantity: 7,
      price_per_unit: 123.45
    };

    const result = await createMarketListing(input);

    expect(result.total_price).toEqual(864.15); // 123.45 * 7
    expect(typeof result.total_price).toBe('number');
  });
});
