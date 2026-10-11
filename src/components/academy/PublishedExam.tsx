import { useEffect, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Clock, LoaderCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { examQuery } from '@/lib/exams.queries';
import { gradeExam } from '@/lib/exams.functions';
import { PhysicsMotion } from './PhysicsMotion';

export function PublishedExam({ id }: { id: string }) {
  const { data: exam } = useSuspenseQuery(examQuery(id));
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [seconds, setSeconds] = useState((exam?.duration_minutes || 60) * 60);
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const grade = useServerFn(gradeExam);
  const deadline = useRef(0);
  useEffect(() => {
    if (result) return;
    if (!deadline.current) deadline.current = Date.now() + (exam?.duration_minutes || 60) * 60000;
    const timer = setInterval(() => setSeconds(Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000))), 1000);
    return () => clearInterval(timer);
  }, [exam?.duration_minutes, result]);
  async function submit() {
    if (pending || result) return;
    setPending(true); setError('');
    try { const value = await grade({ data: { id, answers } }); setResult(value); setConfirm(false); }
    catch { setError('تعذر تسليم الامتحان، حاول مرة أخرى'); }
    finally { setPending(false); }
  }
  const autoSubmitted = useRef(false);
  useEffect(() => { if (seconds === 0 && !autoSubmitted.current) { autoSubmitted.current = true; void submit(); } }, [seconds]);
  return <div className="physics-home"><PhysicsMotion /><header className="physics-header"><Link to="/" className="physics-brand"><img src="/__l5e/assets-v1/08c65279-5f97-436d-9530-a21669217411/image-0.png" alt="" width="44" height="44" /><span dir="ltr">physics</span></Link></header><main className="physics-main">
    {!exam ? <><h1>الامتحان غير موجود</h1><Button asChild><Link to="/">العودة للامتحانات</Link></Button></> : result ? <section className="student-result"><h1>{exam.title}</h1><h2>نتيجة الامتحان</h2><p>{result.score} / {result.total}</p><Button asChild><Link to="/">العودة للامتحانات</Link></Button></section> : <>
      <div className="student-exam-heading"><h1>{exam.title}</h1><div className="exam-clock flex items-center gap-2" aria-label="الوقت المتبقي"><Clock size={20} /><span dir="ltr">{Math.floor(seconds / 60).toString().padStart(2, '0')}:{(seconds % 60).toString().padStart(2, '0')}</span></div></div>
      <div className="student-questions">{exam.questions.map((q, index) => <article className="student-question" key={q.id}><div className="flex items-center justify-between"><h2>السؤال {index + 1}</h2><span className="text-sm text-muted-foreground">{q.marks} درجة</span></div><p>{q.text}</p>{q.imageUrl && <img src={q.imageUrl} alt={`صورة السؤال ${index + 1}`} loading={index === 0 ? 'eager' : 'lazy'} decoding="async" />}
        <div className="student-options">{q.options.map((option, optionIndex) => <label key={optionIndex}><input type="radio" name={q.id} checked={answers[q.id] === optionIndex} disabled={pending || seconds === 0} onChange={() => setAnswers(a => ({ ...a, [q.id]: optionIndex }))} /><span>{option}</span></label>)}</div></article>)}</div>
      <div className="editor-publish"><span>{Object.keys(answers).length} / {exam.questions.length} إجابات</span><Button disabled={pending} onClick={() => setConfirm(true)}><Send size={18} />تسليم الامتحان</Button></div>
    </>}{error && <p role="alert" className="editor-error">{error}</p>}
  </main>{confirm && <div className="academy-dialog" role="dialog" aria-modal="true" aria-label="تسليم الامتحان"><div className="academy-dialog-box"><h2>تأكيد تسليم الامتحان</h2><div className="dialog-actions"><Button onClick={submit} disabled={pending}>{pending && <LoaderCircle size={18} className="animate-spin" />}تسليم وعرض النتيجة</Button><Button variant="secondary" disabled={pending} onClick={() => setConfirm(false)}>متابعة الامتحان</Button></div></div></div>}</div>;
}