import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!publicClient) {
    return res.status(500).json({ error: 'Exam service unavailable' });
  }

  try {
    res.setHeader('Cache-Control', 'no-store');
    const { data, error } = await publicClient
      .from('physics_exams')
      .select('id,title,duration_minutes,question_count,is_closed')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'تعذر تحميل الامتحانات' });
    }

    return res.status(200).json(data ?? []);
  } catch (error) {
    console.error('GET /api/exams error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
