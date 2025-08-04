
import { db } from '../db';
import { realmsTable } from '../db/schema';
import { type Realm } from '../schema';

export const getRealms = async (): Promise<Realm[]> => {
  try {
    const results = await db.select()
      .from(realmsTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch realms:', error);
    throw error;
  }
};
