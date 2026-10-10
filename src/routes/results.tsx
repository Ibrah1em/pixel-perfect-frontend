import { createFileRoute } from '@tanstack/react-router';
import { AcademyPage } from '@/components/academy/AcademyPage';
import { academyHead } from '@/components/academy/metadata';
export const Route = createFileRoute('/results')({ head:()=>academyHead('نتيجة الامتحان والتحليل', 'تقرير أداء الطالب وتحليل الإجابات والتوصيات العلمية.'), component:Results });
function Results() { return <AcademyPage page="result" />; }