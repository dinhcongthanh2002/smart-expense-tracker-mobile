import {
  Utensils, Coffee, ShoppingCart, ShoppingBag, Car, Bus, TrainFront, Bike, Fuel,
  Plane, House, Zap, Lightbulb, Droplet, Droplets, Wifi, Smartphone, Phone,
  HeartPulse, Pill, Stethoscope, GraduationCap, Book, Gamepad2, Film, Music,
  Dumbbell, Dog, Shirt, Gift, Baby, PiggyBank, Wallet, Banknote, CreditCard,
  Coins, HandCoins, Briefcase, Landmark, Receipt, TrendingUp, Heart, HandHeart,
  Tag, Ellipsis,
} from "lucide-react-native";

import type { ComponentType } from "react";

export type IconComponent = ComponentType<{
  color?: string;
  size?: number;
  strokeWidth?: number;
}>;

/**
 * Shared category icon set. Keys are Lucide kebab-case names — store THIS string
 * in the backend's Category.icon. Both the web admin (`lucide-react`) and this
 * app (`lucide-react-native`) render the same name identically, no per-platform
 * mapping needed.
 */
export const CATEGORY_ICONS: Record<string, IconComponent> = {
  utensils: Utensils,
  coffee: Coffee,
  "shopping-cart": ShoppingCart,
  "shopping-bag": ShoppingBag,
  car: Car,
  bus: Bus,
  "train-front": TrainFront,
  bike: Bike,
  fuel: Fuel,
  plane: Plane,
  house: House,
  zap: Zap,
  lightbulb: Lightbulb,
  droplet: Droplet,
  droplets: Droplets,
  wifi: Wifi,
  smartphone: Smartphone,
  phone: Phone,
  "heart-pulse": HeartPulse,
  pill: Pill,
  stethoscope: Stethoscope,
  "graduation-cap": GraduationCap,
  book: Book,
  "gamepad-2": Gamepad2,
  film: Film,
  music: Music,
  dumbbell: Dumbbell,
  dog: Dog,
  shirt: Shirt,
  gift: Gift,
  baby: Baby,
  "piggy-bank": PiggyBank,
  wallet: Wallet,
  banknote: Banknote,
  "credit-card": CreditCard,
  coins: Coins,
  "hand-coins": HandCoins,
  briefcase: Briefcase,
  landmark: Landmark,
  receipt: Receipt,
  "trending-up": TrendingUp,
  heart: Heart,
  "hand-heart": HandHeart,
  tag: Tag,
  ellipsis: Ellipsis,
};

export const CATEGORY_ICON_NAMES = Object.keys(CATEGORY_ICONS);

export const DEFAULT_CATEGORY_ICON = "tag";

/** Resolve a stored icon name to a component; unknown names → a neutral tag. */
export function getCategoryIcon(name?: string | null): IconComponent {
  return (name && CATEGORY_ICONS[name]) || Tag;
}
