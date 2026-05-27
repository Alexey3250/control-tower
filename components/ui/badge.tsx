import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium tracking-wide uppercase transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-jx-border bg-jx-panel text-jx-muted",
        outline: "border-jx-border-strong text-jx-text",
        gold: "border-transparent bg-accent text-accent-foreground",
        healthy:
          "border-transparent bg-jx-healthy/15 text-jx-healthy ring-1 ring-jx-healthy/40",
        watch:
          "border-transparent bg-jx-watch/15 text-jx-watch ring-1 ring-jx-watch/40",
        critical:
          "border-transparent bg-jx-critical/20 text-jx-critical ring-1 ring-jx-critical/40",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
