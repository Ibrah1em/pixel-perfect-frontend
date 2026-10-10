import { createFileRoute } from '@tanstack/react-router';
import { AcademyPage } from '@/components/academy/AcademyPage';
import { academyHead } from '@/components/academy/metadata';
export const Route = createFileRoute('/questions')({ head:()=>academyHead('بنك الأسئلة', 'بنك المسائل والتدريبات الفيزيائية والاختبارات الأكاديمية.'), component:Questions });
function Questions() { return <AcademyPage page="student" questionBank />; }