
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { realmsTable } from '../db/schema';
import { getRealms } from '../handlers/get_realms';

describe('getRealms', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no realms exist', async () => {
    const result = await getRealms();
    expect(result).toEqual([]);
  });

  it('should return all realms', async () => {
    // Insert test realms
    await db.insert(realmsTable)
      .values([
        {
          name: 'earth',
          display_name: 'Earth Realm',
          required_level: 1,
          required_boss_defeated: null,
          description: 'The starting realm for new adventurers'
        },
        {
          name: 'moon',
          display_name: 'Moon Realm',
          required_level: 25,
          required_boss_defeated: 'Earth Dragon',
          description: 'A mysterious lunar landscape'
        },
        {
          name: 'mars',
          display_name: 'Mars Realm',
          required_level: 50,
          required_boss_defeated: 'Moon Guardian',
          description: 'The red planet with dangerous creatures'
        }
      ])
      .execute();

    const result = await getRealms();

    expect(result).toHaveLength(3);
    
    // Check first realm
    const earthRealm = result.find(r => r.name === 'earth');
    expect(earthRealm).toBeDefined();
    expect(earthRealm!.display_name).toEqual('Earth Realm');
    expect(earthRealm!.required_level).toEqual(1);
    expect(earthRealm!.required_boss_defeated).toBeNull();
    expect(earthRealm!.description).toEqual('The starting realm for new adventurers');
    expect(earthRealm!.id).toBeDefined();
    expect(earthRealm!.created_at).toBeInstanceOf(Date);

    // Check moon realm
    const moonRealm = result.find(r => r.name === 'moon');
    expect(moonRealm).toBeDefined();
    expect(moonRealm!.display_name).toEqual('Moon Realm');
    expect(moonRealm!.required_level).toEqual(25);
    expect(moonRealm!.required_boss_defeated).toEqual('Earth Dragon');

    // Check mars realm
    const marsRealm = result.find(r => r.name === 'mars');
    expect(marsRealm).toBeDefined();
    expect(marsRealm!.display_name).toEqual('Mars Realm');
    expect(marsRealm!.required_level).toEqual(50);
    expect(marsRealm!.required_boss_defeated).toEqual('Moon Guardian');
  });

  it('should return realms in database order', async () => {
    // Insert realms in specific order
    await db.insert(realmsTable)
      .values([
        {
          name: 'mars',
          display_name: 'Mars Realm',
          required_level: 50,
          required_boss_defeated: 'Moon Guardian',
          description: 'The red planet'
        },
        {
          name: 'earth',
          display_name: 'Earth Realm',
          required_level: 1,
          required_boss_defeated: null,
          description: 'The starting realm'
        }
      ])
      .execute();

    const result = await getRealms();

    expect(result).toHaveLength(2);
    // Results should maintain database insertion order
    expect(result[0].name).toEqual('mars');
    expect(result[1].name).toEqual('earth');
  });
});
