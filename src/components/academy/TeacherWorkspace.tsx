import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { examsQuery } from '@/lib/exams.queries';
import { ArrowRight, BarChart3, Check, Home, ImagePlus, LoaderCircle, Plus, Trash2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PhysicsMotion } from './PhysicsMotion';
import { examSchema, type QuestionDraft } from '@/lib/exam-schemas';
import { publishExam, uploadQuestionImage, deleteExam } from '@/lib/exams.functions';
import { optimizeQuestionImage } from '@/lib/optimize-image';

export function TeacherShell({ children }: { children: ReactNode }) {
  return <div className="physics-home teacher-workspace"><PhysicsMotion />
    <aside className="teacher-sidebar">
      <Link to="/teacher" className="physics-brand"><img src="/__l5e/assets-v1/08c65279-5f97-436d-9530-a21669217411/image-0.png" alt="" width="44" height="44" /><span dir="ltr">physics</span></Link>
      <nav aria-label="صفحات المعلم"><Button type="button" variant="ghost" asChild><Link to="/"><Home size={18} />الصفحة الرئيسية</Link></Button><Button type="button" variant="ghost" asChild><Link to="/teacher"><span className="teacher-nav-dot" />لوحة المعلم</Link></Button></nav>
    </aside>
    <div className="teacher-content"><header className="teacher-topbar"><span>لوحة المعلم</span></header><main className="teacher-main">{children}</main></div>
  </div>;
}

export function TeacherWorkspace({ editor = false }: { editor?: boolean }) {
  if (editor) return <TeacherShell><ExamEditor /></TeacherShell>;
  return <TeacherShell><TeacherHome /></TeacherShell>;
}

function TeacherHome() {
  const { data: exams } = useSuspenseQuery(examsQuery());
  const remove = useServerFn(deleteExam);
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState('');
  async function onDelete(id: string, title: string) {
    if (deleting || !window.confirm(`حذف امتحان "${title}" نهائياً مع كل درجاته؟`)) return;
    setDeleting(id);
    try { await remove({ data: { id } }); await queryClient.invalidateQueries({ queryKey: ['published-exams'] }); }
    catch { window.alert('تعذر حذف الامتحان، حاول مرة أخرى'); }
    finally { setDeleting(''); }
  }
  return <>
    <div className="teacher-create"><h1>إنشاء اختبار</h1><Button asChild><Link to="/teacher-create"><Plus size={18} />إنشاء اختبار</Link></Button></div>
    {exams.length > 0 && <section className="teacher-grades-list"><h2>درجات الامتحانات</h2>{exams.map(e => <div key={e.id} className="grades-exam-row"><Link to="/teacher-grades/$examId" params={{ examId: e.id }} className="grades-exam-link"><BarChart3 size={20} /><span>درجات الامتحان</span><strong>{e.title}</strong></Link><Button type="button" variant="ghost" size="icon" title="حذف الامتحان" aria-label={`حذف امتحان ${e.title}`} disabled={deleting === e.id} onClick={() => onDelete(e.id, e.title)}>{deleting === e.id ? <LoaderCircle size={18} className="animate-spin" /> : <Trash2 size={18} />}</Button></div>)}</section>}
  </>;
}

