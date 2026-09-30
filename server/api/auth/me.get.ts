import { getUserSession } from '#server/utils/auth';

export default defineEventHandler((event) => {
  const session = getUserSession(event);
  if (!session) {
    return { user: null };
  }
  return { user: session };
});
