import { SurveyResponse, SurveySubmission, SurveyStats } from '../types';

export const VALID_INTENTS = ['一定參加', '高機率參加', '觀望中'] as const;
export const VALID_DAYS = ['5 天', '7 天', '9 天'] as const;
export const VALID_STYLES = ['都市繁華', '慢生活風景', '城鄉各半'] as const;
export const VALID_TRANSPORTS = ['大眾運輸為主', '租車自駕'] as const;
export const VALID_REGIONS = [
  '東京及近郊',
  '京阪神',
  '北海道',
  '福岡九州',
  '青森東北',
  '四國瀨戶內'
] as const;

export function validateSubmission(data: any): { valid: boolean; error?: string; cleanData?: SurveySubmission } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: '無效的請求資料' };
  }

  // 1. Name validation
  if (typeof data.name !== 'string') {
    return { valid: false, error: '姓名為必填欄位' };
  }
  const cleanName = data.name.trim();
  if (cleanName.length === 0) {
    return { valid: false, error: '姓名不能為空白' };
  }
  if (cleanName.length > 40) {
    return { valid: false, error: '姓名長度最多 40 字' };
  }

  // 2. Intent validation
  if (!VALID_INTENTS.includes(data.intent)) {
    return { valid: false, error: '請選擇有效的參團意願' };
  }

  // 3. Days validation
  if (!VALID_DAYS.includes(data.days)) {
    return { valid: false, error: '請選擇有效的行程天數' };
  }

  // 4. Style validation
  if (!VALID_STYLES.includes(data.style)) {
    return { valid: false, error: '請選擇有效的旅行風格' };
  }

  // 5. Transport validation
  if (!VALID_TRANSPORTS.includes(data.transport)) {
    return { valid: false, error: '請選擇有效的交通方式' };
  }

  // 6. Driver validation
  const driverBool = Boolean(data.driver);

  // 7. Regions validation (max 3, valid values, no duplicates)
  if (!Array.isArray(data.regions) || data.regions.length === 0) {
    return { valid: false, error: '請至少選擇一個想去的日本地區' };
  }
  const uniqueRegions = Array.from(new Set(data.regions)) as string[];
  if (uniqueRegions.length > 3) {
    return { valid: false, error: '想去的日本地區最多只能選擇三個' };
  }
  for (const reg of uniqueRegions) {
    if (!VALID_REGIONS.includes(reg as any)) {
      return { valid: false, error: `無效的日本地區選項：${reg}` };
    }
  }

  // 8. Notes validation (optional, max 500)
  let cleanNotes = '';
  if (data.notes !== undefined && data.notes !== null) {
    if (typeof data.notes !== 'string') {
      return { valid: false, error: '備註必須為文字格式' };
    }
    cleanNotes = data.notes.trim();
    if (cleanNotes.length > 500) {
      return { valid: false, error: '私心許願／備註最多 500 字' };
    }
  }

  return {
    valid: true,
    cleanData: {
      name: cleanName,
      intent: data.intent,
      days: data.days,
      style: data.style,
      transport: data.transport,
      driver: driverBool,
      regions: uniqueRegions,
      notes: cleanNotes
    }
  };
}

export async function getAllResponses(db: D1Database): Promise<SurveyResponse[]> {
  const result = await db
    .prepare('SELECT id, name, intent, days, style, transport, driver, regions, notes, created_at, updated_at FROM responses ORDER BY created_at DESC')
    .all();

  return (result.results || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    intent: row.intent,
    days: row.days,
    style: row.style,
    transport: row.transport,
    driver: Number(row.driver) || 0,
    regions: safeParseJsonArray(row.regions),
    notes: row.notes || '',
    created_at: row.created_at,
    updated_at: row.updated_at
  }));
}

