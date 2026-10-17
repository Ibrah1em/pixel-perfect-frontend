import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ADMIN_KEY;
if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Missing Supabase server keys for /api/exams/grade');
}
const supabaseAdmin = createClient(supabaseUrl || '', supabaseServiceKey || '', { auth: { persistSession: false, autoRefreshToken: false } });

const bodySchema = z.object({
  id: z.string().uuid(),
  studentName: z.string().min(1).max(200),
  className: z.string().min(1).max(200),
  timedOut: z.boolean().optional(),
  answers: z.record(z.string(), z.number()).optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  let data;
  try {
    data = bodySchema.parse(req.body);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid payload', details: (err as Error).message });
  }

  try {
    // fetch questions
    const { data: questions, error: qError } = await supabaseAdmin
      .from('physics_questions')
      .select('id,marks,options')
      .eq('exam_id', data.id);
    if (qError || !questions || !questions.length) return res.status(500).json({ error: 'تعذر تسليم الامتحان' });

    // fetch keys
    const { data: keys, error: keyError } = await supabaseAdmin
      .from('physics_answer_keys')
      .select('question_id,correct_index')
      .in('question_id', questions.map((q: any) => q.id));
    if (keyError || !keys || keys.length !== questions.length) return res.status(500).json({ error: 'تعذر حساب النتيجة' });

    let score = 0;
    const answers: Record<string, number> = {};
    for (const q of questions) {
      const answer = data.answers?.[q.id];
      if (answer === undefined) continue;
      answers[q.id] = answer;
      const key = (keys as any).find((k: any) => k.question_id === q.id);
      if (key && answer === key.correct_index) score += Number(q.marks);
    }
    const total = (questions as any).reduce((sum: number, q: any) => sum + Number(q.marks), 0);

    const { error: saveError } = await supabaseAdmin
      .from('physics_submissions')
      .insert({ exam_id: data.id, student_name: data.studentName, class_name: data.className, answers, score, total, timed_out: !!data.timedOut });
    if (saveError) return res.status(500).json({ error: 'تعذر تسليم الامتحان' });

    return res.status(200).json({ ok: true, score, total });
  } catch (err) {
    console.error('grade endpoint error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
