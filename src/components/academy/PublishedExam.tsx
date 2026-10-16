import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { CheckCircle2, ChevronLeft, ChevronRight, Clock, LoaderCircle, LockKeyhole, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { examQuery } from '@/lib/exams.queries';
import { gradeExam, checkExamAdmission } from '@/lib/exams.functions';
import { PhysicsMotion } from './PhysicsMotion';
import { TeacherLogin } from './TeacherLogin';

function shuffle<T>(items: T[]): T[] { const a = [...items]; const r = new Uint32Array(a.length); crypto.getRandomValues(r); for (let i = a.length - 1; i > 0; i--) { const j = r[i]! % (i + 1); [a[i], a[j]] = [a[j]!, a[i]!]; } return a; }
const pad = (n: number) => n.toString().padStart(2, '0');

export function PublishedExam({ id }: { id: string }) {
  const { data: exam } = useSuspenseQuery(examQuery(id));
  const [student, setStudent] = useState<{ name: string; className: string } | null>(null);
  const [entryError, setEntryError] = useState('');
  const [closed, setClosed] = useState(false);
  const [entering, setEntering] = useState(false);
  const admission = useServerFn(checkExamAdmission);
  const [current, setCurrent] = useState(0);
  const [saved, setSaved] = useState<Record<string, number>>({});
  const [choice, setChoice] = useState<number | undefined>(undefined);
  const [seconds, setSeconds] = useState((exam?.duration_minutes || 60) * 60);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [pending, setPending] = useState(false);
  const grade = useServerFn(gradeExam);
  const deadline = useRef(0);
  const savedRef = useRef(saved);
  savedRef.current = saved;
  const submitting = useRef(false);

  useEffect(() => {
    if (!student || done || !exam) return;
    deadline.current = Date.now() + exam.duration_minutes * 60000;
    const timer = setInterval(() => setSeconds(Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000))), 1000);
    return () => clearInterval(timer);
  }, [student, done, exam]);

  // Each student gets a fresh question and answer order; answers are stored by the teacher's original option index.
  const order = useMemo(() => !student || !exam ? [] : shuffle(exam.questions).map(q => ({ ...q, choices: shuffle(q.options.map((text, index) => ({ text, index }))) })), [student, exam]);
  const question = order[current];
  useEffect(() => { if (question) setChoice(savedRef.current[question.id]); setWarning(''); }, [question]);

  async function submit(timedOut: boolean) {
    if (!student || submitting.current || done) return;
    submitting.current = true; setPending(true); setError('');
    try { await grade({ data: { id, studentName: student.name, className: student.className, timedOut, answers: savedRef.current } }); setDone(true); }
    catch { setError('تعذر تسليم الامتحان، حاول مرة أخرى'); submitting.current = false; }
    finally { setPending(false); }
  }
  useEffect(() => { if (student && seconds === 0 && !done) void submit(true); }, [seconds, student, done]);

  async function enter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (entering) return;
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') || '').trim().replace(/\s+/g, ' ');
    const className = String(form.get('className') || '').trim();
    if (name.split(' ').length < 4) { setEntryError('اكتب الاسم رباعي'); return; }
    if (!className) { setEntryError('اكتب اسم الفصل'); return; }
    setEntryError(''); setEntering(true);
    try {
      const result = await admission({ data: { id } });
      if (result.closed) { setClosed(true); return; }
      setStudent({ name, className });
    } catch { setEntryError('تعذر دخول الامتحان، حاول مرة أخرى'); }
    finally { setEntering(false); }
  }

  function saveAndNext() {
    if (!exam || !question) return;
    const next = choice === undefined ? saved : { ...saved, [question.id]: choice };
    if (choice !== undefined) { setSaved(next); savedRef.current = next; }
    if (current < order.length - 1) { setCurrent(current + 1); return; }
    const missing = order.map((q, i) => next[q.id] === undefined ? i + 1 : 0).filter(Boolean);
    if (missing.length) { setWarning(missing.length === 1 ? `لسه في سؤال انت محلتوش: السؤال ${missing[0]}` : `لسه في أسئلة انت محلتهاش: ${missing.join('، ')}`); return; }
    void submit(false);
  }

  const header = <header className="physics-header"><Link to="/" className="physics-brand"><img src="/__l5e/assets-v1/08c65279-5f97-436d-9530-a21669217411/image-0.png" alt="" width="44" height="44" /><span dir="ltr">physics</span></Link><TeacherLogin /></header>;
  if (!exam) return <div className="physics-home"><PhysicsMotion />{header}<main className="physics-main"><h1>الامتحان غير موجود</h1><Button asChild><Link to="/">العودة للامتحانات</Link></Button></main></div>;
  if (!student && (exam.is_closed || closed)) return <div className="physics-home"><PhysicsMotion />{header}<main className="physics-main"><section className="student-result"><LockKeyhole size={48} className="mx-auto text-primary" /><h1>{exam.title}</h1><h2>الامتحان مقفول حاليًا</h2><Button asChild><Link to="/">العودة للامتحانات</Link></Button></section></main></div>;

  const total = order.length || exam.questions.length;
  const answered = Object.keys(saved).length;
  const isLast = current === total - 1;

  return <div className="physics-home"><PhysicsMotion />{header}<main className="physics-main">
    {done ? <section className="student-result"><CheckCircle2 size={56} className="mx-auto text-primary" /><h1>{exam.title}</h1><h2>تم تسليم الامتحان بنجاح</h2><Button asChild><Link to="/">العودة للامتحانات</Link></Button></section>
    : !student ? <form className="student-entry" onSubmit={enter}><h1>{exam.title}</h1><label>الاسم الرباعي<input name="name" required maxLength={200} autoComplete="name" /></label><label>اسم الفصل<input name="className" required maxLength={100} /></label>{entryError && <p role="alert" className="editor-error">{entryError}</p>}<Button type="submit" disabled={entering}>{entering && <LoaderCircle size={18} className="animate-spin" />}دخول الامتحان</Button></form>
    : question && <>
      <div className="student-exam-heading"><h1>{exam.title}</h1><div className="exam-clock flex items-center gap-2" aria-label="الوقت المتبقي"><Clock size={20} /><span dir="ltr">{pad(Math.floor(seconds / 60))}:{pad(seconds % 60)}</span></div></div>
      <div className="exam-progress" aria-label="التقدم"><div className="flex justify-between text-sm text-muted-foreground"><span>التقدم في الورقة</span><span>{answered} / {total}</span></div><div className="exam-progress-bar"><span style={{ width: `${(answered / total) * 100}%` }} /></div></div>
      <article className="student-question" key={question.id}><div className="flex items-center justify-between"><h2>السؤال {current + 1} من {total}</h2><span className="text-sm text-muted-foreground">{question.marks} درجة</span></div><p>{question.text}</p>{question.imageUrl && <img src={question.imageUrl} alt={`صورة السؤال ${current + 1}`} decoding="async" />}
        <div className="student-options">{question.choices.map(c => <label key={c.index}><input type="radio" name={question.id} checked={choice === c.index} disabled={pending || seconds === 0} onChange={() => setChoice(c.index)} /><span>{c.text}</span></label>)}</div>
      </article>
      {warning && <p role="alert" className="editor-error">{warning}</p>}
      <div className="exam-nav"><Button variant="secondary" disabled={current === 0 || pending} onClick={() => setCurrent(current - 1)}><ChevronRight size={18} />السابق</Button><Button disabled={pending || seconds === 0} onClick={saveAndNext}>{pending ? <LoaderCircle size={18} className="animate-spin" /> : isLast ? <Send size={18} /> : null}{isLast ? 'تسليم الامتحان' : 'حفظ والانتقال للتالي'}{!isLast && <ChevronLeft size={18} />}</Button></div>
      <nav className="question-grid" aria-label="مصفوفة الأسئلة">{order.map((q, i) => <button type="button" key={q.id} aria-label={`السؤال ${i + 1}`} aria-current={i === current} className={`${i === current ? 'is-current' : ''} ${saved[q.id] !== undefined ? 'is-saved' : ''}`} onClick={() => setCurrent(i)}>{i + 1}</button>)}</nav>
    </>}
    {error && <p role="alert" className="editor-error">{error}</p>}
  </main></div>;
}
