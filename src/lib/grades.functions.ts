import { createServerFn } from '@tanstack/react-start';
import { setResponseHeader } from '@tanstack/react-start/server';
import { z } from 'zod';
import { requireTeacher } from './teacher-session.server';

const classKey = (name: string) => name.trim().replace(/\s+/g, ' ').toLowerCase();

export const getExamGrades = createServerFn({ method: 'GET' }).inputValidator((input: unknown) => z.object({ examId: z.string().uuid() }).parse(input)).handler(async ({ data }) => {
  await requireTeacher();
  setResponseHeader('Cache-Control', 'no-store');
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { data: exam, error } = await supabaseAdmin.from('physics_exams').select('id,title').eq('id', data.examId).maybeSingle();
  if (error) throw new Error('تعذر تحميل الدرجات');
  if (!exam) return null;
  const { data: rows, error: rowsError } = await supabaseAdmin.from('physics_submissions').select('id,student_name,class_name,score,total,timed_out,submitted_at').eq('exam_id', exam.id).order('student_name');
  if (rowsError) throw new Error('تعذر تحميل الدرجات');
  const classes = new Map<string, { key: string; name: string; students: { id: string; name: string; score: number; total: number; timedOut: boolean; submittedAt: string }[] }>();
  for (const r of rows) {
    const key = classKey(r.class_name);
    if (!classes.has(key)) classes.set(key, { key, name: r.class_name.trim(), students: [] });
    classes.get(key)!.students.push({ id: r.id, name: r.student_name, score: Number(r.score), total: Number(r.total), timedOut: r.timed_out, submittedAt: r.submitted_at });
  }
  return { exam, classes: [...classes.values()].sort((a, b) => a.name.localeCompare(b.name, 'ar', { numeric: true })) };
});

export const getSubmission = createServerFn({ method: 'GET' }).inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input)).handler(async ({ data }) => {
  await requireTeacher();
  setResponseHeader('Cache-Control', 'no-store');
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { data: sub, error } = await supabaseAdmin.from('physics_submissions').select('id,exam_id,student_name,class_name,score,total,timed_out,answers,submitted_at').eq('id', data.id).maybeSingle();
  if (error) throw new Error('تعذر تحميل الإجابات');
  if (!sub) return null;
  const [{ data: exam }, { data: questions, error: qError }] = await Promise.all([
    supabaseAdmin.from('physics_exams').select('id,title').eq('id', sub.exam_id).maybeSingle(),
    supabaseAdmin.from('physics_questions').select('id,text,marks,options,image_path,position').eq('exam_id', sub.exam_id).order('position'),
  ]);
  if (qError || !exam) throw new Error('تعذر تحميل الإجابات');
  const { data: keys } = await supabaseAdmin.from('physics_answer_keys').select('question_id,correct_index').in('question_id', questions.map(q => q.id));
  const answers = z.record(z.string(), z.number()).catch({}).parse(sub.answers);
  const browserUrl = import.meta.env['VITE_SUPABASE_URL'];
  const items = await Promise.all(questions.map(async q => {
    let imageUrl: string | null = null;
    if (q.image_path) {
      const { data: signed } = await supabaseAdmin.storage.from('exam-images').createSignedUrl(q.image_path, 60 * 60);
      if (signed) { const u = new URL(signed.signedUrl); imageUrl = browserUrl ? `${browserUrl.replace(/\/$/, '')}${u.pathname}${u.search}` : signed.signedUrl; }
    }
    return { id: q.id, text: q.text, marks: Number(q.marks), options: z.array(z.string()).parse(q.options), imageUrl, correct: keys?.find(k => k.question_id === q.id)?.correct_index ?? -1, chosen: answers[q.id] ?? null };
  }));
  return { id: sub.id, examId: exam.id, examTitle: exam.title, student: sub.student_name, className: sub.class_name.trim(), classKey: classKey(sub.class_name), score: Number(sub.score), total: Number(sub.total), timedOut: sub.timed_out, questions: items };
});
