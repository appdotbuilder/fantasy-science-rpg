
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createUserInputSchema,
  loginInputSchema,
  createCharacterInputSchema,
  startAfkInputSchema,
  updateInventoryInputSchema,
  createMarketListingInputSchema,
  sendChatMessageInputSchema,
  realmTypeSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { loginUser } from './handlers/login_user';
import { createCharacter } from './handlers/create_character';
import { getCharacter } from './handlers/get_character';
import { getUserCharacters } from './handlers/get_user_characters';
import { startAfkSession } from './handlers/start_afk_session';
import { completeAfkSession } from './handlers/complete_afk_session';
import { getRealms } from './handlers/get_realms';
import { getRealmMonsters } from './handlers/get_realm_monsters';
import { getCharacterInventory } from './handlers/get_character_inventory';
import { updateInventory } from './handlers/update_inventory';
import { getCharacterProfessions } from './handlers/get_character_professions';
import { createMarketListing } from './handlers/create_market_listing';
import { getMarketListings } from './handlers/get_market_listings';
import { purchaseMarketItem } from './handlers/purchase_market_item';
import { sendChatMessage } from './handlers/send_chat_message';
import { getChatMessages } from './handlers/get_chat_messages';
import { getItems } from './handlers/get_items';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User management
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  loginUser: publicProcedure
    .input(loginInputSchema)
    .mutation(({ input }) => loginUser(input)),

  // Character management
  createCharacter: publicProcedure
    .input(createCharacterInputSchema)
    .mutation(({ input }) => createCharacter(input)),

  getCharacter: publicProcedure
    .input(z.object({ characterId: z.number() }))
    .query(({ input }) => getCharacter(input.characterId)),

  getUserCharacters: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getUserCharacters(input.userId)),

  // AFK system
  startAfkSession: publicProcedure
    .input(startAfkInputSchema)
    .mutation(({ input }) => startAfkSession(input)),

  completeAfkSession: publicProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(({ input }) => completeAfkSession(input.sessionId)),

  // Game world
  getRealms: publicProcedure
    .query(() => getRealms()),

  getRealmMonsters: publicProcedure
    .input(z.object({ realm: realmTypeSchema }))
    .query(({ input }) => getRealmMonsters(input.realm)),

  getItems: publicProcedure
    .query(() => getItems()),

  // Inventory system
  getCharacterInventory: publicProcedure
    .input(z.object({ characterId: z.number() }))
    
    .query(({ input }) => getCharacterInventory(input.characterId)),

  updateInventory: publicProcedure
    .input(updateInventoryInputSchema)
    .mutation(({ input }) => updateInventory(input)),

  // Professions
  getCharacterProfessions: publicProcedure
    .input(z.object({ characterId: z.number() }))
    .query(({ input }) => getCharacterProfessions(input.characterId)),

  // Market system
  createMarketListing: publicProcedure
    .input(createMarketListingInputSchema)
    .mutation(({ input }) => createMarketListing(input)),

  getMarketListings: publicProcedure
    .query(() => getMarketListings()),

  purchaseMarketItem: publicProcedure
    .input(z.object({ listingId: z.number(), buyerId: z.number() }))
    .mutation(({ input }) => purchaseMarketItem(input.listingId, input.buyerId)),

  // Chat system
  sendChatMessage: publicProcedure
    .input(sendChatMessageInputSchema)
    .mutation(({ input }) => sendChatMessage(input)),

  getChatMessages: publicProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(({ input }) => getChatMessages(input.limit)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`RPG Game TRPC server listening at port: ${port}`);
}

start();
