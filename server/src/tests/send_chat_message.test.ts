
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { chatMessagesTable, usersTable } from '../db/schema';
import { type SendChatMessageInput } from '../schema';
import { sendChatMessage } from '../handlers/send_chat_message';
import { eq } from 'drizzle-orm';

describe('sendChatMessage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;

  beforeEach(async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        membership_type: 'free'
      })
      .returning()
      .execute();

    testUserId = userResult[0].id;
  });

  it('should create a chat message', async () => {
    const testInput: SendChatMessageInput = {
      user_id: testUserId,
      message: 'Hello, world!'
    };

    const result = await sendChatMessage(testInput);

    expect(result.id).toBeDefined();
    expect(result.user_id).toEqual(testUserId);
    expect(result.username).toEqual('testuser');
    expect(result.message).toEqual('Hello, world!');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save chat message to database', async () => {
    const testInput: SendChatMessageInput = {
      user_id: testUserId,
      message: 'Test message in database'
    };

    const result = await sendChatMessage(testInput);

    const messages = await db.select()
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.id, result.id))
      .execute();

    expect(messages).toHaveLength(1);
    expect(messages[0].user_id).toEqual(testUserId);
    expect(messages[0].username).toEqual('testuser');
    expect(messages[0].message).toEqual('Test message in database');
    expect(messages[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent user', async () => {
    const testInput: SendChatMessageInput = {
      user_id: 99999,
      message: 'This should fail'
    };

    expect(sendChatMessage(testInput)).rejects.toThrow(/User with id 99999 not found/i);
  });

  it('should handle long messages correctly', async () => {
    const longMessage = 'A'.repeat(500); // Maximum allowed length
    const testInput: SendChatMessageInput = {
      user_id: testUserId,
      message: longMessage
    };

    const result = await sendChatMessage(testInput);

    expect(result.message).toEqual(longMessage);
    expect(result.message.length).toEqual(500);
  });
});
