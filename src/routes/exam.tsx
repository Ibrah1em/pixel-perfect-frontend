import { createFileRoute } from '@tanstack/react-router';
import { AcademyPage } from '@/components/academy/AcademyPage';
import { academyHead } from '@/components/academy/metadata';
import { z } from 'zod';
import { examQuery } from '@/lib/exams.queries';
import { PublishedExam } from '@/components/academy/PublishedExam';
export const Route = createFileRoute('/exam')({
  validateSearch: (search: Record<string, unknown>): { id?: string } => { const id = z.string().uuid().safeParse(search['id']); return id.success ? { id: id.data } : {}; },
  loaderDeps: ({ search }) => ({ id: search.id }),
  loader: ({ context, deps }) => deps.id ? context.queryClient.ensureQueryData(examQuery(deps.id)) : undefined,
  head: ({ loaderData }) => academyHead(loaderData?.title || 'بيئة الاختبار التفاعلي', 'امتحان physics وأسئلة الفيزياء التفاعلية.'), component: Exam,
});
function Exam() { const { id } = Route.useSearch(); return id ? <PublishedExam key={id} id={id} /> : <AcademyPage page="exam" />; }