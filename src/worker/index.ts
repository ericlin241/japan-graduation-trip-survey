import { Env } from './types';
import {
  getAllResponses,
  insertSurveyResponse,
  deleteSurveyResponse,
  computeSurveyStats,
  validateSubmission
} from './db/queries';

export { SurveyRoom } from './surveyRoom';

// IP rate limit helper (in-memory per worker isolate)
const submissionRateLimitMap = new Map<string, { count: number; lastTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = submissionRateLimitMap.get(ip);
  if (!entry || now - entry.lastTime > 60000) {
    submissionRateLimitMap.set(ip, { count: 1, lastTime: now });
    return true;
  }
  if (entry.count >= 15) {
    return false; // Exceeded 15 submissions per minute per IP
  }
  entry.count++;
  return true;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: getCorsHeaders(),
      });
    }

    // 1. WebSocket Upgrade route: /api/ws
    if (url.pathname === '/api/ws') {
      if (!env.SURVEY_ROOM) {
        return new Response('Durable Object SURVEY_ROOM not bound', { status: 500 });
      }
      const id = env.SURVEY_ROOM.idFromName('global_survey_room');
      const obj = env.SURVEY_ROOM.get(id);
      const wsUrl = new URL(request.url);
      wsUrl.pathname = '/ws';
      return obj.fetch(new Request(wsUrl.toString(), request));
    }

    // 2. REST API routes
    if (url.pathname.startsWith('/api/')) {
      try {
        const response = await handleApiRoutes(request, url, env);
        return addCorsAndSecurityHeaders(response);
      } catch (err: any) {
        return addCorsAndSecurityHeaders(
          new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        );
      }
    }

    // 3. Fallback to Static Assets (Pages / Worker Assets)
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  },
};

async function handleApiRoutes(request: Request, url: URL, env: Env): Promise<Response> {
  const path = url.pathname;

  // GET /api/health
  if (path === '/api/health' && request.method === 'GET') {
    return jsonResponse({
      status: 'ok',
      service: 'japan-graduation-trip-survey',
      time: new Date().toISOString(),
      environment: env.ENVIRONMENT || 'development',
    });
  }

  // GET /api/stats
  if (path === '/api/stats' && request.method === 'GET') {
    const responses = await getAllResponses(env.DB);
    const stats = computeSurveyStats(responses);
    return jsonResponse(stats);
  }

  // GET /api/responses
  if (path === '/api/responses' && request.method === 'GET') {
    const responses = await getAllResponses(env.DB);
    return jsonResponse({
      data: responses,
      total: responses.length,
    });
  }

  // POST /api/responses
  if (path === '/api/responses' && request.method === 'POST') {
    const clientIp = request.headers.get('cf-connecting-ip') || 'unknown';
    if (!checkRateLimit(clientIp)) {
      return jsonResponse({ error: '提交頻率過高，請稍候片刻再試。' }, 429);
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: '請求資料格式不正確（需為 JSON）' }, 400);
    }

    const { valid, error, cleanData } = validateSubmission(body);
    if (!valid || !cleanData) {
      return jsonResponse({ error: error || '表單驗證失敗' }, 400);
    }

    // Insert into DB
    const createdResponse = await insertSurveyResponse(env.DB, cleanData);

    // Broadcast via Durable Object
    await broadcastEvent(env, {
      type: 'NEW_RESPONSE',
      payload: createdResponse,
    });

    return jsonResponse({
      message: '感謝填答！問卷已成功送出。',
      data: createdResponse,
    }, 201);
  }

  // DELETE /api/responses/:id (Protected Admin Endpoint)
  if (path.startsWith('/api/responses/') && request.method === 'DELETE') {
    const id = path.replace('/api/responses/', '').trim();
    if (!id) {
      return jsonResponse({ error: '缺少紀錄識別碼' }, 400);
    }

    const adminPassword = request.headers.get('x-admin-password') || url.searchParams.get('admin_key');
    const expectedPassword = env.ADMIN_PASSWORD_HASH;

    if (!expectedPassword || !adminPassword || adminPassword !== expectedPassword) {
      return jsonResponse({ error: '未授權的管理操作：密碼錯誤或未提供' }, 401);
    }

    const deleted = await deleteSurveyResponse(env.DB, id);
    if (!deleted) {
      return jsonResponse({ error: '找不到該筆紀錄或已刪除' }, 404);
    }

    // Broadcast delete event
    await broadcastEvent(env, {
      type: 'DELETE_RESPONSE',
      payload: { id },
    });

    return jsonResponse({ message: '填答已成功刪除', id });
  }

  // GET /api/export (CSV export)
  if (path === '/api/export' && request.method === 'GET') {
    const responses = await getAllResponses(env.DB);
    const csvContent = generateCsv(responses);

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="japan_trip_survey_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  return jsonResponse({ error: 'API 路徑不存在' }, 404);
}

async function broadcastEvent(env: Env, event: any) {
  if (!env.SURVEY_ROOM) return;
  try {
    const doId = env.SURVEY_ROOM.idFromName('global_survey_room');
    const obj = env.SURVEY_ROOM.get(doId);
    await obj.fetch('http://durable-object/broadcast', {
      method: 'POST',
      body: JSON.stringify(event),
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    // Durable Object broadcast failure should not block HTTP response
    console.error('Broadcast failed:', e);
  }
}

function generateCsv(responses: any[]): string {
  // UTF-8 BOM so Excel opens traditional Chinese correctly
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
    '填答時間(UTC)'
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
    escapeCsv(r.created_at)
  ]);

  return BOM + [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
}

function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

function getCorsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-password',
  };
}

function addCorsAndSecurityHeaders(res: Response): Response {
  const newHeaders = new Headers(res.headers);
  newHeaders.set('Access-Control-Allow-Origin', '*');
  newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-password');
  newHeaders.set('X-Content-Type-Options', 'nosniff');
  newHeaders.set('X-Frame-Options', 'DENY');
  newHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: newHeaders,
  });
}
