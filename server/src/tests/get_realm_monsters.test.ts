
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { monstersTable } from '../db/schema';
import { type RealmType } from '../schema';
import { getRealmMonsters } from '../handlers/get_realm_monsters';

describe('getRealmMonsters', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return monsters for a specific realm', async () => {
    // Create test monsters for different realms
    await db.insert(monstersTable).values([
      {
        name: 'Earth Goblin',
        realm: 'earth',
        type: 'normal',
        level: 1,
        health: 50,
        attack: 8,
        defense: 3,
        experience_reward: 10
      },
      {
        name: 'Earth Orc',
        realm: 'earth',
        type: 'elite',
        level: 5,
        health: 150,
        attack: 15,
        defense: 8,
        experience_reward: 50
      },
      {
        name: 'Moon Spider',
        realm: 'moon',
        type: 'normal',
        level: 10,
        health: 200,
        attack: 25,
        defense: 12,
        experience_reward: 100
      }
    ]).execute();

    const earthMonsters = await getRealmMonsters('earth');

    expect(earthMonsters).toHaveLength(2);
    expect(earthMonsters.every(monster => monster.realm === 'earth')).toBe(true);
    
    const monsterNames = earthMonsters.map(m => m.name);
    expect(monsterNames).toContain('Earth Goblin');
    expect(monsterNames).toContain('Earth Orc');
    expect(monsterNames).not.toContain('Moon Spider');
  });

  it('should return empty array for realm with no monsters', async () => {
    // Create monsters only for earth realm
    await db.insert(monstersTable).values({
      name: 'Earth Goblin',
      realm: 'earth',
      type: 'normal',
      level: 1,
      health: 50,
      attack: 8,
      defense: 3,
      experience_reward: 10
    }).execute();

    const marsMonsters = await getRealmMonsters('mars');

    expect(marsMonsters).toHaveLength(0);
  });

  it('should return all monster types for a realm', async () => {
    // Create monsters of different types in the same realm
    await db.insert(monstersTable).values([
      {
        name: 'Moon Rat',
        realm: 'moon',
        type: 'normal',
        level: 8,
        health: 80,
        attack: 12,
        defense: 5,
        experience_reward: 25
      },
      {
        name: 'Moon Wolf',
        realm: 'moon',
        type: 'elite',
        level: 12,
        health: 250,
        attack: 30,
        defense: 15,
        experience_reward: 150
      },
      {
        name: 'Moon Dragon',
        realm: 'moon',
        type: 'boss',
        level: 20,
        health: 1000,
        attack: 80,
        defense: 40,
        experience_reward: 1000
      }
    ]).execute();

    const moonMonsters = await getRealmMonsters('moon');

    expect(moonMonsters).toHaveLength(3);
    
    const monsterTypes = moonMonsters.map(m => m.type);
    expect(monsterTypes).toContain('normal');
    expect(monsterTypes).toContain('elite');
    expect(monsterTypes).toContain('boss');
  });

  it('should return monsters with correct properties', async () => {
    await db.insert(monstersTable).values({
      name: 'Test Monster',
      realm: 'earth',
      type: 'normal',
      level: 5,
      health: 100,
      attack: 15,
      defense: 7,
      experience_reward: 30
    }).execute();

    const monsters = await getRealmMonsters('earth');

    expect(monsters).toHaveLength(1);
    const monster = monsters[0];
    
    expect(monster.id).toBeDefined();
    expect(monster.name).toBe('Test Monster');
    expect(monster.realm).toBe('earth');
    expect(monster.type).toBe('normal');
    expect(monster.level).toBe(5);
    expect(monster.health).toBe(100);
    expect(monster.attack).toBe(15);
    expect(monster.defense).toBe(7);
    expect(monster.experience_reward).toBe(30);
    expect(monster.created_at).toBeInstanceOf(Date);
  });

  it('should handle all valid realm types', async () => {
    const realms: RealmType[] = ['earth', 'moon', 'mars'];

    // Create one monster for each realm
    for (const realm of realms) {
      await db.insert(monstersTable).values({
        name: `${realm} Monster`,
        realm: realm,
        type: 'normal',
        level: 1,
        health: 50,
        attack: 10,
        defense: 5,
        experience_reward: 20
      }).execute();
    }

    // Test each realm
    for (const realm of realms) {
      const monsters = await getRealmMonsters(realm);
      expect(monsters).toHaveLength(1);
      expect(monsters[0].realm).toBe(realm);
      expect(monsters[0].name).toBe(`${realm} Monster`);
    }
  });
});
