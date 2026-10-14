import { createFileRoute, Link } from '@tanstack/react-router';
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { ArrowRight, Users } from 'lucide-react';
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
  if (!data) return <TeacherShell><h1>الامتحان غير موجود</h1></TeacherShell>;
  const group = selected ? data.classes.find(c => c.key === selected) : undefined;
  return <TeacherShell>
    <div className="editor-heading"><h1>{group ? `فصل ${group.name}` : `درجات الامتحان: ${data.exam.title}`}</h1><Link className="grades-back" aria-label="رجوع" to={group ? '/teacher-grades/$examId' : '/teacher'} params={{ examId }}><ArrowRight size={20} /></Link></div>
    {group ? <div className="grades-table-wrap"><table className="grades-table"><thead><tr><th>#</th><th>اسم الطالب</th><th>الدرجة</th><th></th></tr></thead><tbody>{group.students.map((s, i) => <tr key={s.id}><td>{i + 1}</td><td>{s.name}</td><td dir="ltr">{s.score} / {s.total}</td><td><Link to="/teacher-submission/$id" params={{ id: s.id }}>عرض الإجابات</Link></td></tr>)}</tbody></table></div>
      : data.classes.length === 0 ? <p className="text-muted-foreground">لم يسلّم أي طالب هذا الامتحان بعد</p>
      : <div className="grades-classes">{data.classes.map(c => <Link key={c.key} to="/teacher-grades/$examId" params={{ examId }} search={{ class: c.key }} className="grades-class"><Users size={22} /><strong>{c.name}</strong><span>{c.students.length} طالب</span></Link>)}</div>}
  </TeacherShell>;
}
