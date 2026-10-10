import { createFileRoute } from '@tanstack/react-router';
import { AcademyPage } from '@/components/academy/AcademyPage';
import { academyHead } from '@/components/academy/metadata';
export const Route = createFileRoute('/exams')({ head:()=>academyHead('بوابة الطالب', 'الامتحانات المتاحة والاختبارات الكوانتية ونتائج الطالب.'), component:Exams });
function Exams() { return <AcademyPage page="student" />; }