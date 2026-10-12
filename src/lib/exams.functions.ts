import { createServerFn } from '@tanstack/react-start';
import { setResponseHeader } from '@tanstack/react-start/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { requireTeacher } from './teacher-session.server';
import { examSchema } from './exam-schemas';
import type { Database, Json } from '@/integrations/supabase/types';

function publicClient() {
  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_PUBLISHABLE_KEY'] || process.env['SUPABASE_ANON_KEY'];
  if (!url || !key) throw new Error('Exam service unavailable');
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => {
    const headers = new Headers(init?.headers);
    if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
    headers.set('apikey', key);
    return fetch(input, { ...init, headers });
  } } });
}
export const listExams = createServerFn({ method: 'GET' }).handler(async () => {
  const { data, error } = await publicClient().from('physics_exams').select('id,title,duration_minutes,question_count').order('created_at', { ascending: false });
  if (error) throw new Error('تعذر تحميل الامتحانات');
  return data;
});
export const publishExam = createServerFn({ method: 'POST' }).inputValidator((input: unknown) => examSchema.parse(input)).handler(async ({ data }) => {
  await requireTeacher();
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { data: existing } = await supabaseAdmin.from('physics_exams').select('id').eq('id', data.id).maybeSingle();
  if (existing) return { id: existing.id };
  const paths = data.questions.flatMap(q => q.imagePath ? [q.imagePath] : []);
  for (const path of paths) {
    const filename = path.split('/')[1];
    if (!filename) throw new Error('صورة غير صالحة');
    const { data: files, error } = await supabaseAdmin.storage.from('exam-images').list(data.id, { search: filename, limit: 100 });
    if (error || !files?.some(file => `${data.id}/${file.name}` === path)) throw new Error('أعد رفع صورة السؤال');
  }
  const payload = { id: data.id, title: data.title, duration: data.duration, questions: data.questions.map((q, position) => ({ ...q, id: crypto.randomUUID(), position })) };
  const { error } = await supabaseAdmin.rpc('publish_physics_exam', { payload: payload as Json });
  if (error) throw new Error('تعذر رفع الامتحان، حاول مرة أخرى');
  return { id: data.id };
});
export const uploadQuestionImage = createServerFn({ method: 'POST' }).inputValidator((input: unknown) => {
  if (!(input instanceof FormData)) throw new Error('صورة غير صالحة');
  const examId = z.string().uuid().parse(input.get('examId'));
  const file = input.get('image');
  if (!(file instanceof File) || file.type !== 'image/webp' || file.size < 12 || file.size > 2 * 1024 * 1024) throw new Error('الصورة يجب أن تكون أقل من ٢ ميجابايت');
  return { examId, file };
}).handler(async ({ data }) => {
  await requireTeacher();
  const bytes = new Uint8Array(await data.file.arrayBuffer());
  if (new TextDecoder().decode(bytes.slice(0, 4)) !== 'RIFF' || new TextDecoder().decode(bytes.slice(8, 12)) !== 'WEBP') throw new Error('صورة غير صالحة');
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const path = `${data.examId}/${crypto.randomUUID()}.webp`;
  const { error } = await supabaseAdmin.storage.from('exam-images').upload(path, bytes, { contentType: 'image/webp', cacheControl: '86400' });
  if (error) throw new Error('تعذر رفع الصورة، حاول مرة أخرى');
  return { path };
});
export const getPublishedExam = createServerFn({ method: 'GET' }).inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input)).handler(async ({ data }) => {
  setResponseHeader('Cache-Control', 'no-store');
  const client = publicClient();
  const { data: exam, error } = await client.from('physics_exams').select('id,title,duration_minutes').eq('id', data.id).maybeSingle();
  if (error) throw new Error('تعذر تحميل الامتحان');
  if (!exam) return null;
  const { data: rows, error: questionError } = await client.from('physics_questions').select('id,text,marks,options,image_path,position').eq('exam_id', exam.id).order('position');
  if (questionError) throw new Error('تعذر تحميل الأسئلة');
  // Privileged signing is limited to image paths already authorized by public exam RLS.
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const questions = await Promise.all(rows.map(async q => {
    let imageUrl: string | null = null;
    if (q.image_path) {
      const { data: signed, error: signError } = await supabaseAdmin.storage.from('exam-images').createSignedUrl(q.image_path, 60 * 60 * 6);
      if (signError) throw new Error('تعذر تحميل صورة السؤال');
      if (signed) {
        const browserUrl = import.meta.env['VITE_SUPABASE_URL'];
        imageUrl = browserUrl ? `${browserUrl.replace(/\/$/, '')}${new URL(signed.signedUrl).pathname}${new URL(signed.signedUrl).search}` : signed.signedUrl;
      }
    }
    return { id: q.id, text: q.text, marks: Number(q.marks), options: z.array(z.string()).parse(q.options), imageUrl };
  }));
  return { ...exam, questions };
});
export const gradeExam = createServerFn({ method: 'POST' }).inputValidator((input: unknown) => z.object({ id: z.string().uuid(), studentName: z.string().trim().min(1).max(200), className: z.string().trim().min(1).max(100), timedOut: z.boolean(), answers: z.record(z.string().uuid(), z.number().int().min(0).max(5)).refine(a => Object.keys(a).length <= 100) }).parse(input)).handler(async ({ data }) => {
  const { data: questions, error } = await publicClient().from('physics_questions').select('id,marks,options').eq('exam_id', data.id);
  if (error || !questions.length) throw new Error('تعذر تسليم الامتحان');
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { data: keys, error: keyError } = await supabaseAdmin.from('physics_answer_keys').select('question_id,correct_index').in('question_id', questions.map(q => q.id));
  if (keyError || keys.length !== questions.length) throw new Error('تعذر حساب النتيجة');
  let score = 0;
  const answers: Record<string, number> = {};
  for (const q of questions) {
    const answer = data.answers[q.id];
    if (answer === undefined) continue;
    answers[q.id] = answer;
    if (answer === keys.find(k => k.question_id === q.id)?.correct_index) score += Number(q.marks);
  }
  const total = questions.reduce((sum, q) => sum + Number(q.marks), 0);
  const { error: saveError } = await supabaseAdmin.from('physics_submissions').insert({ exam_id: data.id, student_name: data.studentName, class_name: data.className, answers, score, total, timed_out: data.timedOut });
  if (saveError) throw new Error('تعذر تسليم الامتحان');
  return { ok: true };
});