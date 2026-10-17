import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ADMIN_KEY;

const publicClient = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const headers = new Headers(init?.headers);
          if (supabaseKey.startsWith('sb_') && headers.get('Authorization') === `Bearer ${supabaseKey}`) {
            headers.delete('Authorization');
          }
          headers.set('apikey', supabaseKey);
          return fetch(input, { ...init, headers });
        },
      },
    })
  : null;

const adminClient = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid exam id' });
  }

  if (!publicClient || !adminClient) {
    return res.status(500).json({ error: 'Exam service unavailable' });
  }

  try {
    res.setHeader('Cache-Control', 'no-store');

    const { data: exam, error } = await publicClient
      .from('physics_exams')
      .select('id,title,duration_minutes,is_closed')
      .eq('id', parsed.data)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error: 'تعذر تحميل الامتحان' });
    }

    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    if (exam.is_closed) {
      return res.status(200).json({ ...exam, questions: [] });
    }

    const { data: rows, error: questionError } = await publicClient
      .from('physics_questions')
      .select('id,text,marks,options,image_path,position')
      .eq('exam_id', exam.id)
      .order('position');

    if (questionError) {
      return res.status(500).json({ error: 'تعذر تحميل الأسئلة' });
    }

    const questions = await Promise.all((rows ?? []).map(async (q) => {
      let imageUrl: string | null = null;
      if (q.image_path) {
        const { data: signed, error: signError } = await adminClient.storage
          .from('exam-images')
          .createSignedUrl(q.image_path, 60 * 60 * 6);

        if (signError) {
          throw new Error('تعذر تحميل صورة السؤال');
        }

        if (signed) {
          const baseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
          imageUrl = baseUrl
            ? `${baseUrl.replace(/\/$/, '')}${new URL(signed.signedUrl).pathname}${new URL(signed.signedUrl).search}`
            : signed.signedUrl;
        }
      }

      const rawOptions = Array.isArray(q.options) ? q.options : typeof q.options === 'string' ? JSON.parse(q.options) : [];
      return {
        id: q.id,
        text: q.text,
        marks: Number(q.marks),
        options: z.array(z.string()).parse(rawOptions),
        imageUrl,
      };
    }));

    return res.status(200).json({ ...exam, questions });
  } catch (error) {
    console.error('GET /api/exams/[id] error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
