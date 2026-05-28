"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  AlertOctagon,
  AlertTriangle,
  ArrowUpRight,
  Bell,
  BellRing,
  CheckCheck,
  Info,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type AlertTone = "critical" | "watch" | "info";

interface Alert {
  id: string;
  tone: AlertTone;
  title: string;
  body: string;
  href: string;
  metric?: string;
  timestamp: string;
}

interface AlertsPayload {
  generatedAt: string;
  alerts: Alert[];
}

const TONE: Record<
  AlertTone,
  { icon: React.ReactNode; chip: string; rail: string; label: string }
> = {
  critical: {
    icon: <AlertOctagon className="h-3.5 w-3.5" />,
    chip: "bg-jx-critical/15 text-jx-critical",
    rail: "bg-jx-critical",
    label: "Critical",
  },
  watch: {
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    chip: "bg-jx-watch/15 text-jx-watch",
    rail: "bg-jx-watch",
    label: "Watch",
  },
  info: {
    icon: <Info className="h-3.5 w-3.5" />,
    chip: "bg-jx-orange/15 text-jx-orange",
    rail: "bg-jx-orange",
    label: "Info",
  },
};

const READ_KEY = "jx-notifications-read-v1";

const EMPTY_SNAPSHOT = "[]";

/** Read the raw localStorage value (string) — pure, no parsing. */
function readLocalStorage(): string {
  if (typeof window === "undefined") return EMPTY_SNAPSHOT;
  try {
    return window.localStorage.getItem(READ_KEY) ?? EMPTY_SNAPSHOT;
  } catch {
    return EMPTY_SNAPSHOT;
  }
}

/** Persist + notify in-tab subscribers via a synthetic storage event. */
function writeLocalStorage(value: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(READ_KEY, value);
    /* Native `storage` events only fire across tabs. For same-tab
       subscribers (the useSyncExternalStore below), dispatch one
       manually so the bell re-reads after a write. */
    window.dispatchEvent(new StorageEvent("storage", { key: READ_KEY }));
  } catch {
    /* localStorage unavailable (private mode / quota); ignore. */
  }
}

function timeAgo(iso: string, now: number): string {
  const t = new Date(iso).getTime();
  const ms = Math.max(0, now - t);
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function parseReadSet(raw: string): Set<string> {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set();
  }
}

/* Stable subscribe / getServerSnapshot for useSyncExternalStore — must be
   declared module-level so their identity is preserved across renders. */
