import { Topbar } from "@/components/shell/topbar";
import { MapView } from "@/components/map/map-view";
import { getNetworkSnapshot } from "@/lib/data/api";
import { Badge } from "@/components/ui/badge";

export default function OperationsMapPage() {
  const snapshot = getNetworkSnapshot();

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar
        title="Operations Map"
        subtitle="Live network status with active aircraft and weather overlay"
        meta={
          <Badge variant="outline" className="font-mono">
            MapLibre · CARTO · OpenSky
          </Badge>
        }
      />
      <MapView snapshot={snapshot} />
    </div>
  );
}