export async function insertSurveyResponse(db: D1Database, submission: SurveySubmission): Promise<SurveyResponse> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const driverInt = submission.driver ? 1 : 0;
  const regionsJson = JSON.stringify(submission.regions);

  await db
    .prepare(
      `INSERT INTO responses (id, name, intent, days, style, transport, driver, regions, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      submission.name,
      submission.intent,
      submission.days,
      submission.style,
      submission.transport,
      driverInt,
      regionsJson,
      submission.notes || '',
      now,
      now
    )
    .run();

  return {
    id,
    name: submission.name,
    intent: submission.intent,
    days: submission.days,
    style: submission.style,
    transport: submission.transport,
    driver: driverInt,
    regions: submission.regions,
    notes: submission.notes || '',
    created_at: now,
    updated_at: now
  };
}

export async function deleteSurveyResponse(db: D1Database, id: string): Promise<boolean> {
  const res = await db.prepare('DELETE FROM responses WHERE id = ?').bind(id).run();
  return (res.meta?.changes ?? 0) > 0;
}

export async function updateSurveyResponse(
  db: D1Database,
  id: string,
  submission: SurveySubmission
): Promise<SurveyResponse | null> {
  const existing = await db
    .prepare('SELECT created_at FROM responses WHERE id = ?')
    .bind(id)
    .first<{ created_at: string }>();

  if (!existing) {
    return null;
  }

  const now = new Date().toISOString();
  const driverInt = submission.driver ? 1 : 0;
  const regionsJson = JSON.stringify(submission.regions);

  await db
    .prepare(
      `UPDATE responses
       SET name = ?, intent = ?, days = ?, style = ?, transport = ?, driver = ?, regions = ?, notes = ?, updated_at = ?
       WHERE id = ?`
    )
    .bind(
      submission.name,
      submission.intent,
      submission.days,
      submission.style,
      submission.transport,
      driverInt,
      regionsJson,
      submission.notes || '',
      now,
      id
    )
    .run();

  return {
    id,
    name: submission.name,
    intent: submission.intent,
    days: submission.days,
    style: submission.style,
    transport: submission.transport,
    driver: driverInt,
    regions: submission.regions,
    notes: submission.notes || '',
    created_at: existing.created_at,
    updated_at: now
  };
}

export function computeSurveyStats(responses: SurveyResponse[]): SurveyStats {
  const regionVotes: Record<string, number> = {
    '東京及近郊': 0,
    '京阪神': 0,
    '北海道': 0,
    '福岡九州': 0,
    '青森東北': 0,
    '四國瀨戶內': 0
  };

  const daysVotes: Record<string, number> = {
    '5 天': 0,
    '7 天': 0,
    '9 天': 0
  };

  const styleVotes: Record<string, number> = {
    '都市繁華': 0,
    '慢生活風景': 0,
    '城鄉各半': 0
  };

  const intentVotes: Record<string, number> = {
    '一定參加': 0,
    '高機率參加': 0,
    '觀望中': 0
  };

  let publicTransport = 0;
  let rentalCar = 0;
  let willingDrivers = 0;
  let totalRegionVotes = 0;

  for (const r of responses) {
    // Days
    if (daysVotes[r.days] !== undefined) {
      daysVotes[r.days]++;
    }
    // Style
    if (styleVotes[r.style] !== undefined) {
      styleVotes[r.style]++;
    }
    // Intent
    if (intentVotes[r.intent] !== undefined) {
      intentVotes[r.intent]++;
    }
    // Transport
    if (r.transport === '大眾運輸為主') {
      publicTransport++;
    } else if (r.transport === '租車自駕') {
      rentalCar++;
    }
    // Driver
    if (r.driver === 1) {
      willingDrivers++;
    }
    // Regions
    if (Array.isArray(r.regions)) {
      for (const reg of r.regions) {
        if (regionVotes[reg] !== undefined) {
          regionVotes[reg]++;
          totalRegionVotes++;
        }
      }
    }
  }

  return {
    totalCount: responses.length,
    totalRegionVotes,
    regionVotes,
    daysVotes,
    styleVotes,
    transportVotes: {
      publicTransport,
      rentalCar,
      willingDrivers
    },
    intentVotes
  };
}

function safeParseJsonArray(str: any): string[] {
  if (Array.isArray(str)) return str;
  if (typeof str !== 'string') return [];
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
