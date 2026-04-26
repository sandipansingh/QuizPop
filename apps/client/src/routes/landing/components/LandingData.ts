import {
  ChartNoAxesColumn,
  Sparkles,
  Timer,
  Trophy,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export interface FeatureItem {
  title: string;
  description: string;
  icon: LucideIcon;
  tone: 'violet' | 'pink' | 'yellow' | 'mint';
}

export const featureItems: FeatureItem[] = [
  {
    title: 'Real-time Collaboration',
    description:
      'Host quiz rooms, invite friends, and watch scoreboards update instantly.',
    icon: Users,
    tone: 'violet',
  },
  {
    title: 'Smart Progression',
    description:
      'Earn XP, maintain streaks, and unlock higher-level challenge sessions.',
    icon: Zap,
    tone: 'pink',
  },
  {
    title: 'Advanced Insights',
    description:
      'Track accuracy, average response speed, and long-term growth by category.',
    icon: ChartNoAxesColumn,
    tone: 'yellow',
  },
  {
    title: 'Timed Precision',
    description:
      'Every question is a sprint. Faster and correct answers bring better scores.',
    icon: Timer,
    tone: 'mint',
  },
  {
    title: 'Competitive Rankings',
    description:
      'Climb the global leaderboard with every completed solo or room challenge.',
    icon: Trophy,
    tone: 'violet',
  },
  {
    title: 'Smart Question System',
    description:
      'Difficulty adapts to your skill, repeated questions are filtered out, multiplayer stays fair, and progression feels dynamic.',
    icon: Sparkles,
    tone: 'mint',
  },
];

export const steps = [
  {
    title: 'Create Your Profile',
    description:
      'Register in seconds and personalize your identity before your first battle.',
  },
  {
    title: 'Join A Quiz Mode',
    description:
      'Pick solo challenge mode or jump into a real-time room with friends.',
  },
  {
    title: 'Track And Improve',
    description:
      'Review stats, optimize speed, and return stronger in every new round.',
  },
];

export const cornerColors: Record<string, string> = {
  violet: 'bg-accent',
  pink: 'bg-[#ec4899]',
  yellow: 'bg-[#fbbf24]',
  mint: 'bg-[#34d399]',
};
