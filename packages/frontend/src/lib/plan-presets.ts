import { Shield, Crown, Zap, Star, Trophy, Gem, Rocket, Flame, Swords, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const ICON_OPTIONS = ["shield", "crown", "zap", "star", "trophy", "gem", "rocket", "flame", "swords", "target"] as const;
export type PlanIconKey = typeof ICON_OPTIONS[number];

export const COLOR_OPTIONS = ["blue", "yellow", "purple", "green", "red", "orange", "pink", "cyan", "indigo", "teal"] as const;
export type PlanColorKey = typeof COLOR_OPTIONS[number];

export const ICON_COMPONENTS: Record<PlanIconKey, LucideIcon> = {
  shield:  Shield,
  crown:   Crown,
  zap:     Zap,
  star:    Star,
  trophy:  Trophy,
  gem:     Gem,
  rocket:  Rocket,
  flame:   Flame,
  swords:  Swords,
  target:  Target,
};

export const COLOR_CLASSES: Record<PlanColorKey, { icon: string; gradient: string; border: string }> = {
  blue:   { icon: "text-blue-500",   gradient: "from-blue-500/20 to-blue-500/5",   border: "border-blue-500/30"   },
  yellow: { icon: "text-yellow-500", gradient: "from-yellow-500/20 to-yellow-500/5", border: "border-yellow-500/30" },
  purple: { icon: "text-purple-500", gradient: "from-purple-500/20 to-purple-500/5", border: "border-purple-500/30" },
  green:  { icon: "text-green-500",  gradient: "from-green-500/20 to-green-500/5",  border: "border-green-500/30"  },
  red:    { icon: "text-red-500",    gradient: "from-red-500/20 to-red-500/5",      border: "border-red-500/30"    },
  orange: { icon: "text-orange-500", gradient: "from-orange-500/20 to-orange-500/5", border: "border-orange-500/30" },
  pink:   { icon: "text-pink-500",   gradient: "from-pink-500/20 to-pink-500/5",   border: "border-pink-500/30"   },
  cyan:   { icon: "text-cyan-500",   gradient: "from-cyan-500/20 to-cyan-500/5",   border: "border-cyan-500/30"   },
  indigo: { icon: "text-indigo-500", gradient: "from-indigo-500/20 to-indigo-500/5", border: "border-indigo-500/30" },
  teal:   { icon: "text-teal-500",   gradient: "from-teal-500/20 to-teal-500/5",   border: "border-teal-500/30"   },
};

export function getPlanIcon(iconKey: string): LucideIcon {
  return ICON_COMPONENTS[iconKey as PlanIconKey] ?? Shield;
}

export function getPlanColors(colorKey: string) {
  return COLOR_CLASSES[colorKey as PlanColorKey] ?? COLOR_CLASSES.blue;
}

export const ICON_LABELS: Record<PlanIconKey, string> = {
  shield:  "Escudo",
  crown:   "Coroa",
  zap:     "Raio",
  star:    "Estrela",
  trophy:  "Troféu",
  gem:     "Gema",
  rocket:  "Foguete",
  flame:   "Chama",
  swords:  "Espadas",
  target:  "Alvo",
};

export const COLOR_LABELS: Record<PlanColorKey, string> = {
  blue:   "Azul",
  yellow: "Amarelo",
  purple: "Roxo",
  green:  "Verde",
  red:    "Vermelho",
  orange: "Laranja",
  pink:   "Rosa",
  cyan:   "Ciano",
  indigo: "Índigo",
  teal:   "Verde-Azul",
};
