import { createServerFn } from '@tanstack/react-start';
import { useSession, setResponseHeader, getRequestUrl } from '@tanstack/react-start/server';
import { redirect } from '@tanstack/react-router';
import { createHash, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';

export const teacherCredentials = z.object({ username: z.string().min(1).max(100), password: z.string().min(1).max(256) });
function sessionConfig() {
  const password = process.env['SESSION_SECRET'];
  if (!password) throw new Error('Teacher access is unavailable');
  return { password, name: 'physics-teacher', maxAge: 60 * 60 * 4, cookie: { httpOnly: true, secure: getRequestUrl().protocol === 'https:', sameSite: 'lax' as const, path: '/' } };
}
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
  setResponseHeader('Cache-Control', 'no-store');
  const session = await useSession<{ unlocked?: boolean }>(sessionConfig());
  if (!session.data.unlocked) throw redirect({ to: '/' });
  const { default: markup } = await import('@/components/academy/page-2');
  return markup.replaceAll('أكاديمية الفيزياء', 'physics');
});
export const lockTeacher = createServerFn({ method: 'POST' }).handler(async () => {
  const session = await useSession(sessionConfig());
  await session.clear();
  return { ok: true };
});