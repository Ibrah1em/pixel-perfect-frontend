import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { ArrowLeft, LockKeyhole, X, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { teacherCredentials, unlockTeacher } from '@/lib/teacher-gate.functions';
import { PhysicsMotion } from './PhysicsMotion';

const exams = [
  'امتحان شامل: التيار الكهربي وقانون أوم وقوانين كيرشوف',
  'اختبار تجريبي: التأثير المغناطيسي وأجهزة القياس',
  'امتحان فيزياء حديثة: ظاهرة كومتون وإشعاع الجسم الأسود',
  'امتحان نصف الفصل: الحث الكهرومغناطيسي',
];
export function ExamsPage() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const unlock = useServerFn(unlockTeacher);
  const navigate = useNavigate();
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
  return <div className="physics-home">
    <PhysicsMotion/>
    <header className="physics-header"><Link to="/" className="physics-brand"><img src="/__l5e/assets-v1/08c65279-5f97-436d-9530-a21669217411/image-0.png" alt="" width="44" height="44" /><span dir="ltr">physics</span></Link></header>
    <main className="physics-main">
      <div className="physics-title"><h1>الامتحانات</h1><svg className="physics-wave" viewBox="0 0 160 40" aria-hidden="true"><path d="M0 20 Q10 0 20 20 T40 20 T60 20 T80 20 T100 20 T120 20 T140 20 T160 20" /></svg></div>
      <div className="physics-exams">{exams.map((title, index) => <article className="physics-exam" key={title}>
        <div className="physics-exam-art" aria-hidden="true"><svg viewBox="0 0 120 100"><g className={`physics-diagram diagram-${index}`}>
          {index === 0 ? <><path d="M20 50H40l5-10 10 20 10-20 10 20 5-10h20M20 50V20h80v30M20 50v30h35m10 0h35V50M55 70v20m10-25v30"/><path className="physics-current" d="M20 20h80v60H20Z"/></> : index === 1 ? <><path d="M20 80V25q0-10 10-10h15v35H30v30M100 80V25q0-10-10-10H75v35h15v30"/><path className="physics-current" d="M45 25h30M45 35h30M45 45h30"/></> : index === 2 ? <><ellipse cx="60" cy="50" rx="44" ry="17"/><ellipse cx="60" cy="50" rx="44" ry="17" transform="rotate(60 60 50)"/><ellipse cx="60" cy="50" rx="44" ry="17" transform="rotate(120 60 50)"/><circle cx="60" cy="50" r="5"/></> : <><path d="M10 50h20c0-45 14-45 14 0s14 45 14 0 14-45 14 0 14 45 14 0h24"/><path className="physics-current" d="M10 50h100"/></>}
        </g><circle className="diagram-signal" r="3"><animateMotion dur={`${3 + index}s`} repeatCount="indefinite" path={index === 0 ? 'M20 20H100V80H20Z' : index === 1 ? 'M45 25H75V45H45Z' : index === 2 ? 'M16 50a44 17 0 1 0 88 0a44 17 0 1 0 -88 0' : 'M10 50H110'}/></circle></svg></div>
        <h2>{title}</h2><Button asChild className="physics-start"><Link to="/exam">ابدأ الامتحان<ArrowLeft size={17}/></Link></Button>
      </article>)}</div>
    </main>
    <footer className="physics-footer"><Button variant="ghost" onClick={() => { setError(''); setOpen(true); }}><LockKeyhole size={16}/>لوحة المعلم</Button></footer>
    <dialog className="physics-login" ref={dialog} onCancel={() => setOpen(false)} onClose={() => setOpen(false)}>
      <div className="flex items-center justify-between mb-7"><h2 className="text-xl font-semibold">لوحة المعلم</h2><Button variant="ghost" size="icon" aria-label="إغلاق" onClick={() => setOpen(false)}><X size={20}/></Button></div>
      {open && <form onSubmit={submit} className="grid gap-5"><label>الاسم<input name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} dir="ltr" required maxLength={100}/></label><label>كلمة المرور<input name="password" type="password" autoComplete="current-password" dir="ltr" required maxLength={256}/></label>{error && <p role="alert" className="text-error text-sm">{error}</p>}<Button type="submit" disabled={pending}>{pending && <LoaderCircle className="animate-spin" size={18}/>}دخول</Button></form>}
    </dialog>
  </div>;
}