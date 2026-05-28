import { Sidenav } from "@/components/shell/sidenav";
import { MobileNav } from "@/components/shell/mobile-nav";
import { PortfolioFooter } from "@/components/shell/portfolio-footer";
import { RoutePrefetcher } from "@/components/shell/route-prefetcher";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-jx-bg text-jx-text relative">
      {/* Soft pinstripe pattern on the dashboard surface — adds depth without
          darkening anything. The pattern fades out on small screens to keep
          mobile clean. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden md:block"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(17,17,17,0.025) 1px, transparent 1px), linear-gradient(to bottom, rgba(17,17,17,0.02) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 0%, #000 0%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 60% at 50% 0%, #000 0%, transparent 75%)",
        }}
      />
      <Sidenav />
      <MobileNav />
      <main className="flex-1 min-w-0 flex flex-col min-h-screen relative">
        {children}
        <PortfolioFooter />
      </main>
      {/* Warms every top-level route's RSC payload during browser idle
          time, so clicking a sidenav tab is "instant" — see
          components/shell/route-prefetcher.tsx for details. */}
      <RoutePrefetcher />
    </div>
  );
}
