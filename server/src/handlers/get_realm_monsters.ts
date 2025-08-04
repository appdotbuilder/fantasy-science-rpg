
import { db } from '../db';
import { monstersTable } from '../db/schema';
import { type Monster, type RealmType } from '../schema';
import { eq } from 'drizzle-orm';

export async function getRealmMonsters(realm: RealmType): Promise<Monster[]> {
  try {
    const results = await db.select()
      .from(monstersTable)
      .where(eq(monstersTable.realm, realm))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch realm monsters:', error);
    throw error;
  }
}
