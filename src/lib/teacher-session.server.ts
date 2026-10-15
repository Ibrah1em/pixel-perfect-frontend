import { useSession, setResponseHeader } from '@tanstack/react-start/server';
import { redirect } from '@tanstack/react-router';
export function sessionConfig() {
  const password = process.env['SESSION_SECRET'];
  if (!password) throw new Error('Teacher access is unavailable');
  return { password, name: 'physics-teacher', maxAge: 60 * 60, cookie: { httpOnly: true, secure: true, sameSite: 'none' as const, partitioned: true, path: '/' } };
}
export async function requireTeacher() {
  setResponseHeader('Cache-Control', 'no-store');
  const session = await useSession<{ unlocked?: boolean }>(sessionConfig());
  if (!session.data.unlocked) throw redirect({ to: '/' });
  return session;
}