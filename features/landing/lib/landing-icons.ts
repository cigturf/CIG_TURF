import {
  Activity,
  Award,
  Calendar,
  Clock,
  Flame,
  Heart,
  Star,
  Target,
  Trophy,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

const LANDING_ICON_MAP: Record<string, LucideIcon> = {
  activity: Activity,
  award: Award,
  calendar: Calendar,
  clock: Clock,
  flame: Flame,
  heart: Heart,
  star: Star,
  target: Target,
  trophy: Trophy,
  users: Users,
  zap: Zap,
};

export function resolveLandingIcon(
  iconKey: string | null | undefined,
  fallback: LucideIcon,
): LucideIcon {
  if (!iconKey) return fallback;
  return LANDING_ICON_MAP[iconKey.toLowerCase()] ?? fallback;
}
