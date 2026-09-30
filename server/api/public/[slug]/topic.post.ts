import { db } from '#server/database';
import { classes, schedules } from '#server/database/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const topicSchema = z.object({
  scheduleId: z.string().min(1),
  topicTitle: z.string().min(3, 'Judul topik minimal 3 karakter').max(200)
});

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug');
  const body = await readBody(event);
  const parsed = topicSchema.safeParse(body);

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Input tidak valid'
    });
  }

  const classList = await db.select().from(classes).where(eq(classes.slug, slug!));
  if (classList.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Kelas tidak ditemukan' });
  }
  const cls = classList[0];

  const updated = await db
    .update(schedules)
    .set({ topicTitle: parsed.data.topicTitle.trim() })
    .where(and(eq(schedules.id, parsed.data.scheduleId), eq(schedules.classId, cls.id)))
    .returning();

  if (updated.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Jadwal tidak ditemukan' });
  }

  return { success: true, topicTitle: updated[0].topicTitle };
});
