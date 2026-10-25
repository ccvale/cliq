import { API_URL, session } from './api';
import type { ServerEvent } from './types';

type Listener = (event: ServerEvent) => void;

/** A single self-healing socket shared by every screen. */
class Realtime {
  private ws: WebSocket | null = null;
  private listeners = new Set<Listener>();
  private retry = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private heartbeat: ReturnType<typeof setInterval> | null = null;
  private wanted = false;

  start() {
    this.wanted = true;
    if (!this.ws) this.connect();
  }

  stop() {
    this.wanted = false;
    if (this.timer) clearTimeout(this.timer);
    if (this.heartbeat) clearInterval(this.heartbeat);
    this.ws?.close();
    this.ws = null;
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => void this.listeners.delete(fn);
  }

  send(event: { type: 'typing'; matchId: string }) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(event));
  }

  private connect() {
    const token = session.token();
    if (!token) return this.scheduleReconnect();
    const ws = new WebSocket(API_URL.replace(/^http/, 'ws') + '/ws');
    this.ws = ws;
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'auth', token }));
      this.heartbeat = setInterval(() => ws.readyState === WebSocket.OPEN && ws.send('{"type":"ping"}'), 25_000);
    };
    ws.onmessage = (e) => {
      try {
        const event = JSON.parse(String(e.data)) as ServerEvent;
        if (event.type === 'ready') this.retry = 0;
        this.listeners.forEach((fn) => fn(event));
      } catch {}
    };
    ws.onclose = (e) => {
      if (this.heartbeat) clearInterval(this.heartbeat);
      // The access token expired; get a fresh one before reconnecting.
      if (e.code === 4401) void session.refresh();
      if (this.ws === ws) this.ws = null;
      if (this.wanted) this.scheduleReconnect();
    };
  }

  private scheduleReconnect() {
    if (this.timer) clearTimeout(this.timer);
    // Exponential backoff with jitter, capped at 30s.
    const delay = Math.min(30_000, 1000 * 2 ** this.retry++) * (0.6 + Math.random() * 0.4);
    this.timer = setTimeout(() => this.wanted && this.connect(), delay);
  }
}

export const realtime = new Realtime();
