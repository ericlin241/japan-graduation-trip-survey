import { SurveyResponse } from '../types';

export function downloadResponsesCsv(responses: SurveyResponse[]) {
  const BOM = '\uFEFF';
  const headers = [
    '識別碼',
    '姓名',
    '參團意願',
    '行程天數',
    '旅行風格',
    '交通方式',
    '願任駕駛',
    '想去地區',
    '私心許願／備註',
    '填答時間(本地時間)'
  ];

  const rows = responses.map((r) => [
    escapeCsv(r.id),
    escapeCsv(r.name),
    escapeCsv(r.intent),
    escapeCsv(r.days),
    escapeCsv(r.style),
    escapeCsv(r.transport),
    r.driver === 1 ? '是' : '否',
    escapeCsv(Array.isArray(r.regions) ? r.regions.join('、') : ''),
    escapeCsv(r.notes || ''),
    escapeCsv(new Date(r.created_at).toLocaleString('zh-TW'))
  ]);

  const csvContent = BOM + [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `畢業旅行問卷填答統計_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}
