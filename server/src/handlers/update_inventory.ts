
import { db } from '../db';
import { inventoryTable, itemsTable, charactersTable } from '../db/schema';
import { type UpdateInventoryInput, type Inventory } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function updateInventory(input: UpdateInventoryInput): Promise<Inventory> {
  try {
    // First, check if character exists
    const character = await db.select()
      .from(charactersTable)
      .where(eq(charactersTable.id, input.character_id))
      .execute();

    if (character.length === 0) {
      throw new Error(`Character with id ${input.character_id} not found`);
    }

    // Check if item exists
    const item = await db.select()
      .from(itemsTable)
      .where(eq(itemsTable.id, input.item_id))
      .execute();

    if (item.length === 0) {
      throw new Error(`Item with id ${input.item_id} not found`);
    }

    // Check if inventory entry already exists
    const existingInventory = await db.select()
      .from(inventoryTable)
      .where(and(
        eq(inventoryTable.character_id, input.character_id),
        eq(inventoryTable.item_id, input.item_id)
      ))
      .execute();

    // Handle equipment slot conflicts if trying to equip
    if (input.is_equipped && item[0].equipment_slot) {
      // Find currently equipped items in the same slot
      const equippedItemsInSlot = await db.select()
        .from(inventoryTable)
        .innerJoin(itemsTable, eq(inventoryTable.item_id, itemsTable.id))
        .where(and(
          eq(inventoryTable.character_id, input.character_id),
          eq(inventoryTable.is_equipped, true),
          eq(itemsTable.equipment_slot, item[0].equipment_slot)
        ))
        .execute();

      // Unequip all items in the same slot
      for (const equippedItem of equippedItemsInSlot) {
        await db.update(inventoryTable)
          .set({ 
            is_equipped: false,
            updated_at: new Date()
          })
          .where(eq(inventoryTable.id, equippedItem.inventory.id))
          .execute();
      }
    }

    if (existingInventory.length > 0) {
      // Update existing inventory entry
      if (input.quantity <= 0) {
        // Remove item if quantity is 0 or negative
        await db.delete(inventoryTable)
          .where(and(
            eq(inventoryTable.character_id, input.character_id),
            eq(inventoryTable.item_id, input.item_id)
          ))
          .execute();

        // Return the deleted entry with 0 quantity
        return {
          ...existingInventory[0],
          quantity: 0,
          is_equipped: false,
          updated_at: new Date()
        };
      } else {
        // Update quantity and equipment status
        const result = await db.update(inventoryTable)
          .set({
            quantity: input.quantity,
            is_equipped: input.is_equipped !== undefined ? input.is_equipped : existingInventory[0].is_equipped,
            updated_at: new Date()
          })
          .where(and(
            eq(inventoryTable.character_id, input.character_id),
            eq(inventoryTable.item_id, input.item_id)
          ))
          .returning()
          .execute();

        return result[0];
      }
    } else {
      // Create new inventory entry (only if quantity is positive)
      if (input.quantity <= 0) {
        throw new Error('Cannot create inventory entry with quantity <= 0');
      }

      const result = await db.insert(inventoryTable)
        .values({
          character_id: input.character_id,
          item_id: input.item_id,
          quantity: input.quantity,
          is_equipped: input.is_equipped || false
        })
        .returning()
        .execute();

      return result[0];
    }
  } catch (error) {
    console.error('Inventory update failed:', error);
    throw error;
  }
}
