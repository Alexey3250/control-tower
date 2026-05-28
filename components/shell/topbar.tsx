"use client";

import { ROLES, useRole } from "@/lib/role-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { NotificationsBell } from "@/components/shell/notifications-bell";

interface TopbarProps {
  title: string;
  subtitle?: string;
  meta?: React.ReactNode;
}

export function Topbar({ title, subtitle, meta }: TopbarProps) {
  const { role, setRole } = useRole();

  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center gap-3 border-b border-jx-border bg-white/95 backdrop-blur px-3 pl-14 md:px-6 md:pl-6">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
          <h1 className="text-base md:text-xl text-jx-text font-semibold truncate">
            {title}
          </h1>
          <div className="hidden sm:block">{meta}</div>
        </div>
        {subtitle ? (
          <div className="text-[11px] md:text-xs text-jx-muted truncate">
            {subtitle}
          </div>
        ) : null}
      </div>

      <div className="hidden md:flex items-center gap-3">
        <Badge variant="outline" className="hidden lg:inline-flex">
          Live · 30s refresh
        </Badge>

        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-jx-muted">
            View
          </span>
          <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
            <SelectTrigger className="w-[160px] lg:w-[180px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <NotificationsBell />
      </div>

      <div className="md:hidden flex items-center gap-1">
        <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
          <SelectTrigger className="h-8 px-2 text-xs w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <NotificationsBell />
      </div>
    </header>
  );
}
