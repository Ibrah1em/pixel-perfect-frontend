import { createFileRoute } from '@tanstack/react-router';
import { TeacherWorkspace } from '@/components/academy/TeacherWorkspace';
import { academyHead } from '@/components/academy/metadata';
import { getTeacherPage } from '@/lib/teacher-gate.functions';
export const Route = createFileRoute('/teacher')({ loader: () => getTeacherPage(), head:()=>academyHead('لوحة المعلم', 'مساحة المعلم الخاصة في physics.'), component:Teacher });
function Teacher() {
  return <TeacherWorkspace />;
}