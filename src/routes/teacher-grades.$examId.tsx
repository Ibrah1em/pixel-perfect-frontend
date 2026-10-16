import { createFileRoute, Link } from '@tanstack/react-router';
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { ArrowRight, Download, LoaderCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadGradesPdf } from '@/lib/grades-pdf';
import { z } from 'zod';
import { TeacherShell } from '@/components/academy/TeacherWorkspace';
import { academyHead } from '@/components/academy/metadata';
import { getExamGrades } from '@/lib/grades.functions';

const gradesQuery = (examId: string) => queryOptions({ queryKey: ['exam-grades', examId], queryFn: () => getExamGrades({ data: { examId } }), staleTime: 0 });

export const Route = createFileRoute('/teacher-grades/$examId')({
  validateSearch: (s: Record<string, unknown>): { class?: string } => { const c = z.string().max(100).safeParse(s['class']); return c.success ? { class: c.data } : {}; },
  loader: ({ context, params }) => context.queryClient.ensureQueryData(gradesQuery(params.examId)),
  head: ({ loaderData }) => academyHead(`درجات الامتحان ${loaderData?.exam.title ?? ''}`.trim(), 'درجات الطلاب مقسمة حسب الفصول.'),
  component: Grades,
});

function Grades() {
  const { examId } = Route.useParams();
  const { class: selected } = Route.useSearch();
  const { data } = useSuspenseQuery(gradesQuery(examId));
  const report = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  if (!data) return <TeacherShell><h1>الامتحان غير موجود</h1></TeacherShell>;
  const group = selected ? data.classes.find(c => c.key === selected) : undefined;
  const pdfClasses = group ? [group] : data.classes;
  async function savePdf() {
    if (!report.current || busy || !data) return;
    setBusy(true);
    try { await downloadGradesPdf(report.current, `درجات ${data.exam.title}${group ? ` - ${group.name}` : ''}.pdf`.replace(/[\\/:*?"<>|]/g, '-')); }
    catch { window.alert('تعذر تجهيز ملف PDF، حاول مرة أخرى'); }
    finally { setBusy(false); }
  }
  return <TeacherShell>
    <div className="editor-heading"><h1>{group ? `فصل ${group.name}` : `درجات الامتحان: ${data.exam.title}`}</h1><Link className="grades-back" aria-label="رجوع" to={group ? '/teacher-grades/$examId' : '/teacher'} params={{ examId }}><ArrowRight size={20} /></Link></div>
    {data.classes.length > 0 && <Button type="button" variant="outline" className="grades-pdf-btn" disabled={busy} onClick={savePdf}>{busy ? <LoaderCircle size={18} className="animate-spin" /> : <Download size={18} />}{busy ? 'جارٍ تجهيز الملف' : 'تحميل الدرجات PDF'}</Button>}
    <div ref={report} className="grades-report" aria-hidden="true" dir="rtl">
      <div data-pdf-block className="grades-report-head"><h1>درجات الامتحان: {data.exam.title}</h1><p>عدد الطلاب: {pdfClasses.reduce((n, c) => n + c.students.length, 0)} — عدد الفصول: {pdfClasses.length}</p></div>
      {pdfClasses.map(c => <section data-pdf-block key={c.key} className="grades-report-class"><h2>فصل {c.name} <span>({c.students.length} طالب)</span></h2><table><thead><tr><th>#</th><th>اسم الطالب</th><th>الدرجة</th><th>النسبة</th></tr></thead><tbody>{c.students.map((s, i) => <tr key={s.id}><td>{i + 1}</td><td>{s.name}</td><td dir="ltr">{s.score} / {s.total}</td><td dir="ltr">{s.total ? Math.round((s.score / s.total) * 100) : 0}%</td></tr>)}</tbody></table></section>)}
    </div>
    {group ? <div className="grades-table-wrap"><table className="grades-table"><thead><tr><th>#</th><th>اسم الطالب</th><th>الدرجة</th><th></th></tr></thead><tbody>{group.students.map((s, i) => <tr key={s.id}><td>{i + 1}</td><td>{s.name}</td><td dir="ltr">{s.score} / {s.total}</td><td><Link to="/teacher-submission/$id" params={{ id: s.id }}>عرض الإجابات</Link></td></tr>)}</tbody></table></div>
      : data.classes.length === 0 ? <p className="text-muted-foreground">لم يسلّم أي طالب هذا الامتحان بعد</p>
      : <div className="grades-classes">{data.classes.map(c => <Link key={c.key} to="/teacher-grades/$examId" params={{ examId }} search={{ class: c.key }} className="grades-class"><Users size={22} /><strong>{c.name}</strong><span>{c.students.length} طالب</span></Link>)}</div>}
  </TeacherShell>;
}
