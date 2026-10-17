import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!publicClient) {
    return res.status(500).json({ error: 'Exam service unavailable' });
  }

  try {
    const payload = z.object({ id: z.string().uuid() }).parse(req.body);
    res.setHeader('Cache-Control', 'no-store');

    const { data: exam, error } = await publicClient
      .from('physics_exams')
      .select('is_closed')
      .eq('id', payload.id)
      .maybeSingle();

    if (error || !exam) {
      return res.status(500).json({ error: 'تعذر دخول الامتحان' });
    }

    return res.status(200).json({ closed: !!exam.is_closed });
  } catch (error) {
    console.error('POST /api/exams/admission error', error);
    return res.status(400).json({ error: 'Invalid payload' });
  }
}
