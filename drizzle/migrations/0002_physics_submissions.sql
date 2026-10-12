CREATE TABLE public.physics_submissions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 exam_id uuid NOT NULL REFERENCES public.physics_exams(id) ON DELETE CASCADE,
 student_name text NOT NULL CHECK (char_length(student_name) BETWEEN 1 AND 200),
 class_name text NOT NULL CHECK (char_length(class_name) BETWEEN 1 AND 100),
 answers jsonb NOT NULL DEFAULT '{}'::jsonb,
 score numeric NOT NULL,
 total numeric NOT NULL,
 timed_out boolean NOT NULL DEFAULT false,
 submitted_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.physics_submissions TO service_role;
ALTER TABLE public.physics_submissions ENABLE ROW LEVEL SECURITY;
CREATE INDEX physics_submissions_exam_idx ON public.physics_submissions(exam_id, submitted_at DESC);