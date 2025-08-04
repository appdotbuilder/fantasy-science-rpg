
import { db } from '../db';
import { professionsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Profession } from '../schema';

export async function getCharacterProfessions(characterId: number): Promise<Profession[]> {
  try {
    const results = await db.select()
      .from(professionsTable)
      .where(eq(professionsTable.character_id, characterId))
      .execute();

    return results.map(profession => ({
      ...profession
    }));
  } catch (error) {
    console.error('Failed to get character professions:', error);
    throw error;
  }
}
