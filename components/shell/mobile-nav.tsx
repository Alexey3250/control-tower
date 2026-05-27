"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  Calculator,
  Globe2,
  Gauge,
  Info,
  LayoutDashboard,
  Menu,
  Plane,
  PlaneTakeoff,
  Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useRole } from "@/lib/role-context";
import { cn } from "@/lib/utils";
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

export function MobileNav() {
  const pathname = usePathname();
  const { role } = useRole();
  const items = NAV.filter((n) => n.visibleTo.includes(role));

  return (
    <div className="md:hidden fixed left-3 top-3 z-60">
      <Drawer>
        <DrawerTrigger asChild>
          <Button size="icon" variant="outline" className="bg-jx-elev/95">
            <Menu className="h-4 w-4" />
            <span className="sr-only">Open navigation</span>
          </Button>
        </DrawerTrigger>
        <DrawerContent side="left" className="max-w-[320px]">
          <DrawerHeader>
            <DrawerTitle>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-jx-red">
                  <Plane className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="font-display text-lg">JETEX</div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-jx-gold">
                    Control Tower
                  </div>
                </div>
              </div>
            </DrawerTitle>
          </DrawerHeader>
          <DrawerBody>
            <div className="space-y-1">
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
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors border",
                      active
                        ? "bg-jx-card text-jx-text border-jx-border"
                        : "text-jx-muted hover:bg-jx-card/60 hover:text-jx-text border-transparent"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4",
                        active ? "text-jx-gold" : "text-jx-muted"
                      )}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="mt-6 border-t border-jx-border pt-4 text-xs text-jx-muted">
              Active role: <span className="text-jx-text">{role}</span>
            </div>

            <div className="mt-4">
              <BuilderCard variant="compact" />
            </div>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
