
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { itemsTable } from '../db/schema';
import { getItems } from '../handlers/get_items';

describe('getItems', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no items exist', async () => {
    const result = await getItems();
    expect(result).toEqual([]);
  });

  it('should return all items', async () => {
    // Create test items
    const testItems = [
      {
        name: 'Iron Sword',
        description: 'A basic iron sword',
        type: 'weapon' as const,
        rarity: 'common' as const,
        equipment_slot: 'weapon' as const,
        attack_bonus: 10,
        defense_bonus: null,
        health_bonus: null,
        required_level: 1,
        market_value: '25.50'
      },
      {
        name: 'Health Potion',
        description: 'Restores 50 HP',
        type: 'potion' as const,
        rarity: 'common' as const,
        equipment_slot: null,
        attack_bonus: null,
        defense_bonus: null,
        health_bonus: 50,
        required_level: 1,
        market_value: '10.00'
      },
      {
        name: 'Legendary Armor',
        description: 'Powerful chest armor',
        type: 'armor' as const,
        rarity: 'legendary' as const,
        equipment_slot: 'chest' as const,
        attack_bonus: null,
        defense_bonus: 50,
        health_bonus: 25,
        required_level: 20,
        market_value: '999.99'
      }
    ];

    await db.insert(itemsTable).values(testItems).execute();

    const result = await getItems();

    expect(result).toHaveLength(3);
    
    // Check first item
    const ironSword = result.find(item => item.name === 'Iron Sword');
    expect(ironSword).toBeDefined();
    expect(ironSword!.description).toEqual('A basic iron sword');
    expect(ironSword!.type).toEqual('weapon');
    expect(ironSword!.rarity).toEqual('common');
    expect(ironSword!.equipment_slot).toEqual('weapon');
    expect(ironSword!.attack_bonus).toEqual(10);
    expect(ironSword!.defense_bonus).toBeNull();
    expect(ironSword!.health_bonus).toBeNull();
    expect(ironSword!.required_level).toEqual(1);
    expect(ironSword!.market_value).toEqual(25.5);
    expect(typeof ironSword!.market_value).toEqual('number');
    expect(ironSword!.id).toBeDefined();
    expect(ironSword!.created_at).toBeInstanceOf(Date);

    // Check potion
    const healthPotion = result.find(item => item.name === 'Health Potion');
    expect(healthPotion).toBeDefined();
    expect(healthPotion!.type).toEqual('potion');
    expect(healthPotion!.equipment_slot).toBeNull();
    expect(healthPotion!.health_bonus).toEqual(50);
    expect(healthPotion!.market_value).toEqual(10.0);
    expect(typeof healthPotion!.market_value).toEqual('number');

    // Check legendary armor
    const legendaryArmor = result.find(item => item.name === 'Legendary Armor');
    expect(legendaryArmor).toBeDefined();
    expect(legendaryArmor!.type).toEqual('armor');
    expect(legendaryArmor!.rarity).toEqual('legendary');
    expect(legendaryArmor!.equipment_slot).toEqual('chest');
    expect(legendaryArmor!.defense_bonus).toEqual(50);
    expect(legendaryArmor!.health_bonus).toEqual(25);
    expect(legendaryArmor!.required_level).toEqual(20);
    expect(legendaryArmor!.market_value).toEqual(999.99);
    expect(typeof legendaryArmor!.market_value).toEqual('number');
  });

  it('should handle items with zero market value', async () => {
    await db.insert(itemsTable).values({
      name: 'Broken Stick',
      description: 'Worthless item',
      type: 'material',
      rarity: 'common',
      equipment_slot: null,
      attack_bonus: null,
      defense_bonus: null,
      health_bonus: null,
      required_level: 1,
      market_value: '0.00'
    }).execute();

    const result = await getItems();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Broken Stick');
    expect(result[0].market_value).toEqual(0);
    expect(typeof result[0].market_value).toEqual('number');
  });

  it('should return items ordered by id', async () => {
    // Create multiple items to verify ordering
    const testItems = [
      {
        name: 'Item C',
        description: 'Third item',
        type: 'material' as const,
        rarity: 'common' as const,
        equipment_slot: null,
        attack_bonus: null,
        defense_bonus: null,
        health_bonus: null,
        required_level: 1,
        market_value: '1.00'
      },
      {
        name: 'Item A',
        description: 'First item',
        type: 'weapon' as const,
        rarity: 'common' as const,
        equipment_slot: 'weapon' as const,
        attack_bonus: 5,
        defense_bonus: null,
        health_bonus: null,
        required_level: 1,
        market_value: '2.00'
      },
      {
        name: 'Item B',
        description: 'Second item',
        type: 'armor' as const,
        rarity: 'uncommon' as const,
        equipment_slot: 'helmet' as const,
        attack_bonus: null,
        defense_bonus: 3,
        health_bonus: null,
        required_level: 5,
        market_value: '15.50'
      }
    ];

    await db.insert(itemsTable).values(testItems).execute();

    const result = await getItems();

    expect(result).toHaveLength(3);
    // Items should be returned in insertion order (by id)
    expect(result[0].name).toEqual('Item C');
    expect(result[1].name).toEqual('Item A');
    expect(result[2].name).toEqual('Item B');
  });
});
