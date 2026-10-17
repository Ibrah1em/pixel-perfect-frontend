import { queryOptions } from '@tanstack/react-query';

async function listExams() {
  const res = await fetch('/api/exams');
  if (!res.ok) throw new Error('تعذر تحميل الامتحانات');
  return res.json();
}

async function getPublishedExamRequest(id: string) {
  const res = await fetch(`/api/exams/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('تعذر تحميل الامتحان');
  return res.json();
}

export const examsQuery = () =>
  queryOptions({
    queryKey: ['published-exams'],
    queryFn: () => listExams(),
    staleTime: 0,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });

export const examQuery = (id: string) =>
  queryOptions({
    queryKey: ['published-exam', id],
    queryFn: () => getPublishedExamRequest(id),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
