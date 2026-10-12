import { Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TeacherLogin } from './TeacherLogin';
import { PhysicsMotion } from './PhysicsMotion';
import { useSuspenseQuery } from '@tanstack/react-query';
import { examsQuery } from '@/lib/exams.queries';

export function ExamsPage() {
  const { data: published } = useSuspenseQuery(examsQuery());
  const displayedExams = [...published.map(exam => ({ id: exam.id, title: exam.title }))];
  return <div className="physics-home">
    <PhysicsMotion/>
    <header className="physics-header"><Link to="/" className="physics-brand"><img src="/__l5e/assets-v1/08c65279-5f97-436d-9530-a21669217411/image-0.png" alt="" width="44" height="44" /><span dir="ltr">physics</span></Link></header>
    <main className="physics-main">
      <div className="physics-title"><h1>الامتحانات</h1><svg className="physics-wave" viewBox="0 0 160 40" aria-hidden="true"><path d="M0 20 Q10 0 20 20 T40 20 T60 20 T80 20 T100 20 T120 20 T140 20 T160 20" /></svg></div>
      {displayedExams.length === 0 && <p className="text-muted-foreground">لا توجد امتحانات حالياً</p>}<div className="physics-exams">{displayedExams.map(({ title, id }, position) => { const index = position % 4; return <article className="physics-exam" key={id}>
        <div className="physics-exam-art" aria-hidden="true"><svg viewBox="0 0 120 100"><g className={`physics-diagram diagram-${index}`}>
          {index === 0 ? <><path d="M20 50H40l5-10 10 20 10-20 10 20 5-10h20M20 50V20h80v30M20 50v30h35m10 0h35V50M55 70v20m10-25v30"/><path className="physics-current" d="M20 20h80v60H20Z"/></> : index === 1 ? <><path d="M20 80V25q0-10 10-10h15v35H30v30M100 80V25q0-10-10-10H75v35h15v30"/><path className="physics-current" d="M45 25h30M45 35h30M45 45h30"/></> : index === 2 ? <><ellipse cx="60" cy="50" rx="44" ry="17"/><ellipse cx="60" cy="50" rx="44" ry="17" transform="rotate(60 60 50)"/><ellipse cx="60" cy="50" rx="44" ry="17" transform="rotate(120 60 50)"/><circle cx="60" cy="50" r="5"/></> : <><path d="M10 50h20c0-45 14-45 14 0s14 45 14 0 14-45 14 0 14 45 14 0h24"/><path className="physics-current" d="M10 50h100"/></>}
        </g><circle className="diagram-signal" r="3"><animateMotion dur={`${3 + index}s`} repeatCount="indefinite" path={index === 0 ? 'M20 20H100V80H20Z' : index === 1 ? 'M45 25H75V45H45Z' : index === 2 ? 'M16 50a44 17 0 1 0 88 0a44 17 0 1 0 -88 0' : 'M10 50H110'}/></circle></svg></div>
        <h2>{title}</h2><Button asChild className="physics-start">{id.startsWith('demo-') ? <Link to="/exam">ابدأ الامتحان<ArrowLeft size={17}/></Link> : <Link to="/exam" search={{ id }}>ابدأ الامتحان<ArrowLeft size={17}/></Link>}</Button>
      </article>; })}</div>
    </main>
    <footer className="physics-footer"><TeacherLogin/></footer>
  </div>;
}