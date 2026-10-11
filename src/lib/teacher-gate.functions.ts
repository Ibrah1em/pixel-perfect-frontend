import { createServerFn } from '@tanstack/react-start';
import { useSession, setResponseHeader } from '@tanstack/react-start/server';
import { redirect } from '@tanstack/react-router';
import { createHash, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { sessionConfig, requireTeacher } from './teacher-session.server';

export const teacherCredentials = z.object({ username: z.string().min(1).max(100), password: z.string().min(1).max(256) });
function matches(input: string, expected: string) {
  return timingSafeEqual(createHash('sha256').update(input).digest(), createHash('sha256').update(expected).digest());
}
export const unlockTeacher = createServerFn({ method: 'POST' }).inputValidator((data: unknown) => teacherCredentials.parse(data)).handler(async ({ data }) => {
  setResponseHeader('Cache-Control', 'no-store');
  const username = process.env['TEACHER_USERNAME'];
  const password = process.env['TEACHER_PASSWORD'];
  if (!username || !password) throw new Error('Teacher access is unavailable');
  const validName = matches(data.username, username);
  const validPassword = matches(data.password, password);
  if (!validName || !validPassword) { await new Promise(resolve => setTimeout(resolve, 1000)); return { ok: false }; }
  const session = await useSession<{ unlocked?: boolean }>(sessionConfig());
  await session.update({ unlocked: true });
  return { ok: true };
});
export const getTeacherPage = createServerFn({ method: 'GET' }).handler(async () => {
  await requireTeacher();
  return { allowed: true };
});
export const lockTeacher = createServerFn({ method: 'POST' }).handler(async () => {
  const session = await useSession(sessionConfig());
  await session.clear();
  return { ok: true };
});