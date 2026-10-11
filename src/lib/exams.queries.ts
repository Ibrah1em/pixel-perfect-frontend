import { queryOptions } from '@tanstack/react-query';
import { listExams, getPublishedExam } from './exams.functions';
export const examsQuery = () => queryOptions({ queryKey: ['published-exams'], queryFn: () => listExams(), staleTime: 0 });
export const examQuery = (id: string) => queryOptions({ queryKey: ['published-exam', id], queryFn: () => getPublishedExam({ data: { id } }), staleTime: 60_000 });