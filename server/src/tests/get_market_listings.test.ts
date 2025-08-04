
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, charactersTable, itemsTable, marketListingsTable } from '../db/schema';
import { getMarketListings } from '../handlers/get_market_listings';

describe('getMarketListings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no market listings exist', async () => {
    const result = await getMarketListings();
    expect(result).toEqual([]);
  });

  it('should return active market listings with proper numeric conversions', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        membership_type: 'free'
      })
      .returning()
      .execute();

    const character = await db.insert(charactersTable)
      .values({
        user_id: user[0].id,
        name: 'TestChar'
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
        required_level: 1,
        market_value: '10.50'
      })
      .returning()
      .execute();

    // Create market listing
    await db.insert(marketListingsTable)
      .values({
        seller_id: character[0].id,
        item_id: item[0].id,
        quantity: 2,
        price_per_unit: '15.75',
        total_price: '31.50',
        is_active: true
      })
      .execute();

    const result = await getMarketListings();

    expect(result).toHaveLength(1);
    expect(result[0].seller_id).toEqual(character[0].id);
    expect(result[0].item_id).toEqual(item[0].id);
    expect(result[0].quantity).toEqual(2);
    expect(result[0].price_per_unit).toEqual(15.75);
    expect(result[0].total_price).toEqual(31.50);
    expect(result[0].is_active).toBe(true);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    // Verify numeric type conversions
    expect(typeof result[0].price_per_unit).toBe('number');
    expect(typeof result[0].total_price).toBe('number');
  });

  it('should only return active market listings', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        membership_type: 'free'
      })
      .returning()
      .execute();

    const character = await db.insert(charactersTable)
      .values({
        user_id: user[0].id,
        name: 'TestChar'
      })
      .returning()
      .execute();

    const item = await db.insert(itemsTable)
      .values({
        name: 'Test Item',
        description: 'A test item',
        type: 'material',
        rarity: 'common',
        required_level: 1,
        market_value: '5.00'
      })
      .returning()
      .execute();

    // Create active listing
    await db.insert(marketListingsTable)
      .values({
        seller_id: character[0].id,
        item_id: item[0].id,
        quantity: 1,
        price_per_unit: '10.00',
        total_price: '10.00',
        is_active: true
      })
      .execute();

    // Create inactive listing
    await db.insert(marketListingsTable)
      .values({
        seller_id: character[0].id,
        item_id: item[0].id,
        quantity: 1,
        price_per_unit: '20.00',
        total_price: '20.00',
        is_active: false
      })
      .execute();

    const result = await getMarketListings();

    // Should only return the active listing
    expect(result).toHaveLength(1);
    expect(result[0].is_active).toBe(true);
    expect(result[0].price_per_unit).toEqual(10.00);
  });

  it('should handle multiple active listings correctly', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        membership_type: 'free'
      })
      .returning()
      .execute();

    const character = await db.insert(charactersTable)
      .values({
        user_id: user[0].id,
        name: 'TestChar'
      })
      .returning()
      .execute();

    const items = await db.insert(itemsTable)
      .values([
        {
          name: 'Sword',
          description: 'A sword',
          type: 'weapon',
          rarity: 'common',
          equipment_slot: 'weapon',
          required_level: 1,
          market_value: '15.00'
        },
        {
          name: 'Shield',
          description: 'A shield',
          type: 'armor',
          rarity: 'uncommon',
          equipment_slot: 'gloves',
          required_level: 5,
          market_value: '25.00'
        }
      ])
      .returning()
      .execute();

    // Create multiple listings
    await db.insert(marketListingsTable)
      .values([
        {
          seller_id: character[0].id,
          item_id: items[0].id,
          quantity: 1,
          price_per_unit: '20.00',
          total_price: '20.00',
          is_active: true
        },
        {
          seller_id: character[0].id,
          item_id: items[1].id,
          quantity: 3,
          price_per_unit: '30.00',
          total_price: '90.00',
          is_active: true
        }
      ])
      .execute();

    const result = await getMarketListings();

    expect(result).toHaveLength(2);
    
    // Verify both listings are returned with correct data
    const swordListing = result.find(listing => listing.item_id === items[0].id);
    const shieldListing = result.find(listing => listing.item_id === items[1].id);

    expect(swordListing).toBeDefined();
    expect(swordListing!.price_per_unit).toEqual(20.00);
    expect(swordListing!.quantity).toEqual(1);

    expect(shieldListing).toBeDefined();
    expect(shieldListing!.price_per_unit).toEqual(30.00);
    expect(shieldListing!.quantity).toEqual(3);
    expect(shieldListing!.total_price).toEqual(90.00);
  });
});
