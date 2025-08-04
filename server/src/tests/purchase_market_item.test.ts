
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, charactersTable, itemsTable, marketListingsTable, inventoryTable } from '../db/schema';
import { purchaseMarketItem } from '../handlers/purchase_market_item';
import { eq, and } from 'drizzle-orm';

describe('purchaseMarketItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUser1Id: number;
  let testUser2Id: number;
  let testCharacter1Id: number;
  let testCharacter2Id: number;
  let testItemId: number;
  let testListingId: number;

  beforeEach(async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          username: 'seller',
          email: 'seller@test.com',
          password_hash: 'hashedpassword1'
        },
        {
          username: 'buyer',
          email: 'buyer@test.com',
          password_hash: 'hashedpassword2'
        }
      ])
      .returning()
      .execute();

    testUser1Id = users[0].id;
    testUser2Id = users[1].id;

    // Create test characters
    const characters = await db.insert(charactersTable)
      .values([
        {
          user_id: testUser1Id,
          name: 'Seller Character'
        },
        {
          user_id: testUser2Id,
          name: 'Buyer Character'
        }
      ])
      .returning()
      .execute();

    testCharacter1Id = characters[0].id;
    testCharacter2Id = characters[1].id;

    // Create test item
    const items = await db.insert(itemsTable)
      .values({
        name: 'Iron Sword',
        description: 'A sturdy iron sword',
        type: 'weapon',
        rarity: 'common',
        equipment_slot: 'weapon',
        attack_bonus: 5,
        required_level: 1,
        market_value: '100.50'
      })
      .returning()
      .execute();

    testItemId = items[0].id;

    // Create test market listing
    const listings = await db.insert(marketListingsTable)
      .values({
        seller_id: testCharacter1Id,
        item_id: testItemId,
        quantity: 2,
        price_per_unit: '50.25',
        total_price: '100.50',
        is_active: true
      })
      .returning()
      .execute();

    testListingId = listings[0].id;
  });

  it('should successfully purchase a market item', async () => {
    const result = await purchaseMarketItem(testListingId, testCharacter2Id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(testListingId);
    expect(result!.is_active).toBe(false);
    expect(typeof result!.price_per_unit).toBe('number');
    expect(typeof result!.total_price).toBe('number');
    expect(result!.price_per_unit).toEqual(50.25);
    expect(result!.total_price).toEqual(100.50);
  });

  it('should add item to buyer inventory', async () => {
    await purchaseMarketItem(testListingId, testCharacter2Id);

    const inventory = await db.select()
      .from(inventoryTable)
      .where(and(
        eq(inventoryTable.character_id, testCharacter2Id),
        eq(inventoryTable.item_id, testItemId)
      ))
      .execute();

    expect(inventory).toHaveLength(1);
    expect(inventory[0].quantity).toEqual(2);
    expect(inventory[0].is_equipped).toBe(false);
  });

  it('should update existing inventory when buyer already has the item', async () => {
    // Give buyer 1 of the item already
    await db.insert(inventoryTable)
      .values({
        character_id: testCharacter2Id,
        item_id: testItemId,
        quantity: 1,
        is_equipped: false
      })
      .execute();

    await purchaseMarketItem(testListingId, testCharacter2Id);

    const inventory = await db.select()
      .from(inventoryTable)
      .where(and(
        eq(inventoryTable.character_id, testCharacter2Id),
        eq(inventoryTable.item_id, testItemId)
      ))
      .execute();

    expect(inventory).toHaveLength(1);
    expect(inventory[0].quantity).toEqual(3); // 1 existing + 2 purchased
  });

  it('should mark listing as inactive after purchase', async () => {
    await purchaseMarketItem(testListingId, testCharacter2Id);

    const listings = await db.select()
      .from(marketListingsTable)
      .where(eq(marketListingsTable.id, testListingId))
      .execute();

    expect(listings[0].is_active).toBe(false);
  });

  it('should return null for non-existent listing', async () => {
    const result = await purchaseMarketItem(99999, testCharacter2Id);
    expect(result).toBeNull();
  });

  it('should return null for inactive listing', async () => {
    // Mark listing as inactive
    await db.update(marketListingsTable)
      .set({ is_active: false })
      .where(eq(marketListingsTable.id, testListingId))
      .execute();

    const result = await purchaseMarketItem(testListingId, testCharacter2Id);
    expect(result).toBeNull();
  });

  it('should return null for non-existent buyer', async () => {
    const result = await purchaseMarketItem(testListingId, 99999);
    expect(result).toBeNull();
  });

  it('should return null when seller tries to buy own item', async () => {
    const result = await purchaseMarketItem(testListingId, testCharacter1Id);
    expect(result).toBeNull();
  });

  it('should handle multiple concurrent purchases correctly', async () => {
    // Create another buyer
    const user3 = await db.insert(usersTable)
      .values({
        username: 'buyer2',
        email: 'buyer2@test.com',
        password_hash: 'hashedpassword3'
      })
      .returning()
      .execute();

    const character3 = await db.insert(charactersTable)
      .values({
        user_id: user3[0].id,
        name: 'Buyer 2 Character'
      })
      .returning()
      .execute();

    // First purchase should succeed
    const result1 = await purchaseMarketItem(testListingId, testCharacter2Id);
    expect(result1).not.toBeNull();

    // Second purchase should fail (listing already inactive)
    const result2 = await purchaseMarketItem(testListingId, character3[0].id);
    expect(result2).toBeNull();
  });
});
