// Ola R — utilidades para integraciones externas ligeras (sin API keys)

export function whatsappLink(phone: string, message?: string): string {
  const clean = (phone || '').replace(/[^\d+]/g, '').replace(/^\+/, '');
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${clean}${text}`;
}

export function googleCalendarLink(opts: {
  title: string;
  details?: string;
  location?: string;
  start: Date;
  end?: Date;
}): string {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const end = opts.end ?? new Date(opts.start.getTime() + 60 * 60 * 1000);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: opts.title,
    dates: `${fmt(opts.start)}/${fmt(end)}`,
    details: opts.details ?? '',
    location: opts.location ?? '',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
