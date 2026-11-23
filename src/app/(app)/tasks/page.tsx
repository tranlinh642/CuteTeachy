import { redirect } from 'next/navigation';

interface TasksRedirectPageProps {
  readonly searchParams: Promise<{ date?: string | string[] }>;
}

export default async function TasksRedirectPage({ searchParams }: TasksRedirectPageProps) {
  const params = await searchParams;
  const rawDate = Array.isArray(params.date) ? params.date[0] : params.date;
  const dateParam =
    typeof rawDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
      ? `?date=${encodeURIComponent(rawDate)}`
      : '';

  redirect(`/calendar${dateParam}`);
}
