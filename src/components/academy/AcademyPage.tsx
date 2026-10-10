import { useEffect, useMemo, useRef, useState, type FormEvent, type MouseEvent } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import parse, { attributesToProps, domToReact, Element, type DOMNode, type HTMLReactParserOptions } from 'html-react-parser';
import { Button } from '@/components/ui/button';
import result from './page-1';
import teacher from './page-2';
import login from './page-3';
import exam from './page-4';
import student from './page-5';

const pages = { login, student, exam, result, teacher };
type Page = keyof typeof pages;
const destinations = { 'الرئيسية': '/exams', 'بنك الأسئلة': '/questions', 'لوحة المعلم': '/teacher', 'دخول الطلاب': '/', 'بيئة الاختبار التفاعلي': '/exam' } as const;

export function AcademyPage({ page, questionBank = false }: { page: Page; questionBank?: boolean }) {
  const navigate = useNavigate();
  const root = useRef<HTMLDivElement>(null);
  const [notice, setNotice] = useState('');
  const [question, setQuestion] = useState(4);
  const [answers, setAnswers] = useState<Record<number, string>>({4:'4.0'});
  const [flags, setFlags] = useState<number[]>([3]);
  const [seconds, setSeconds] = useState(24 * 60 + 12);
  const [confirm, setConfirm] = useState(false);
  const [muted, setMuted] = useState(false);
  const notify = (text: string) => setNotice(text);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 4000); return () => clearTimeout(timer); }, [notice]);
  useEffect(() => { if (page !== 'exam') return; const timer = setInterval(() => setSeconds(s => Math.max(0,s-1)),1000); return () => clearInterval(timer); }, [page]);
  useEffect(() => {
    if (page !== 'exam') return;
    const el = root.current;
    if (!el) return;
    for (const span of el.querySelectorAll('span')) {
      if (/^24:12$|^\d{2}:\d{2}$/.test(span.textContent?.trim() || '')) span.textContent = `${Math.floor(seconds / 60).toString().padStart(2,'0')}:${(seconds % 60).toString().padStart(2,'0')}`;
      if (/^السؤال رقم/.test(span.textContent?.trim() || '')) span.textContent = `السؤال رقم ${question}`;
    }
    el.querySelectorAll<HTMLInputElement>('input[name="physics-answer"]').forEach(input => {
      input.checked = answers[question] === input.value;
      input.closest('label')?.classList.toggle('answer-selected', input.checked);
    });
    el.querySelectorAll<HTMLButtonElement>('button').forEach(button => {
      const n = Number(button.textContent?.trim());
      if (n >= 1 && n <= 10) { button.classList.toggle('question-active',n === question); button.classList.toggle('question-flagged',flags.includes(n)); }
    });
  }, [page, question, seconds, answers, flags]);

  const rendered = useMemo(() => {
    const options: HTMLReactParserOptions = { replace(node) {
      if (!(node instanceof Element)) return;
      if (node.name === 'button') {
        const props = attributesToProps(node.attribs);
        return <Button {...props} variant="reference" size={undefined} className={node.attribs['class']} type={(node.attribs['type'] as 'submit' | 'button') || 'button'}>{domToReact(node.children as DOMNode[],options)}</Button>;
      }
      if (node.name === 'a') {
        const text = node.children.map(n => 'data' in n ? n.data : n instanceof Element ? n.children.map(c => 'data' in c ? c.data : '').join('') : '').join('').trim();
        const entry = Object.entries(destinations).find(([label]) => text.includes(label));
        if (entry) return <Link to={entry[1]} className={node.attribs['class']}>{domToReact(node.children as DOMNode[],options)}</Link>;
        return <Button variant="reference" className={node.attribs['class']} onClick={() => notify('الثوابت: c = 3×10⁸ m/s • h = 6.626×10⁻³⁴ J·s • g = 9.8 m/s²')}>{domToReact(node.children as DOMNode[],options)}</Button>;
      }
      if (node.name === 'input') {
        const props = attributesToProps(node.attribs);
        const { value, checked, ...rest } = props;
        return <input {...rest} defaultValue={typeof value === 'string' ? value : undefined} defaultChecked={Boolean(checked)} onChange={node.attribs['name'] === 'physics-answer' ? e => setAnswers(a => ({...a,[question]:e.target.value})) : undefined} />;
      }
      if (node.name === 'select') {
        const props = attributesToProps(node.attribs);
        return <select {...props} defaultValue="" onChange={e => { if(page === 'teacher') filterStudents(undefined,e.target.value); }}>{domToReact(node.children as DOMNode[],options)}</select>;
      }
      if (node.name === 'option') {
        const props = attributesToProps(node.attribs); delete props['selected'];
        return <option {...props}>{domToReact(node.children as DOMNode[],options)}</option>;
      }
      if (node.name === 'form') return <form {...attributesToProps(node.attribs)} onSubmit={submit}>{domToReact(node.children as DOMNode[],options)}</form>;
      return undefined;
    }};
    return parse(pages[page],options);
  }, [page, question]);

  function filterStudents(search?: string, value?: string) {
    const input = root.current?.querySelector<HTMLInputElement>('input[placeholder^="بحث"]');
    const term = search ?? input?.value ?? '';
    root.current?.querySelectorAll<HTMLTableRowElement>('tbody tr').forEach(tr => {
      const text = tr.textContent || '';
      const filter = !value || value.includes('كل') || text.includes(value.replace('فصل','').trim());
      tr.hidden = !text.includes(term) || !filter;
    });
  }
  function submit(e: FormEvent) {
    e.preventDefault();
    if (page === 'login') {
      const group = root.current?.querySelector<HTMLInputElement>('#class-group')?.value || '';
      navigate({to:group.includes('TEACH') || group.includes('معلم') ? '/teacher' : '/exams'});
    } else if (page === 'student') navigate({to:'/exam'});
  }
  function modal(id: string, show: boolean) {
    const el = root.current?.querySelector<HTMLElement>(`#${id}`);
    if (!el) return;
    el.classList.toggle('hidden',!show);
    el.classList.toggle('opacity-0',!show);
    el.classList.toggle('pointer-events-none',!show);
    el.setAttribute('role','dialog');
    el.setAttribute('aria-modal','true');
  }
  function downloadReport() {
    window.print();
  }
  function click(e: MouseEvent<HTMLDivElement>) {
    if (!(e.target instanceof HTMLElement)) return;
    const button = e.target.closest('button');
    if (!button) return;
    const text = button.textContent?.trim() || '';
    if (text.includes('volume_up') || text.includes('volume_off')) { setMuted(!muted); const s=button.querySelector('span'); if(s) s.textContent=muted?'volume_up':'volume_off'; notify(muted?'تم تشغيل الصوت':'تم كتم الصوت'); return; }
    if (page === 'login' && (text.includes('تجربة سريعة') || text.includes('دخول المعلم'))) {
      const name = root.current?.querySelector<HTMLInputElement>('#user-name'); const group = root.current?.querySelector<HTMLInputElement>('#class-group');
      if(name && group) { name.value=text.includes('دخول المعلم')?'أ. محمد فاروق':'أحمد محمود إبراهيم'; group.value=text.includes('دخول المعلم')?'PHY-TEACH-900':'3/1 علمي'; }
      return;
    }
    if (page === 'student') {
      if (text.includes('بدء الامتحان')) { modal('verification-modal',true); return; }
      if (text.includes('إلغاء') || text === 'close') { modal('verification-modal',false); return; }
      if (text.includes('عرض نموذج')) { navigate({to:'/results'}); return; }
    }
    if (page === 'exam') {
      const n=Number(text); if(n>=1 && n<=10) { setQuestion(n); return; }
      if(text.includes('السابق')) { setQuestion(q=>Math.max(1,q-1)); return; }
      if(text.includes('حفظ والانتقال')) { if(question===10) setConfirm(true); else setQuestion(q=>q+1); return; }
      if(text.includes('مسح الإجابة')) { setAnswers(a=>({...a,[question]:''})); return; }
      if(text === 'مسح') { const pad=root.current?.querySelector<HTMLTextAreaElement>('#scratchpad'); if(pad) pad.value=''; return; }
      if(text.includes('مراجعة لاحقاً')) { setFlags(f=>f.includes(question)?f.filter(n=>n!==question):[...f,question]); notify('تم تحديث علامة المراجعة'); return; }
      if(text.includes('إنهاء الاختبار')) { setConfirm(true); return; }
      if(text.includes('الإبلاغ')) { notify('تم تسجيل ملاحظتك في هذه الجلسة التجريبية'); return; }
    }
    if(page==='result' && text.includes('الأسئلة الخاطئة')) {
      const active=button.dataset['filtered']!=='yes'; button.dataset['filtered']=active?'yes':'no';
      root.current?.querySelectorAll<HTMLTableRowElement>('tbody tr').forEach(tr=>tr.hidden=active && !tr.textContent?.includes('خاطئة'));
      return;
    }
    if (text.includes('تقرير') || text.includes('download') || text.includes('تصدير')) { downloadReport(); return; }
    if(page==='teacher') {
      if(button.id==='openExamBuilderBtn') { modal('examBuilderModal',true); return; }
      if(button.id==='closeExamBuilderBtn'||button.id==='cancelExamBuilderBtn') { modal('examBuilderModal',false); return; }
      if(text.includes('رفع ونشر')) { modal('examBuilderModal',false); notify('تم تجهيز الامتحان في هذه الجلسة التجريبية'); return; }
      if(text.includes('تفاصيل ورقة')) { navigate({to:'/results'}); return; }
      if(text.includes('إضافة سؤال')) { const area=root.current?.querySelector('#examBuilderModal textarea'); if(area instanceof HTMLTextAreaElement) { area.value=''; area.focus(); } notify('اكتب السؤال الجديد وحدد الإجابة الصحيحة'); return; }
      if(text.includes('حذف')) { notify('تم مسح السؤال الحالي'); const area=root.current?.querySelector('#examBuilderModal textarea'); if(area instanceof HTMLTextAreaElement) area.value=''; return; }
      if(text.includes('تغيير الرسمة')) { const input=document.createElement('input'); input.type='file'; input.accept='image/*'; input.onchange=()=>notify('تم اختيار الرسمة لهذه الجلسة'); input.click(); return; }
    }
    if(button.type!=='submit') notify('تم تحديث العرض في الجلسة التجريبية');
  }
  return <div className="academy-page" ref={root} onClick={click} onInput={e=>{ if(e.target instanceof HTMLInputElement && e.target.placeholder.startsWith('بحث')) filterStudents(e.target.value); }}>
    {questionBank && <div className="bank-heading">بنك الأسئلة الفيزيائية</div>}
    {rendered}
    {notice && <div role="status" className="academy-notice">{notice}</div>}
    {confirm && <div role="dialog" aria-modal="true" aria-label="إنهاء الاختبار" className="academy-dialog"><div className="academy-dialog-box"><h2>تأكيد تسليم الامتحان</h2><p>هل تريد إنهاء الاختبار وعرض تحليل الإجابات؟</p><div className="dialog-actions"><Button onClick={()=>navigate({to:'/results'})}>تسليم وعرض النتيجة</Button><Button variant="secondary" onClick={()=>setConfirm(false)}>متابعة الاختبار</Button></div></div></div>}
  </div>;
}