import { createFileRoute } from '@tanstack/react-router';
import { AcademyPage } from '@/components/academy/AcademyPage';
import { academyHead } from '@/components/academy/metadata';
import { getTeacherPage, lockTeacher } from '@/lib/teacher-gate.functions';
import { useServerFn } from '@tanstack/react-start';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
export const Route = createFileRoute('/teacher')({ loader: () => getTeacherPage(), head:()=>academyHead('لوحة المعلم', 'مساحة المعلم الخاصة في physics.'), component:Teacher });
function Teacher() {
  const markup = Route.useLoaderData();
  const lock = useServerFn(lockTeacher);
  const navigate = useNavigate();
  const router = useRouter();
  return <><div className="teacher-session"><Button variant="secondary" onClick={async () => { await lock(); await navigate({ to: '/', replace: true }); await router.invalidate(); }}>تسجيل الخروج</Button></div><AcademyPage page="teacher" markup={markup}/></>;
}