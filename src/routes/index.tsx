import { createFileRoute } from "@tanstack/react-router";
import { ExamsPage } from '@/components/academy/ExamsPage';
import { academyHead } from '@/components/academy/metadata';
import { examsQuery } from '@/lib/exams.queries';
export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(examsQuery()),
  head: () => academyHead('الامتحانات', 'امتحانات physics في الكهرباء والمغناطيسية والفيزياء الحديثة.'),
  component: Index,
});
function Index() {
  return <ExamsPage />;
}
