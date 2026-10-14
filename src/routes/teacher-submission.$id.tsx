import { createFileRoute, Link } from '@tanstack/react-router';
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { ArrowRight, Check, X } from 'lucide-react';
import { TeacherShell } from '@/components/academy/TeacherWorkspace';
import { academyHead } from '@/components/academy/metadata';
import { getSubmission } from '@/lib/grades.functions';

const submissionQuery = (id: string) => queryOptions({ queryKey: ['submission', id], queryFn: () => getSubmission({ data: { id } }), staleTime: 60_000 });

export const Route = createFileRoute('/teacher-submission/$id')({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(submissionQuery(params.id)),
  head: ({ loaderData }) => academyHead(loaderData ? `إجابات ${loaderData.student}` : 'إجابات الطالب', 'ورقة إجابة الطالب مصححة.'),
  component: Submission,
});

function Submission() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(submissionQuery(id));
  if (!data) return <TeacherShell><h1>الورقة غير موجودة</h1></TeacherShell>;
  return <TeacherShell>
    <div className="editor-heading"><div><h1>{data.student}</h1><p className="text-muted-foreground mt-2">{data.examTitle} • فصل {data.className}{data.timedOut ? ' • انتهى الوقت' : ''}</p></div><Link className="grades-back" aria-label="رجوع" to="/teacher-grades/$examId" params={{ examId: data.examId }} search={{ class: data.classKey }}><ArrowRight size={20} /></Link></div>
    <p className="submission-score" dir="ltr">{data.score} / {data.total}</p>
    <div className="student-questions">{data.questions.map((q, i) => { const right = q.chosen === q.correct; return <article key={q.id} className={`student-question ${right ? 'is-right' : 'is-wrong'}`}>
      <div className="flex items-center justify-between"><h2>السؤال {i + 1}</h2><span className={right ? 'mark-right' : 'mark-wrong'}>{right ? q.marks : 0} / {q.marks}</span></div>
      <p>{q.text}</p>{q.imageUrl && <img src={q.imageUrl} alt={`صورة السؤال ${i + 1}`} loading="lazy" decoding="async" />}
      <div className="student-options">{q.options.map((o, oi) => <div key={oi} className={`review-option ${oi === q.correct ? 'is-correct' : ''} ${oi === q.chosen && oi !== q.correct ? 'is-chosen-wrong' : ''}`}>{oi === q.correct ? <Check size={18} /> : oi === q.chosen ? <X size={18} /> : <span className="w-[18px]" />}<span>{o}</span>{oi === q.chosen && <small>إجابة الطالب</small>}</div>)}</div>
      {q.chosen === null && <p className="mark-wrong text-sm">لم يُجب</p>}
    </article>; })}</div>
  </TeacherShell>;
}
