import { BadgeCheck, BookOpen, Compass, MessageCircleHeart, MessagesSquare, Sparkles, UsersRound, type LucideIcon } from 'lucide-react-native';

/** Mirrors apps/server/src/lib/achievements.ts — keep the ids in sync. */
export const ACHIEVEMENTS: { id: string; title: string; description: string; target: number; icon: LucideIcon }[] = [
  { id: 'first-click', title: 'First Click', description: 'Make your first match', target: 1, icon: Sparkles },
  { id: 'icebreaker', title: 'Icebreaker', description: 'Send your first message', target: 1, icon: MessageCircleHeart },
  { id: 'open-book', title: 'Open Book', description: 'Add a photo, a bio and a prompt', target: 3, icon: BookOpen },
  { id: 'explorer', title: 'Explorer', description: 'Look at 50 profiles', target: 50, icon: Compass },
  { id: 'deep-talk', title: 'Deep Talk', description: 'Trade 25 messages with one friend', target: 25, icon: MessagesSquare },
  { id: 'inner-circle', title: 'Inner Circle', description: 'Make 5 friends', target: 5, icon: UsersRound },
  { id: 'verified', title: 'Verified', description: 'Confirm your email address', target: 1, icon: BadgeCheck },
];

export const achievement = (id: string) => ACHIEVEMENTS.find((a) => a.id === id);
