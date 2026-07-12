// Minimal CSV serializer with RFC-4180-style escaping. Hand-rolled to avoid
// pulling an extra dependency for a few report rows.

function escapeField(value) {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCSV(rows, columns) {
  const cols = columns.map((c) => (typeof c === 'string' ? { key: c, label: c } : c));
  const header = cols.map((c) => escapeField(c.label)).join(',');
  const body = rows
    .map((row) => cols.map((c) => escapeField(row[c.key])).join(','))
    .join('\n');
  return rows.length ? `${header}\n${body}` : header;
}

export function sendCSV(res, filename, rows, columns) {
  const csv = toCSV(rows, columns);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.status(200).send(csv);
}
