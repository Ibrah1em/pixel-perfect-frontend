import { describe, expect, it } from 'vitest';
import { examSchema } from '@/lib/exam-schemas';
const valid = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', title: 'امتحان الفيزياء', duration: 60, questionCount: 1, questions: [{ text: 'ما وحدة التيار؟', marks: 3, imagePath: null, options: ['أمبير', 'فولت'], correctIndex: 0 }] };
describe('Exam publishing validation', () => {
  it('accepts complete exams with custom marks', () => expect(examSchema.safeParse(valid).success).toBe(true));
  it('rejects unmatched counts', () => expect(examSchema.safeParse({ ...valid, questionCount: 2 }).success).toBe(false));
  it('rejects missing correct answers', () => expect(examSchema.safeParse({ ...valid, questions: [{ ...valid.questions[0], correctIndex: -1 }] }).success).toBe(false));
  it('rejects empty and duplicated answers', () => { for (const options of [['', 'فولت'], ['فولت', 'فولت']]) expect(examSchema.safeParse({ ...valid, questions: [{ ...valid.questions[0], options }] }).success).toBe(false); });
  it('rejects external images and images from another exam', () => { for (const imagePath of ['https://example.com/a.webp', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.webp']) expect(examSchema.safeParse({ ...valid, questions: [{ ...valid.questions[0], imagePath }] }).success).toBe(false); });
  it('rejects invalid marks and duration', () => { expect(examSchema.safeParse({ ...valid, duration: 0 }).success).toBe(false); expect(examSchema.safeParse({ ...valid, questions: [{ ...valid.questions[0], marks: 0 }] }).success).toBe(false); });
});