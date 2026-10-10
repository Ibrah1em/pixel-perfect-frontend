import { createFileRoute } from '@tanstack/react-router';
import { AcademyPage } from '@/components/academy/AcademyPage';
import { academyHead } from '@/components/academy/metadata';
export const Route = createFileRoute('/exam')({ head:()=>academyHead('بيئة الاختبار التفاعلي', 'امتحان الدوائر الكهربية وقوانين كيرشوف مع الرسوم العلمية ومصفوفة الأسئلة.'), component:Exam });
function Exam() { return <AcademyPage page="exam" />; }