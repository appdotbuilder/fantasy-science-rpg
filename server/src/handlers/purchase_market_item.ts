
import { db } from '../db';
import { marketListingsTable, inventoryTable, charactersTable } from '../db/schema';
import { type MarketListing } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function purchaseMarketItem(listingId: number, buyerId: number): Promise<MarketListing | null> {
  try {
    // Start a transaction to ensure data consistency
    const result = await db.transaction(async (tx) => {
      // 1. Get the market listing and verify it's active
      const listings = await tx.select()
        .from(marketListingsTable)
        .where(and(
          eq(marketListingsTable.id, listingId),
          eq(marketListingsTable.is_active, true)
        ))
        .execute();

      if (listings.length === 0) {
        return null; // Listing not found or not active
      }

      const listing = listings[0];

      // 2. Verify buyer exists and is not the seller
      const buyers = await tx.select()
        .from(charactersTable)
        .where(eq(charactersTable.id, buyerId))
        .execute();

      if (buyers.length === 0 || buyerId === listing.seller_id) {
        return null; // Buyer doesn't exist or trying to buy own item
      }

      // 3. Check if buyer already has this item in inventory
      const existingInventory = await tx.select()
        .from(inventoryTable)
        .where(and(
          eq(inventoryTable.character_id, buyerId),
          eq(inventoryTable.item_id, listing.item_id)
        ))
        .execute();

      // 4. Add/update item in buyer's inventory
      if (existingInventory.length > 0) {
        // Update existing inventory entry
        await tx.update(inventoryTable)
          .set({
            quantity: existingInventory[0].quantity + listing.quantity,
            updated_at: new Date()
          })
          .where(eq(inventoryTable.id, existingInventory[0].id))
          .execute();
      } else {
        // Create new inventory entry
        await tx.insert(inventoryTable)
          .values({
            character_id: buyerId,
            item_id: listing.item_id,
            quantity: listing.quantity,
            is_equipped: false
          })
          .execute();
      }

      // 5. Mark the listing as inactive (sold)
      await tx.update(marketListingsTable)
        .set({
          is_active: false,
          updated_at: new Date()
        })
        .where(eq(marketListingsTable.id, listingId))
        .execute();

      // 6. Return the updated listing
      const updatedListings = await tx.select()
        .from(marketListingsTable)
        .where(eq(marketListingsTable.id, listingId))
        .execute();

      const updatedListing = updatedListings[0];
      return {
        ...updatedListing,
        price_per_unit: parseFloat(updatedListing.price_per_unit),
        total_price: parseFloat(updatedListing.total_price)
      };
    });

    return result;
  } catch (error) {
    console.error('Market purchase failed:', error);
    throw error;
  }
}
