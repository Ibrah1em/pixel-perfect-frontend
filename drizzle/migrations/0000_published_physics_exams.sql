CREATE TABLE public.physics_exams (id uuid PRIMARY KEY, title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200), duration_minutes integer NOT NULL CHECK (duration_minutes BETWEEN 1 AND 300), question_count integer NOT NULL CHECK (question_count BETWEEN 1 AND 100), created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.physics_exams TO anon, authenticated;
GRANT ALL ON public.physics_exams TO service_role;
ALTER TABLE public.physics_exams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published exams are public" ON public.physics_exams FOR SELECT TO anon, authenticated USING (true);
CREATE TABLE public.physics_questions (id uuid PRIMARY KEY, exam_id uuid NOT NULL REFERENCES public.physics_exams(id) ON DELETE CASCADE, position integer NOT NULL CHECK(position BETWEEN 0 AND 99), text text NOT NULL CHECK(char_length(text) BETWEEN 1 AND 4000), marks numeric NOT NULL CHECK(marks > 0 AND marks <= 100), image_path text, options jsonb NOT NULL, UNIQUE(exam_id, position));
GRANT SELECT ON public.physics_questions TO anon, authenticated;
GRANT ALL ON public.physics_questions TO service_role;
ALTER TABLE public.physics_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published questions are public" ON public.physics_questions FOR SELECT TO anon, authenticated USING (EXISTS(SELECT 1 FROM public.physics_exams e WHERE e.id = exam_id));
CREATE TABLE public.physics_answer_keys (question_id uuid PRIMARY KEY REFERENCES public.physics_questions(id) ON DELETE CASCADE, correct_index integer NOT NULL CHECK(correct_index BETWEEN 0 AND 5));
GRANT ALL ON public.physics_answer_keys TO service_role;
ALTER TABLE public.physics_answer_keys ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.publish_physics_exam(payload jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE exam_uuid uuid := (payload->>'id')::uuid; q jsonb; question_uuid uuid;
BEGIN
 INSERT INTO public.physics_exams(id,title,duration_minutes,question_count) VALUES(exam_uuid,payload->>'title',(payload->>'duration')::integer,jsonb_array_length(payload->'questions'));
 FOR q IN SELECT value FROM jsonb_array_elements(payload->'questions') LOOP
  question_uuid := (q->>'id')::uuid;
  INSERT INTO public.physics_questions(id,exam_id,position,text,marks,image_path,options) VALUES(question_uuid,exam_uuid,(q->>'position')::integer,q->>'text',(q->>'marks')::numeric,q->>'imagePath',q->'options');
  INSERT INTO public.physics_answer_keys(question_id,correct_index) VALUES(question_uuid,(q->>'correctIndex')::integer);
 END LOOP;
 RETURN exam_uuid;
END; $$;
REVOKE ALL ON FUNCTION public.publish_physics_exam(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.publish_physics_exam(jsonb) TO service_role;
CREATE INDEX physics_questions_exam_idx ON public.physics_questions(exam_id);