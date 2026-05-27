import Image from "next/image";
import { MapPin, Phone } from "lucide-react";
import { BUILDER } from "@/config/builder";
import { LinkedInIcon, WhatsAppIcon } from "./builder-icons";
import { cn } from "@/lib/utils";

/**
 * "About the builder" identity block — photo + name + Dubai location +
 * LinkedIn + WhatsApp call-to-actions. Used at three sizes:
 *
 *   variant="hero"    — large feature on /about
 *   variant="footer"  — medium attribution at the bottom of every page
 *   variant="compact" — tiny avatar+name pinned bottom-left of the side nav
 *
 * Designed so an HR person who opens this on a phone can either tap
 * "Message on WhatsApp" or "Open LinkedIn" in one tap, and so if she
 * forwards a screenshot to a hiring manager the contact details are
 * already legible without zooming.
 */

interface BuilderCardProps {
  variant?: "hero" | "footer" | "compact";
  className?: string;
}

export function BuilderCard({
  variant = "footer",
  className,
}: BuilderCardProps) {
  if (variant === "compact") {
    return (
      <a
        href={BUILDER.links.linkedinUrl}
        target="_blank"
        rel="noreferrer"
        className={cn(
          "group flex items-center gap-2.5 px-3 py-2 rounded-md border border-jx-border hover:border-jx-orange/40 hover:bg-jx-orange-tint/40 transition-colors",
          className
        )}
        title={`${BUILDER.name} — open LinkedIn`}
      >
        <Image
          src={BUILDER.photo}
          alt={BUILDER.name}
          width={32}
          height={32}
          className="h-8 w-8 rounded-full object-cover ring-1 ring-jx-border"
        />
        <div className="leading-tight min-w-0">
          <div className="text-xs font-semibold text-jx-text truncate">
            Built by {BUILDER.name}
          </div>
          <div className="text-[10px] text-jx-muted flex items-center gap-1">
            <LinkedInIcon
              size={9}
              className="text-jx-orange group-hover:text-jx-orange-deep"
            />
            <span className="truncate">{BUILDER.links.linkedinHandle}</span>
          </div>
        </div>
      </a>
    );
  }

  /* Hero + footer share most of the markup; only the surrounding chrome and
     typography sizes change. */
  const isHero = variant === "hero";
  return (
    <div
      className={cn(
        "rounded-lg border bg-white",
        isHero
          ? "border-jx-orange/35 shadow-[0_2px_18px_-6px_rgba(243,112,33,0.18)]"
          : "border-jx-border",
        isHero ? "p-5 md:p-7" : "p-4 md:p-5",
        className
      )}
    >
      <div
        className={cn(
          "flex gap-4 md:gap-6 items-start",
          isHero ? "flex-col md:flex-row md:items-center" : "flex-col sm:flex-row sm:items-center"
        )}
      >
        {/* Photo — circular framed portrait. */}
        <div className="relative shrink-0">
          {isHero ? (
            <span
              aria-hidden
              className="absolute -inset-1 rounded-full bg-linear-to-br from-jx-orange/40 to-jx-orange-deep/30 blur-md"
            />
          ) : null}
          <Image
            src={BUILDER.photo}
            alt={BUILDER.name}
            width={isHero ? 156 : 96}
            height={isHero ? 156 : 96}
            priority={isHero}
            className={cn(
              "relative rounded-full object-cover ring-2 ring-white shadow-md",
              isHero
                ? "h-32 w-32 md:h-40 md:w-40"
                : "h-20 w-20 md:h-24 md:w-24"
            )}
          />
        </div>

        {/* Identity + contact */}
        <div className="flex-1 min-w-0 space-y-2.5">
          <div>
            <div
              className={cn(
                "inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] font-semibold text-jx-orange",
                isHero ? "" : "text-[9px]"
              )}
            >
              About the builder
              <span className="text-jx-subtle">·</span>
              <span className="text-jx-muted normal-case tracking-normal">
                hire signal, not just a screenshot
              </span>
            </div>
            <h3
              className={cn(
                "mt-1 font-semibold text-jx-text leading-tight",
                isHero ? "text-3xl md:text-4xl" : "text-xl md:text-2xl"
              )}
            >
              {BUILDER.name}
            </h3>
            <p
              className={cn(
                "text-jx-muted",
                isHero ? "text-[14px] mt-1" : "text-[12px] mt-0.5"
              )}
            >
              {BUILDER.tagline}
            </p>
          </div>

          {isHero ? (
            <p className="text-[13px] text-jx-text/85 leading-relaxed max-w-2xl">
              {BUILDER.pitch}
            </p>
          ) : null}

          {/* Contact CTAs — large enough to tap on a phone. */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <a
              href={BUILDER.links.linkedinUrl}
              target="_blank"
              rel="noreferrer"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md font-semibold transition-colors",
                "bg-[#0a66c2] hover:bg-[#0856a8] text-white",
                isHero ? "px-3.5 py-2 text-sm" : "px-3 py-1.5 text-xs"
              )}
            >
              <LinkedInIcon size={isHero ? 14 : 12} />
              LinkedIn ·{" "}
              <span className="font-normal opacity-90">
                {BUILDER.links.linkedinHandle.replace(/^linkedin\.com\//, "")}
              </span>
            </a>
            <a
              href={BUILDER.links.whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md font-semibold transition-colors",
                "bg-[#25d366] hover:bg-[#1ebe5d] text-white",
                isHero ? "px-3.5 py-2 text-sm" : "px-3 py-1.5 text-xs"
              )}
            >
              <WhatsAppIcon size={isHero ? 14 : 12} />
              WhatsApp ·{" "}
              <span className="font-normal opacity-90">
                {BUILDER.links.phoneDisplay}
              </span>
            </a>
            <a
              href={`tel:${BUILDER.links.phoneE164}`}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border font-semibold transition-colors",
                "border-jx-border text-jx-text hover:bg-jx-panel hover:border-jx-text/30",
                isHero ? "px-3.5 py-2 text-sm" : "px-3 py-1.5 text-xs"
              )}
            >
              <Phone className={isHero ? "h-3.5 w-3.5" : "h-3 w-3"} />
              Call
            </a>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-jx-muted pt-0.5">
            <MapPin className="h-3 w-3 text-jx-orange" />
            {BUILDER.location}
          </div>
        </div>
      </div>
    </div>
  );
}
