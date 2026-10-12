import { createFileRoute, redirect } from '@tanstack/react-router';
import { academyHead } from '@/components/academy/metadata';
import { z } from 'zod';
import { examQuery } from '@/lib/exams.queries';
import { PublishedExam } from '@/components/academy/PublishedExam';
export const Route = createFileRoute('/exam')({
  validateSearch: (search: Record<string, unknown>): { id?: string } => { const id = z.string().uuid().safeParse(search['id']); return id.success ? { id: id.data } : {}; },
  loaderDeps: ({ search }) => ({ id: search.id }),
  loader: ({ context, deps }) => { if (!deps.id) throw redirect({ to: '/' }); return context.queryClient.ensureQueryData(examQuery(deps.id)); },
  head: ({ loaderData }) => academyHead(loaderData?.title || 'بيئة الاختبار التفاعلي', 'امتحان physics وأسئلة الفيزياء التفاعلية.'), component: Exam,
});
function Exam() { const { id } = Route.useSearch(); return id ? <PublishedExam key={id} id={id} /> : null; }