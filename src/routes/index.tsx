import { createFileRoute } from "@tanstack/react-router";
import { ExamsPage } from '@/components/academy/ExamsPage';
import { academyHead } from '@/components/academy/metadata';
export const Route = createFileRoute("/")({
  head: () => academyHead('الامتحانات', 'امتحانات physics في الكهرباء والمغناطيسية والفيزياء الحديثة.'),
  component: Index,
});
function Index() {
  return <ExamsPage />;
}
