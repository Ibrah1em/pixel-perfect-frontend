import { createFileRoute } from '@tanstack/react-router';
import { AcademyPage } from '@/components/academy/AcademyPage';
import { academyHead } from '@/components/academy/metadata';
export const Route = createFileRoute('/teacher')({ head:()=>academyHead('لوحة المعلم', 'مقارنة الفصول وإنشاء الاختبارات ورصد درجات طلاب الفيزياء.'), component:Teacher });
function Teacher() { return <AcademyPage page="teacher" />; }