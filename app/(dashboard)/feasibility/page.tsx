import { Topbar } from "@/components/shell/topbar";
import { Badge } from "@/components/ui/badge";
import { FeasibilityStudio } from "@/components/feasibility/studio";

export default function FeasibilityPage() {
  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar
        title="Feasibility Studio"
        subtitle="What-if model: pick a candidate city, tune inputs, get Go / Watch / No-Go"
        meta={<Badge variant="outline">3-yr NPV · 10% discount</Badge>}
      />
      <FeasibilityStudio />
    </div>
  );
}
