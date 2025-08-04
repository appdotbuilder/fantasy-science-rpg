
import { db } from '../db';
import { chatMessagesTable } from '../db/schema';
import { type ChatMessage } from '../schema';
import { desc } from 'drizzle-orm';

export async function getChatMessages(limit: number = 50): Promise<ChatMessage[]> {
  try {
    const results = await db.select()
      .from(chatMessagesTable)
      .orderBy(desc(chatMessagesTable.created_at))
      .limit(limit)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch chat messages:', error);
    throw error;
  }
}
