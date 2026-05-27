import { Topbar } from "@/components/shell/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VendorHeatmap } from "@/components/vendors/vendor-heatmap";
import { getVendors } from "@/lib/data/api";

export default function VendorsPage() {
  const vendors = getVendors();
  const breaches = vendors.reduce((s, v) => s + v.slaBreaches, 0);
  const critical = vendors.filter((v) => v.overall < 65).length;
  const top = vendors.filter((v) => v.overall >= 88).length;

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar
        title="Vendor Scorecard"
        subtitle={`${vendors.length} vendors Â· ${breaches} SLA breaches this period Â· ${critical} below threshold`}
        meta={<Badge variant="outline">Network-wide</Badge>}
      />

      <div className="flex-1 p-4 md:p-6 space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-[10px] uppercase tracking-wider text-jx-muted">
                Vendors tracked
              </div>
              <div className="font-display text-3xl text-jx-text">
                {vendors.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-[10px] uppercase tracking-wider text-jx-muted">
                Top performers
              </div>
              <div className="font-display text-3xl text-jx-healthy">{top}</div>
              <div className="text-xs text-jx-muted">Overall â‰¥ 88</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-[10px] uppercase tracking-wider text-jx-muted">
                Below threshold
              </div>
              <div className="font-display text-3xl text-jx-critical">
                {critical}
              </div>
              <div className="text-xs text-jx-muted">Overall &lt; 65</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-[10px] uppercase tracking-wider text-jx-muted">
                Total contract value
              </div>
              <div className="font-display text-3xl text-jx-text">
                $
                {(
                  vendors.reduce((s, v) => s + v.contractValueUsd, 0) /
                  1_000_000
                ).toFixed(1)}
                M
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-5">
            <VendorHeatmap vendors={vendors} />
          </CardContent>
        </Card>

        <div className="text-xs text-jx-muted">
          Cells are coloured by score band: â‰¥88 healthy Â· 68-87 watch Â· &lt;68
          critical. Click a cell to inspect the 12-week trend.
        </div>
      </div>
    </div>
  );
}
