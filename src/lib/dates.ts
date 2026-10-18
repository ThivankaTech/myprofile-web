const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function isPresent(value: string): boolean {
  return value.toLowerCase() === "present";
}

// "2024-09" -> "Sep 2024"; anything else (e.g. "Present") passes through.
export function formatMonth(value: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return value;
  return `${MONTHS[Number(match[2]) - 1] ?? match[2]} ${match[1]}`;
}

export function formatPeriod(from: string, to: string): string {
  return `${formatMonth(from)} — ${formatMonth(to)}`;
}

// Sortable month number; 0 when the value isn't "YYYY-MM".
export function monthIndex(value: string): number {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  return match ? Number(match[1]) * 12 + Number(match[2]) : 0;
}

// "2024-09-15" -> "Sep 15, 2024"
export function formatDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  return `${MONTHS[Number(match[2]) - 1] ?? match[2]} ${Number(match[3])}, ${match[1]}`;
}