type EditorQuestion = QuestionDraft & { localId: string; preview: string | null };
const newQuestion = (): EditorQuestion => ({ localId: crypto.randomUUID(), text: '', marks: 2, imagePath: null, options: ['', '', '', ''], correctIndex: -1, preview: null });
function ExamEditor() {
  const [examId, setExamId] = useState('');
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(60);
  const [count, setCount] = useState(1);
  const [questions, setQuestions] = useState<EditorQuestion[]>([{ localId: 'initial-question', text: '', marks: 2, imagePath: null, options: ['', '', '', ''], correctIndex: -1, preview: null }]);
  const [uploading, setUploading] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const previews = useRef(new Set<string>());
  const upload = useServerFn(uploadQuestionImage);
  const publish = useServerFn(publishExam);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  useEffect(() => { setExamId(crypto.randomUUID()); const urls = previews.current; return () => urls.forEach(url => URL.revokeObjectURL(url)); }, []);
  const patchQuestion = (id: string, patch: Partial<EditorQuestion>) => setQuestions(qs => qs.map(q => q.localId === id ? { ...q, ...patch } : q));
  async function selectImage(event: ChangeEvent<HTMLInputElement>, question: EditorQuestion) {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file || uploading.includes(question.localId)) return;
    setUploading(ids => [...ids, question.localId]); setError('');
    try {
      const optimized = await optimizeQuestionImage(file);
      const form = new FormData(); form.set('examId', examId); form.set('image', optimized);
      const result = await upload({ data: form });
      const preview = URL.createObjectURL(optimized); previews.current.add(preview);
      if (question.preview) { URL.revokeObjectURL(question.preview); previews.current.delete(question.preview); }
      patchQuestion(question.localId, { imagePath: result.path, preview });
    } catch (err) { setError(err instanceof Error ? err.message : 'تعذر رفع الصورة، حاول مرة أخرى'); }
    finally { setUploading(ids => ids.filter(id => id !== question.localId)); }
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); if (pending || uploading.length) return;
    const parsed = examSchema.safeParse({ id: examId, title, duration, questionCount: count, questions });
    if (!parsed.success) {
      const issue = parsed.error.issues[0]; const index = issue?.path[0] === 'questions' && typeof issue.path[1] === 'number' ? issue.path[1] + 1 : null;
      setError(index ? `السؤال ${index}: أكمل النص والإجابات وحدد الإجابة الصحيحة والدرجة` : issue?.message || 'راجع بيانات الامتحان'); return;
    }
    setPending(true); setError('');
    try { await publish({ data: parsed.data }); await queryClient.invalidateQueries({ queryKey: ['published-exams'] }); await navigate({ to: '/' }); }
    catch { setError('تعذر رفع الامتحان، بياناتك ما زالت موجودة، حاول مرة أخرى'); }
    finally { setPending(false); }
  }
  return <div className="exam-editor"><div className="editor-heading"><h1>إنشاء الامتحان</h1><Button type="button" variant="ghost" size="icon" title="العودة للوحة المعلم" aria-label="العودة للوحة المعلم" asChild><Link to="/teacher"><ArrowRight size={20} /></Link></Button></div>
    <form onSubmit={submit} className="editor-form"><fieldset disabled={pending}>
      <section className="exam-settings"><label className="exam-title-field">عنوان الامتحان<input value={title} onChange={e => setTitle(e.target.value)} maxLength={200} required placeholder="عنوان الامتحان" /></label><label>المدة (دقيقة)<input type="number" min={1} max={300} required value={duration} onChange={e => setDuration(Number(e.target.value))} /></label><label>عدد الأسئلة<input type="number" min={1} max={100} required value={count} onChange={e => setCount(Number(e.target.value))} /></label></section>
      <div className="editor-question-list">{questions.map((q, index) => <article className="editor-question" key={q.localId}>
        <div className="question-heading"><h2>السؤال {index + 1}</h2><div className="question-tools"><label className="marks-field">درجة السؤال<input type="number" min={0.5} max={100} step={0.5} required value={q.marks} onChange={e => patchQuestion(q.localId, { marks: Number(e.target.value) })} /></label><Button type="button" variant="ghost" size="icon" title="حذف السؤال" aria-label={`حذف السؤال ${index + 1}`} disabled={questions.length === 1 || uploading.includes(q.localId)} onClick={() => setQuestions(qs => qs.filter(item => item.localId !== q.localId))}><Trash2 size={18} /></Button></div></div>
        <label>نص السؤال<textarea value={q.text} onChange={e => patchQuestion(q.localId, { text: e.target.value })} maxLength={4000} required rows={4} placeholder="اكتب نص السؤال" /></label>
        <div className="question-image-area">{q.preview && <figure><img src={q.preview} alt={`صورة السؤال ${index + 1}`} decoding="async" /><Button type="button" variant="secondary" size="icon" title="حذف الصورة" aria-label={`حذف صورة السؤال ${index + 1}`} onClick={() => { if (q.preview) { URL.revokeObjectURL(q.preview); previews.current.delete(q.preview); } patchQuestion(q.localId, { imagePath: null, preview: null }); }}><X size={16} /></Button></figure>}
          <Button type="button" variant="outline" disabled={uploading.includes(q.localId)} asChild><label className="image-upload-control">{uploading.includes(q.localId) ? <LoaderCircle size={18} className="animate-spin" /> : <ImagePlus size={18} />}{uploading.includes(q.localId) ? 'جارٍ رفع الصورة' : q.preview ? 'تغيير الصورة' : 'رفع صورة للمسألة'}<input aria-label={`صورة السؤال ${index + 1}`} type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading.includes(q.localId)} onChange={e => selectImage(e, q)} /></label></Button>
        </div>
        <fieldset className="answer-options"><legend>الإجابات</legend>{q.options.map((option, optionIndex) => <div className={`editor-answer ${q.correctIndex === optionIndex ? 'correct-answer' : ''}`} key={optionIndex}>
          <label className="correct-choice" title="الإجابة الصحيحة"><input type="radio" name={`correct-${q.localId}`} checked={q.correctIndex === optionIndex} onChange={() => patchQuestion(q.localId, { correctIndex: optionIndex })} aria-label={`الإجابة ${optionIndex + 1} صحيحة للسؤال ${index + 1}`} /><span>{q.correctIndex === optionIndex ? <Check size={16} /> : optionIndex + 1}</span></label>
          <input aria-label={`إجابة ${optionIndex + 1} للسؤال ${index + 1}`} placeholder={`الإجابة ${optionIndex + 1}`} value={option} required maxLength={500} onChange={e => patchQuestion(q.localId, { options: q.options.map((item, i) => i === optionIndex ? e.target.value : item) })} />
          <Button type="button" variant="ghost" size="icon" title="حذف الإجابة" aria-label={`حذف الإجابة ${optionIndex + 1} للسؤال ${index + 1}`} disabled={q.options.length <= 2} onClick={() => patchQuestion(q.localId, { options: q.options.filter((_, i) => i !== optionIndex), correctIndex: q.correctIndex === optionIndex ? -1 : q.correctIndex > optionIndex ? q.correctIndex - 1 : q.correctIndex })}><X size={16} /></Button>
        </div>)}<Button type="button" variant="ghost" disabled={q.options.length >= 6} onClick={() => patchQuestion(q.localId, { options: [...q.options, ''] })}><Plus size={16} />إضافة إجابة</Button></fieldset>
      </article>)}</div>
      <Button type="button" variant="outline" disabled={questions.length >= 100 || !examId} onClick={() => setQuestions(qs => [...qs, newQuestion()])}><Plus size={18} />إضافة سؤال</Button>
      <div className="editor-publish"><span>{questions.length} / {count} أسئلة · {questions.reduce((sum, q) => sum + (q.marks || 0), 0)} درجة</span><Button type="submit" disabled={pending || uploading.length > 0 || !examId}>{pending ? <LoaderCircle size={18} className="animate-spin" /> : <Upload size={18} />}{pending ? 'جارٍ رفع الامتحان' : 'رفع الامتحان'}</Button></div>
      {error && <p role="alert" className="editor-error">{error}</p>}
    </fieldset></form>
  </div>;
}