function subscribeStorage(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = (e: StorageEvent) => {
    if (e.key === null || e.key === READ_KEY) onStoreChange();
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}
function getServerSnapshot() {
  return EMPTY_SNAPSHOT;
}

export function NotificationsBell() {
  const [open, setOpen] = React.useState(false);

  /* SSR-safe localStorage read using React 19's recommended pattern.
     Initial server snapshot is "[]" → no hydration mismatch. After
     mount the client picks up the real persisted value, and any write
     dispatches a synthetic `storage` event that re-triggers the hook. */
  const rawReadSet = React.useSyncExternalStore(
    subscribeStorage,
    readLocalStorage,
    getServerSnapshot
  );
  const readSet = React.useMemo(() => parseReadSet(rawReadSet), [rawReadSet]);

  const { data, isLoading, isError } = useQuery<AlertsPayload>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) throw new Error(`notifications ${res.status}`);
      return (await res.json()) as AlertsPayload;
    },
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  const alerts = React.useMemo(() => data?.alerts ?? [], [data]);
  const unread = React.useMemo(
    () => alerts.filter((a) => !readSet.has(a.id)),
    [alerts, readSet]
  );
  const unreadCount = unread.length;
  const criticalCount = unread.filter((a) => a.tone === "critical").length;

  const markAllRead = React.useCallback(() => {
    if (alerts.length === 0) return;
    const next = new Set(readSet);
    for (const a of alerts) next.add(a.id);
    writeLocalStorage(JSON.stringify([...next]));
  }, [alerts, readSet]);

  const markOneRead = React.useCallback(
    (id: string) => {
      if (readSet.has(id)) return;
      const next = new Set(readSet);
      next.add(id);
      writeLocalStorage(JSON.stringify([...next]));
    },
    [readSet]
  );

  /* When the popover opens, mark everything as read after a short
     dwell — gives the user a moment to register the unread state. */
  React.useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(markAllRead, 800);
    return () => window.clearTimeout(t);
  }, [open, markAllRead]);

  /* Use the server's `generatedAt` as the time reference so relative
     stamps are deterministic + don't trigger an impure Date.now() during
     render. */
  const now = data ? new Date(data.generatedAt).getTime() : 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={
            unreadCount > 0
              ? `${unreadCount} unread notifications`
              : "Notifications"
          }
          className="relative"
        >
          {unreadCount > 0 ? (
            <BellRing className="h-4 w-4 text-jx-text" />
          ) : (
            <Bell className="h-4 w-4 text-jx-muted" />
          )}
          {unreadCount > 0 ? (
            <span
              aria-hidden
              className="absolute top-1 right-1 flex h-2 w-2"
            >
              <span
                className={cn(
                  "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                  criticalCount > 0 ? "bg-jx-critical" : "bg-jx-orange"
                )}
              />
              <span
                className={cn(
                  "relative inline-flex h-2 w-2 rounded-full",
                  criticalCount > 0 ? "bg-jx-critical" : "bg-jx-orange"
                )}
              />
            </span>
          ) : null}
          {unreadCount > 0 ? (
            <span
              className={cn(
                "absolute -top-0.5 -right-1 min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center",
                "text-[9px] font-bold text-white font-mono",
                criticalCount > 0 ? "bg-jx-critical" : "bg-jx-orange"
              )}
            >
              {unreadCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-[360px] max-w-[92vw] p-0 overflow-hidden"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-jx-border bg-jx-panel/50">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-jx-orange" />
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-jx-text">
                Inbox
              </div>
              <div className="text-[10px] text-jx-muted">
                {isLoading
                  ? "Loading…"
                  : isError
                    ? "Feed unavailable"
                    : `${alerts.length} active · ${unreadCount} unread`}
              </div>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-[11px] px-2"
            onClick={markAllRead}
            disabled={alerts.length === 0 || unreadCount === 0}
          >
            <CheckCheck className="h-3 w-3" />
            Mark all read
          </Button>
        </div>

        <div className="max-h-[420px] overflow-y-auto">
          {isLoading ? (
            <div className="px-4 py-6 text-xs text-jx-muted text-center">
              Loading live alerts from network snapshot…
            </div>
          ) : isError ? (
            <div className="px-4 py-6 text-xs text-jx-critical text-center">
              Could not load notifications. Try again in a moment.
            </div>
          ) : alerts.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <div className="mx-auto mb-2 h-9 w-9 rounded-full bg-jx-healthy/15 grid place-items-center">
                <CheckCheck className="h-4 w-4 text-jx-healthy" />
              </div>
              <div className="text-xs font-semibold text-jx-text">
                All clear across the network
              </div>
              <div className="text-[11px] text-jx-muted mt-0.5">
                No critical or watch alerts at this time.
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-jx-border">
              {alerts.map((a) => {
                const t = TONE[a.tone];
                const isRead = readSet.has(a.id);
                return (
                  <li key={a.id} className="relative">
                    <span
                      aria-hidden
                      className={cn(
                        "absolute left-0 top-0 bottom-0 w-0.5",
                        t.rail,
                        isRead ? "opacity-30" : "opacity-100"
                      )}
                    />
                    <Link
                      href={a.href}
                      onClick={() => {
                        markOneRead(a.id);
                        setOpen(false);
                      }}
                      className={cn(
                        "block pl-3 pr-3 py-3 hover:bg-jx-panel/40 transition-colors group",
                        isRead && "opacity-65"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={cn(
                              "inline-flex items-center justify-center h-5 w-5 rounded-full shrink-0",
                              t.chip
                            )}
                          >
                            {t.icon}
                          </span>
                          <span
                            className={cn(
                              "inline-flex items-center px-1.5 py-0.5 rounded-sm text-[9px] font-bold tracking-widest uppercase",
                              t.chip
                            )}
                          >
                            {t.label}
                          </span>
                          {!isRead ? (
                            <span
                              aria-label="Unread"
                              className="h-1.5 w-1.5 rounded-full bg-jx-orange"
                            />
                          ) : null}
                        </div>
                        <ArrowUpRight className="h-3.5 w-3.5 text-jx-subtle group-hover:text-jx-orange transition-colors shrink-0" />
                      </div>
                      <div className="mt-1.5 text-[12.5px] font-semibold text-jx-text leading-snug">
                        {a.title}
                      </div>
                      <p className="mt-0.5 text-[11.5px] text-jx-muted leading-relaxed">
                        {a.body}
                      </p>
                      <div className="mt-1.5 flex items-center justify-between gap-2">
                        {a.metric ? (
                          <span className="font-mono text-[10px] text-jx-subtle">
                            {a.metric}
                          </span>
                        ) : (
                          <span />
                        )}
                        <span className="text-[10px] text-jx-subtle">
                          {timeAgo(a.timestamp, now)}
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="px-4 py-2.5 border-t border-jx-border bg-jx-panel/40 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] text-jx-muted">
            <span className="relative inline-flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-jx-healthy opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-jx-healthy" />
            </span>
            polling every 60s
          </div>
          <Button
            asChild
            variant="link"
            size="sm"
            className="h-auto p-0 text-[11px] text-jx-orange"
          >
            <Link href="/" onClick={() => setOpen(false)}>
              View all on overview
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
