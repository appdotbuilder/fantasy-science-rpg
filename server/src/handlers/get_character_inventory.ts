
import { db } from '../db';
import { inventoryTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Inventory } from '../schema';

export const getCharacterInventory = async (characterId: number): Promise<Inventory[]> => {
  try {
    const results = await db.select()
      .from(inventoryTable)
      .where(eq(inventoryTable.character_id, characterId))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get character inventory:', error);
    throw error;
  }
};
