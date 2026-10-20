import { WebSocketMessage } from './types';

export class SurveyRoom {
  state: DurableObjectState;
  sessions: Set<WebSocket>;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.sessions = new Set();
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // 1. WebSocket upgrade
    if (url.pathname === '/ws') {
      if (request.headers.get('Upgrade') !== 'websocket') {
        return new Response('Expected websocket', { status: 426 });
      }

      const pair = new WebSocketPair();
      const client = pair[0];
      const server = pair[1];

      this.handleWebSocket(server);

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    // 2. HTTP broadcast hook from Worker
    if (url.pathname === '/broadcast' && request.method === 'POST') {
      try {
        const body = await request.text();
        this.broadcastRaw(body);
        return new Response(JSON.stringify({ success: true, count: this.sessions.size }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response('Not found', { status: 404 });
  }

  handleWebSocket(ws: WebSocket) {
    ws.accept();
    this.sessions.add(ws);

    // Send INIT confirmation
    const initMsg: WebSocketMessage = {
      type: 'INIT',
      payload: { status: 'connected', clientsCount: this.sessions.size }
    };
    try {
      ws.send(JSON.stringify(initMsg));
    } catch {
      // ignore
    }

    ws.addEventListener('message', async (event) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : null;
        if (data && data.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
        }
      } catch {
        // invalid message ignored
      }
    });

    const closeHandler = () => {
      this.sessions.delete(ws);
    };

    ws.addEventListener('close', closeHandler);
    ws.addEventListener('error', closeHandler);
  }

  broadcastRaw(message: string) {
    for (const session of this.sessions) {
      try {
        session.send(message);
      } catch {
        this.sessions.delete(session);
      }
    }
  }

  broadcast(message: WebSocketMessage) {
    this.broadcastRaw(JSON.stringify(message));
  }
}
