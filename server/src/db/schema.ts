
import { serial, text, pgTable, timestamp, integer, boolean, numeric, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const membershipTypeEnum = pgEnum('membership_type', ['free', 'premium']);
export const realmTypeEnum = pgEnum('realm_type', ['earth', 'moon', 'mars']);
export const monsterTypeEnum = pgEnum('monster_type', ['normal', 'elite', 'boss']);
export const professionTypeEnum = pgEnum('profession_type', ['mining', 'chopping']);
export const itemTypeEnum = pgEnum('item_type', ['weapon', 'armor', 'material', 'potion', 'other']);
export const equipmentSlotEnum = pgEnum('equipment_slot', ['weapon', 'helmet', 'chest', 'legs', 'boots', 'gloves']);
export const rarityEnum = pgEnum('rarity', ['common', 'uncommon', 'rare', 'epic', 'legendary']);

// Tables
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  membership_type: membershipTypeEnum('membership_type').notNull().default('free'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const charactersTable = pgTable('characters', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull(),
  name: text('name').notNull(),
  level: integer('level').notNull().default(1),
  experience: integer('experience').notNull().default(0),
  health: integer('health').notNull().default(100),
  max_health: integer('max_health').notNull().default(100),
  attack: integer('attack').notNull().default(10),
  defense: integer('defense').notNull().default(5),
  current_realm: realmTypeEnum('current_realm').notNull().default('earth'),
  is_afk: boolean('is_afk').notNull().default(false),
  afk_start_time: timestamp('afk_start_time'),
  afk_end_time: timestamp('afk_end_time'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const realmsTable = pgTable('realms', {
  id: serial('id').primaryKey(),
  name: realmTypeEnum('name').notNull().unique(),
  display_name: text('display_name').notNull(),
  required_level: integer('required_level').notNull(),
  required_boss_defeated: text('required_boss_defeated'),
  description: text('description').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const monstersTable = pgTable('monsters', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  realm: realmTypeEnum('realm').notNull(),
  type: monsterTypeEnum('type').notNull(),
  level: integer('level').notNull(),
  health: integer('health').notNull(),
  attack: integer('attack').notNull(),
  defense: integer('defense').notNull(),
  experience_reward: integer('experience_reward').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const itemsTable = pgTable('items', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  type: itemTypeEnum('type').notNull(),
  rarity: rarityEnum('rarity').notNull(),
  equipment_slot: equipmentSlotEnum('equipment_slot'),
  attack_bonus: integer('attack_bonus'),
  defense_bonus: integer('defense_bonus'),
  health_bonus: integer('health_bonus'),
  required_level: integer('required_level').notNull().default(1),
  market_value: numeric('market_value', { precision: 10, scale: 2 }).notNull().default('0'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const inventoryTable = pgTable('inventory', {
  id: serial('id').primaryKey(),
  character_id: integer('character_id').notNull(),
  item_id: integer('item_id').notNull(),
  quantity: integer('quantity').notNull().default(1),
  is_equipped: boolean('is_equipped').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const professionsTable = pgTable('professions', {
  id: serial('id').primaryKey(),
  character_id: integer('character_id').notNull(),
  type: professionTypeEnum('type').notNull(),
  level: integer('level').notNull().default(1),
  experience: integer('experience').notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const marketListingsTable = pgTable('market_listings', {
  id: serial('id').primaryKey(),
  seller_id: integer('seller_id').notNull(),
  item_id: integer('item_id').notNull(),
  quantity: integer('quantity').notNull(),
  price_per_unit: numeric('price_per_unit', { precision: 10, scale: 2 }).notNull(),
  total_price: numeric('total_price', { precision: 10, scale: 2 }).notNull(),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const chatMessagesTable = pgTable('chat_messages', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull(),
  username: text('username').notNull(),
  message: text('message').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const afkSessionsTable = pgTable('afk_sessions', {
  id: serial('id').primaryKey(),
  character_id: integer('character_id').notNull(),
  start_time: timestamp('start_time').notNull(),
  end_time: timestamp('end_time').notNull(),
  realm: realmTypeEnum('realm').notNull(),
  experience_gained: integer('experience_gained').notNull().default(0),
  items_found: text('items_found').notNull().default('[]'),
  is_completed: boolean('is_completed').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  characters: many(charactersTable),
  chatMessages: many(chatMessagesTable),
}));

export const charactersRelations = relations(charactersTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [charactersTable.user_id],
    references: [usersTable.id],
  }),
  inventory: many(inventoryTable),
  professions: many(professionsTable),
  afkSessions: many(afkSessionsTable),
}));

export const inventoryRelations = relations(inventoryTable, ({ one }) => ({
  character: one(charactersTable, {
    fields: [inventoryTable.character_id],
    references: [charactersTable.id],
  }),
  item: one(itemsTable, {
    fields: [inventoryTable.item_id],
    references: [itemsTable.id],
  }),
}));

export const marketListingsRelations = relations(marketListingsTable, ({ one }) => ({
  seller: one(charactersTable, {
    fields: [marketListingsTable.seller_id],
    references: [charactersTable.id],
  }),
  item: one(itemsTable, {
    fields: [marketListingsTable.item_id],
    references: [itemsTable.id],
  }),
}));

export const professionsRelations = relations(professionsTable, ({ one }) => ({
  character: one(charactersTable, {
    fields: [professionsTable.character_id],
    references: [charactersTable.id],
  }),
}));

export const afkSessionsRelations = relations(afkSessionsTable, ({ one }) => ({
  character: one(charactersTable, {
    fields: [afkSessionsTable.character_id],
    references: [charactersTable.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessagesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [chatMessagesTable.user_id],
    references: [usersTable.id],
  }),
}));

// Export all tables for relation queries
export const tables = {
  users: usersTable,
  characters: charactersTable,
  realms: realmsTable,
  monsters: monstersTable,
  items: itemsTable,
  inventory: inventoryTable,
  professions: professionsTable,
  marketListings: marketListingsTable,
  chatMessages: chatMessagesTable,
  afkSessions: afkSessionsTable,
};
