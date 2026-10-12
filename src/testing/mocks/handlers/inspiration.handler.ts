import { ENDPOINTS } from '@/lib/api/endpoints';
import { notFound, ok, route } from '../mock-router';

export const inspirationRoutes = [
  route('GET', ENDPOINTS.inspirations.today, (_request, db) => {
    const dayOfYear = Math.floor(Date.now() / 86_400_000);
    const quote = db.inspirations[dayOfYear % db.inspirations.length];
    return quote ? ok(quote) : notFound();
  }),
];
