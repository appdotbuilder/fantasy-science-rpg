
import { db } from '../db';
import { itemsTable } from '../db/schema';
import { type Item } from '../schema';

export const getItems = async (): Promise<Item[]> => {
  try {
    const results = await db.select()
      .from(itemsTable)
      .execute();

    // Convert numeric fields back to numbers
    return results.map(item => ({
      ...item,
      market_value: parseFloat(item.market_value)
    }));
  } catch (error) {
    console.error('Failed to fetch items:', error);
    throw error;
  }
};
