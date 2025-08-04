
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, chatMessagesTable } from '../db/schema';
import { getChatMessages } from '../handlers/get_chat_messages';

describe('getChatMessages', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no messages exist', async () => {
    const result = await getChatMessages();
    expect(result).toEqual([]);
  });

  it('should return chat messages ordered by most recent first', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create messages with different timestamps
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    const twoMinutesAgo = new Date(now.getTime() - 120000);

    await db.insert(chatMessagesTable).values([
      {
        user_id: userId,
        username: 'testuser',
        message: 'First message',
        created_at: twoMinutesAgo
      },
      {
        user_id: userId,
        username: 'testuser',
        message: 'Second message',
        created_at: oneMinuteAgo
      },
      {
        user_id: userId,
        username: 'testuser',
        message: 'Third message',
        created_at: now
      }
    ]).execute();

    const result = await getChatMessages();

    expect(result).toHaveLength(3);
    expect(result[0].message).toEqual('Third message');
    expect(result[1].message).toEqual('Second message');
    expect(result[2].message).toEqual('First message');
    
    // Verify ordering by timestamps
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
  });

  it('should respect the limit parameter', async () => {
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create 5 messages
    const messages = Array.from({ length: 5 }, (_, i) => ({
      user_id: userId,
      username: 'testuser',
      message: `Message ${i + 1}`,
      created_at: new Date(Date.now() + i * 1000) // Each message 1 second apart
    }));

    await db.insert(chatMessagesTable).values(messages).execute();

    const result = await getChatMessages(3);

    expect(result).toHaveLength(3);
    // Should get the 3 most recent messages
    expect(result[0].message).toEqual('Message 5');
    expect(result[1].message).toEqual('Message 4');
    expect(result[2].message).toEqual('Message 3');
  });

  it('should use default limit of 50 when no limit provided', async () => {
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create 10 messages (less than default limit)
    const messages = Array.from({ length: 10 }, (_, i) => ({
      user_id: userId,
      username: 'testuser',
      message: `Message ${i + 1}`
    }));

    await db.insert(chatMessagesTable).values(messages).execute();

    const result = await getChatMessages();

    expect(result).toHaveLength(10);
  });

  it('should return messages with all required fields', async () => {
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    await db.insert(chatMessagesTable).values({
      user_id: userId,
      username: 'testuser',
      message: 'Test message'
    }).execute();

    const result = await getChatMessages();

    expect(result).toHaveLength(1);
    const message = result[0];
    
    expect(message.id).toBeDefined();
    expect(message.user_id).toEqual(userId);
    expect(message.username).toEqual('testuser');
    expect(message.message).toEqual('Test message');
    expect(message.created_at).toBeInstanceOf(Date);
  });
});
