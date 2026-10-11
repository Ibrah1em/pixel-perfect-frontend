import { createFileRoute } from '@tanstack/react-router';
import { TeacherWorkspace } from '@/components/academy/TeacherWorkspace';
import { getTeacherPage } from '@/lib/teacher-gate.functions';
import { academyHead } from '@/components/academy/metadata';
export const Route = createFileRoute('/teacher-create')({ loader: () => getTeacherPage(), head: () => academyHead('إنشاء الامتحان', 'إنشاء امتحان physics في مساحة المعلم الخاصة.'), component: () => <TeacherWorkspace editor /> });