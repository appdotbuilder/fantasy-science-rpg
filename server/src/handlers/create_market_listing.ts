
import { db } from '../db';
import { marketListingsTable, inventoryTable } from '../db/schema';
import { type CreateMarketListingInput, type MarketListing } from '../schema';
import { eq, and } from 'drizzle-orm';

export const createMarketListing = async (input: CreateMarketListingInput): Promise<MarketListing> => {
  try {
    // First, verify that the seller owns the item with sufficient quantity
    const inventoryItems = await db.select()
      .from(inventoryTable)
      .where(
        and(
          eq(inventoryTable.character_id, input.seller_id),
          eq(inventoryTable.item_id, input.item_id)
        )
      )
      .execute();

    if (inventoryItems.length === 0) {
      throw new Error('Item not found in seller inventory');
    }

    const inventoryItem = inventoryItems[0];
    if (inventoryItem.quantity < input.quantity) {
      throw new Error('Insufficient quantity in inventory');
    }

    // Calculate total price
    const total_price = input.price_per_unit * input.quantity;

    // Create the market listing
    const result = await db.insert(marketListingsTable)
      .values({
        seller_id: input.seller_id,
        item_id: input.item_id,
        quantity: input.quantity,
        price_per_unit: input.price_per_unit.toString(), // Convert to string for numeric column
        total_price: total_price.toString(), // Convert to string for numeric column
        is_active: true
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const listing = result[0];
    return {
      ...listing,
      price_per_unit: parseFloat(listing.price_per_unit),
      total_price: parseFloat(listing.total_price)
    };
  } catch (error) {
    console.error('Market listing creation failed:', error);
    throw error;
  }
};
