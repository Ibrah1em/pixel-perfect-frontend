import { createFileRoute, redirect } from '@tanstack/react-router';
import { academyHead } from '@/components/academy/metadata';
export const Route = createFileRoute('/exams')({ beforeLoad: () => { throw redirect({ to: '/' }); }, head:()=>academyHead('الامتحانات', 'امتحانات physics المتاحة.') });