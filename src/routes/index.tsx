import { createFileRoute } from "@tanstack/react-router";
import { AcademyPage } from '@/components/academy/AcademyPage';
import { academyHead } from '@/components/academy/metadata';
export const Route = createFileRoute("/")({
  head: () => academyHead('تسجيل الدخول السريع', 'بوابة دخول الطلاب والمعلمين إلى معمل الفيزياء والاختبارات التفاعلية.'),
  component: Index,
});
function Index() {
  return <AcademyPage page="login" />;
}
