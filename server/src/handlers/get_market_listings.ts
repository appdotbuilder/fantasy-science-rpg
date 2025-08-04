
import { db } from '../db';
import { marketListingsTable, itemsTable, charactersTable } from '../db/schema';
import { type MarketListing } from '../schema';
import { eq, and } from 'drizzle-orm';

export const getMarketListings = async (): Promise<MarketListing[]> => {
  try {
    // Query active market listings with item and seller details
    const results = await db.select()
      .from(marketListingsTable)
      .innerJoin(itemsTable, eq(marketListingsTable.item_id, itemsTable.id))
      .innerJoin(charactersTable, eq(marketListingsTable.seller_id, charactersTable.id))
      .where(eq(marketListingsTable.is_active, true))
      .execute();

    // Transform joined results to MarketListing format
    return results.map(result => ({
      id: result.market_listings.id,
      seller_id: result.market_listings.seller_id,
      item_id: result.market_listings.item_id,
      quantity: result.market_listings.quantity,
      price_per_unit: parseFloat(result.market_listings.price_per_unit),
      total_price: parseFloat(result.market_listings.total_price),
      is_active: result.market_listings.is_active,
      created_at: result.market_listings.created_at,
      updated_at: result.market_listings.updated_at
    }));
  } catch (error) {
    console.error('Failed to fetch market listings:', error);
    throw error;
  }
};
