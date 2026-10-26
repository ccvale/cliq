import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '@/lib/api';
import { realtime } from '@/lib/realtime';
import type { MatchSummary } from '@/lib/types';
import { useSession } from './session';

type MatchesValue = {
  matches: MatchSummary[];
  loading: boolean;
  unreadTotal: number;
  refresh: () => Promise<void>;
  markRead: (matchId: string) => void;
  remove: (matchId: string) => void;
};

const MatchesContext = createContext<MatchesValue | null>(null);

/** Keeps the conversation list live: new matches, new messages and unmatches arrive over the socket. */
export function MatchesProvider({ children }: { children: ReactNode }) {
  const { status, me } = useSession();
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setMatches((await api.matches()).matches);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status !== 'signedIn') return;
    void refresh();
    return realtime.subscribe((event) => {
      if (event.type === 'match:new') void refresh();
      if (event.type === 'match:ended') setMatches((list) => list.filter((m) => m.id !== event.matchId));
      if (event.type === 'presence') {
        setMatches((list) =>
          list.map((m) => (m.person.id === event.userId ? { ...m, online: event.online, lastActiveAt: event.at } : m)),
        );
      }
      if (event.type === 'message:new') {
        const { message } = event;
        setMatches((list) => {
          const found = list.find((m) => m.id === message.matchId);
          if (!found) {
            void refresh();
            return list;
          }
          const fromMe = message.senderId === me?.id;
          const updated: MatchSummary = {
            ...found,
            lastMessage: { body: message.kind === 'image' ? '📷 Photo' : message.kind === 'gif' ? 'GIF' : message.body, fromMe, at: message.createdAt },
            unread: fromMe ? found.unread : found.unread + 1,
          };
          return [updated, ...list.filter((m) => m.id !== found.id)];
        });
      }
    });
  }, [status, me?.id]);

  const value: MatchesValue = {
    matches,
    loading,
    unreadTotal: matches.reduce((n, m) => n + m.unread, 0),
    refresh,
    markRead: (id) => setMatches((list) => list.map((m) => (m.id === id ? { ...m, unread: 0 } : m))),
    remove: (id) => setMatches((list) => list.filter((m) => m.id !== id)),
  };
  return <MatchesContext.Provider value={value}>{children}</MatchesContext.Provider>;
}

export function useMatches() {
  const value = useContext(MatchesContext);
  if (!value) throw new Error('useMatches must be used inside MatchesProvider');
  return value;
}
