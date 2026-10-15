import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { LockKeyhole, X, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { teacherCredentials, unlockTeacher, lockTeacher } from '@/lib/teacher-gate.functions';

export function TeacherLogin() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const unlock = useServerFn(unlockTeacher);
  const navigate = useNavigate();
  const lock = useServerFn(lockTeacher);
  // Leaving to the public page always ends the teacher session, so every visit needs the password again.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { lock().catch(() => {}); }, []);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (open) dialog.current?.showModal(); else dialog.current?.close(); }, [open]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    const parsed = teacherCredentials.safeParse({ username: form.get('username'), password: form.get('password') });
    if (!parsed.success) { setError('أدخل الاسم وكلمة المرور'); return; }
    setPending(true); setError('');
    try {
      const result = await unlock({ data: parsed.data });
      if (!result.ok) setError('الاسم أو كلمة المرور غير صحيحة');
      else { setOpen(false); await navigate({ to: '/teacher' }); }
    } catch { setError('تعذر تسجيل الدخول، حاول مرة أخرى'); }
    finally { setPending(false); }
  }
  return <>
    <Button variant="ghost" onClick={() => { setError(''); setOpen(true); }}><LockKeyhole size={16}/>لوحة المعلم</Button>
    <dialog className="physics-login" ref={dialog} onCancel={() => setOpen(false)} onClose={() => setOpen(false)}>
      <div className="flex items-center justify-between mb-7"><h2 className="text-xl font-semibold">لوحة المعلم</h2><Button variant="ghost" size="icon" aria-label="إغلاق" onClick={() => setOpen(false)}><X size={20}/></Button></div>
      {open && <form autoComplete="off" onSubmit={submit} className="grid gap-5"><label>الاسم<input name="username" autoComplete="off" autoCapitalize="none" spellCheck={false} dir="ltr" required maxLength={100}/></label><label>كلمة المرور<input name="password" type="password" autoComplete="new-password" dir="ltr" required maxLength={256}/></label>{error && <p role="alert" className="text-error text-sm">{error}</p>}<Button type="submit" disabled={pending}>{pending && <LoaderCircle className="animate-spin" size={18}/>}دخول</Button></form>}
    </dialog>
  </>;
}
