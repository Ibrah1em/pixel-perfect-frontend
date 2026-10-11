import { z } from 'zod';
export const imagePathSchema = z.string().regex(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.webp$/).max(90);
export const questionSchema = z.object({
  text: z.string().trim().min(1, 'اكتب نص السؤال').max(4000),
  marks: z.number().min(0.5).max(100).multipleOf(0.5),
  imagePath: imagePathSchema.nullable(),
  options: z.array(z.string().trim().min(1, 'اكتب جميع الإجابات').max(500)).min(2).max(6),
  correctIndex: z.number().int().min(0).max(5),
}).superRefine((q, ctx) => {
  if (q.correctIndex >= q.options.length) ctx.addIssue({ code: 'custom', message: 'حدد الإجابة الصحيحة', path: ['correctIndex'] });
  if (new Set(q.options).size !== q.options.length) ctx.addIssue({ code: 'custom', message: 'الإجابات يجب أن تكون مختلفة', path: ['options'] });
});
export const examSchema = z.object({ id: z.string().uuid(), title: z.string().trim().min(1, 'اكتب عنوان الامتحان').max(200), duration: z.number().int().min(1).max(300), questionCount: z.number().int().min(1).max(100), questions: z.array(questionSchema).min(1).max(100) }).superRefine((exam, ctx) => {
  if (exam.questions.length !== exam.questionCount) ctx.addIssue({ code: 'custom', message: 'عدد الأسئلة المضافة لا يطابق عدد الأسئلة المحدد', path: ['questions'] });
  if (exam.questions.some(q => q.imagePath && !q.imagePath.startsWith(`${exam.id}/`))) ctx.addIssue({ code: 'custom', message: 'صورة السؤال لا تخص هذا الامتحان' });
});
export type ExamDraft = z.infer<typeof examSchema>;
export type QuestionDraft = z.infer<typeof questionSchema>;