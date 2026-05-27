import Link from "next/link";
import { Plane } from "lucide-react";
import { BuilderCard } from "./builder-card";
import { BUILDER } from "@/config/builder";

/**
 * Footer pinned beneath every dashboard page. Carries two things, in order
 * of priority:
 *
 *   1. The builder card — photo, name, Dubai phone, WhatsApp, LinkedIn.
 *      Visible on every screen so an HR recruiter who screenshots ANY page
 *      ships the contact info alongside the screenshot.
 *   2. Disclaimers + a small project lockup so the screenshot also makes
 *      it clear this is a portfolio piece, not real Jetex software.
 */
export function PortfolioFooter() {
  return (
    <footer className="border-t border-jx-border bg-jx-panel/60 mt-8">
      <div className="jx-gold-line h-px" />
      <div className="px-4 md:px-6 py-5 md:py-6 max-w-[1400px] mx-auto space-y-4">
        {/* Big builder block. Always visible, always tappable. */}
        <BuilderCard variant="footer" />

        {/* Project + disclaimer lockup. */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pt-1 text-xs">
          <div className="flex items-center gap-3 text-jx-muted">
            <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-jx-orange">
              <Plane className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <div className="text-jx-text">
                <span className="font-display tracking-wide">JETEX</span>{" "}
                <span className="text-jx-muted">Network Operations Control Tower</span>
              </div>
              <div className="text-[11px] text-jx-subtle">
                Portfolio demonstration by {BUILDER.name} · not affiliated with
                Jetex Flight Support · operational figures are synthetic
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-jx-muted">
            <Link
              href="/about"
              className="hover:text-jx-orange transition-colors"
            >
              About this project
            </Link>
            <Link
              href="/about#tech-stack"
              className="hover:text-jx-orange transition-colors hidden sm:inline"
            >
              Tech stack
            </Link>
            <Link
              href="/about#data-sources"
              className="hover:text-jx-orange transition-colors hidden sm:inline"
            >
              Data sources
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
