"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Globe2,
  Rocket,
  Calculator,
  Award,
  Plane,
  PlaneTakeoff,
  Gauge,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRole } from "@/lib/role-context";
import type { UserRole } from "@/lib/types";
import { BuilderCard } from "./builder-card";

const NAV: Array<{
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  visibleTo: UserRole[];
}> = [
  {
    href: "/",
    label: "Network Overview",
    icon: LayoutDashboard,
    visibleTo: ["Network Director", "Station Manager", "Vendor Manager"],
  },
  {
    href: "/map",
    label: "Operations Map",
    icon: Globe2,
    visibleTo: ["Network Director", "Station Manager", "Vendor Manager"],
  },
  {
    href: "/fleet",
    label: "Fleet Intelligence",
    icon: PlaneTakeoff,
    visibleTo: ["Network Director", "Station Manager"],
  },
  {
    href: "/stations",
    label: "Station Risk",
    icon: Gauge,
    visibleTo: ["Network Director", "Station Manager"],
  },
  {
    href: "/launches",
    label: "Launch Tracker",
    icon: Rocket,
    visibleTo: ["Network Director", "Station Manager"],
  },
  {
    href: "/feasibility",
    label: "Feasibility Studio",
    icon: Calculator,
    visibleTo: ["Network Director"],
  },
  {
    href: "/vendors",
    label: "Vendor Scorecard",
    icon: Award,
    visibleTo: ["Network Director", "Vendor Manager"],
  },
  {
    href: "/about",
    label: "About / Tech Stack",
    icon: Info,
    visibleTo: ["Network Director", "Station Manager", "Vendor Manager"],
  },
];

export function Sidenav() {
  const pathname = usePathname();
  const { role } = useRole();
  const items = NAV.filter((n) => n.visibleTo.includes(role));
  return (
    <aside className="hidden md:flex h-screen w-60 shrink-0 flex-col border-r border-jx-border bg-white sticky top-0">
      <Link
        href="/"
        className="flex items-center gap-3 px-5 h-16 border-b border-jx-border hover:bg-jx-panel/60 transition-colors"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-jx-orange shadow-[0_2px_10px_rgba(243,112,33,0.35)]">
          <Plane className="h-5 w-5 text-white" strokeWidth={2.2} />
        </div>
        <div className="leading-tight">
          <div className="text-lg font-extrabold tracking-[0.05em] text-jx-text">
            JETEX
          </div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-jx-orange font-semibold">
            Control Tower
          </div>
        </div>
      </Link>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-jx-card text-jx-text border border-jx-border"
                  : "text-jx-muted hover:bg-jx-card/60 hover:text-jx-text border border-transparent"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4",
                  active ? "text-jx-gold" : "text-jx-muted"
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-jx-border space-y-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-jx-subtle">
            Active role
          </div>
          <div className="mt-1 text-xs text-jx-text">{role}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-jx-subtle">
            Live data feeds
          </div>
          <div className="mt-1 text-xs text-jx-muted leading-relaxed">
            OpenSky · NOAA · Open-Meteo · OurAirports
          </div>
        </div>
        <div className="pt-3 border-t border-jx-border/60">
          <BuilderCard variant="compact" />
        </div>
      </div>
    </aside>
  );
}
