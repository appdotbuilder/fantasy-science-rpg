
import { db } from '../db';
import { chatMessagesTable, usersTable } from '../db/schema';
import { type SendChatMessageInput, type ChatMessage } from '../schema';
import { eq } from 'drizzle-orm';

export async function sendChatMessage(input: SendChatMessageInput): Promise<ChatMessage> {
  try {
    // First, get the username for the user_id
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (user.length === 0) {
      throw new Error(`User with id ${input.user_id} not found`);
    }

    // Insert the chat message with the username
    const result = await db.insert(chatMessagesTable)
      .values({
        user_id: input.user_id,
        username: user[0].username,
        message: input.message
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Chat message creation failed:', error);
    throw error;
  }
}
