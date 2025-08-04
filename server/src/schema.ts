
import { z } from 'zod';

// Enums
export const membershipTypeSchema = z.enum(['free', 'premium']);
export const realmTypeSchema = z.enum(['earth', 'moon', 'mars']);
export const monsterTypeSchema = z.enum(['normal', 'elite', 'boss']);
export const professionTypeSchema = z.enum(['mining', 'chopping']);
export const itemTypeSchema = z.enum(['weapon', 'armor', 'material', 'potion', 'other']);
export const equipmentSlotSchema = z.enum(['weapon', 'helmet', 'chest', 'legs', 'boots', 'gloves']);
export const raritySchema = z.enum(['common', 'uncommon', 'rare', 'epic', 'legendary']);

// Base schemas
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  password_hash: z.string(),
  membership_type: membershipTypeSchema,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export const characterSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  name: z.string(),
  level: z.number().int(),
  experience: z.number().int(),
  health: z.number().int(),
  max_health: z.number().int(),
  attack: z.number().int(),
  defense: z.number().int(),
  current_realm: realmTypeSchema,
  is_afk: z.boolean(),
  afk_start_time: z.coerce.date().nullable(),
  afk_end_time: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export const realmSchema = z.object({
  id: z.number(),
  name: realmTypeSchema,
  display_name: z.string(),
  required_level: z.number().int(),
  required_boss_defeated: z.string().nullable(),
  description: z.string(),
  created_at: z.coerce.date()
});

export const monsterSchema = z.object({
  id: z.number(),
  name: z.string(),
  realm: realmTypeSchema,
  type: monsterTypeSchema,
  level: z.number().int(),
  health: z.number().int(),
  attack: z.number().int(),
  defense: z.number().int(),
  experience_reward: z.number().int(),
  created_at: z.coerce.date()
});

export const itemSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  type: itemTypeSchema,
  rarity: raritySchema,
  equipment_slot: equipmentSlotSchema.nullable(),
  attack_bonus: z.number().int().nullable(),
  defense_bonus: z.number().int().nullable(),
  health_bonus: z.number().int().nullable(),
  required_level: z.number().int(),
  market_value: z.number(),
  created_at: z.coerce.date()
});

export const inventorySchema = z.object({
  id: z.number(),
  character_id: z.number(),
  item_id: z.number(),
  quantity: z.number().int(),
  is_equipped: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export const professionSchema = z.object({
  id: z.number(),
  character_id: z.number(),
  type: professionTypeSchema,
  level: z.number().int(),
  experience: z.number().int(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export const marketListingSchema = z.object({
  id: z.number(),
  seller_id: z.number(),
  item_id: z.number(),
  quantity: z.number().int(),
  price_per_unit: z.number(),
  total_price: z.number(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export const chatMessageSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  username: z.string(),
  message: z.string(),
  created_at: z.coerce.date()
});

export const afkSessionSchema = z.object({
  id: z.number(),
  character_id: z.number(),
  start_time: z.coerce.date(),
  end_time: z.coerce.date(),
  realm: realmTypeSchema,
  experience_gained: z.number().int(),
  items_found: z.string(), // JSON string of items found
  is_completed: z.boolean(),
  created_at: z.coerce.date()
});

// Input schemas
export const createUserInputSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
  password: z.string().min(6),
  membership_type: membershipTypeSchema.optional()
});

export const createCharacterInputSchema = z.object({
  user_id: z.number(),
  name: z.string().min(2).max(20)
});

export const startAfkInputSchema = z.object({
  character_id: z.number(),
  duration_hours: z.number().int().min(1).max(12)
});

export const updateInventoryInputSchema = z.object({
  character_id: z.number(),
  item_id: z.number(),
  quantity: z.number().int(),
  is_equipped: z.boolean().optional()
});

export const createMarketListingInputSchema = z.object({
  seller_id: z.number(),
  item_id: z.number(),
  quantity: z.number().int().positive(),
  price_per_unit: z.number().positive()
});

export const sendChatMessageInputSchema = z.object({
  user_id: z.number(),
  message: z.string().min(1).max(500)
});

export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

// Types
export type User = z.infer<typeof userSchema>;
export type Character = z.infer<typeof characterSchema>;
export type Realm = z.infer<typeof realmSchema>;
export type Monster = z.infer<typeof monsterSchema>;
export type Item = z.infer<typeof itemSchema>;
export type Inventory = z.infer<typeof inventorySchema>;
export type Profession = z.infer<typeof professionSchema>;
export type MarketListing = z.infer<typeof marketListingSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type AfkSession = z.infer<typeof afkSessionSchema>;

export type CreateUserInput = z.infer<typeof createUserInputSchema>;
export type CreateCharacterInput = z.infer<typeof createCharacterInputSchema>;
export type StartAfkInput = z.infer<typeof startAfkInputSchema>;
export type UpdateInventoryInput = z.infer<typeof updateInventoryInputSchema>;
export type CreateMarketListingInput = z.infer<typeof createMarketListingInputSchema>;
export type SendChatMessageInput = z.infer<typeof sendChatMessageInputSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;

export type MembershipType = z.infer<typeof membershipTypeSchema>;
export type RealmType = z.infer<typeof realmTypeSchema>;
export type MonsterType = z.infer<typeof monsterTypeSchema>;
export type ProfessionType = z.infer<typeof professionTypeSchema>;
export type ItemType = z.infer<typeof itemTypeSchema>;
export type EquipmentSlot = z.infer<typeof equipmentSlotSchema>;
export type Rarity = z.infer<typeof raritySchema>;
