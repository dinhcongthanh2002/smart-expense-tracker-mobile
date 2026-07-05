import { cn } from "@/lib/cn";
import { GlassSurface, type GlassSurfaceProps } from "./GlassSurface";

/** A padded Liquid Glass card. */
export function GlassCard({ className, ...props }: GlassSurfaceProps) {
  return <GlassSurface className={cn("p-4", className)} {...props} />;
}
