/**
 * Página /admin/analytics — usa AnalyticsShell (layout próprio, denso).
 */
import { useAnalyticsState } from "@/components/admin/analytics/useAnalyticsState";
import AnalyticsShell from "@/components/admin/analytics/AnalyticsShell";
import OverviewTab from "@/components/admin/analytics/OverviewTab";
import AcquisitionTab from "@/components/admin/analytics/AcquisitionTab";
import BehaviorTab from "@/components/admin/analytics/BehaviorTab";
import ConversionTab from "@/components/admin/analytics/ConversionTab";
import RetentionTab from "@/components/admin/analytics/RetentionTab";
import PaidMediaTab from "@/components/admin/analytics/PaidMediaTab";
import RealtimeTab from "@/components/admin/analytics/RealtimeTab";
import GoogleAdsAudiencesTab from "@/components/admin/analytics/GoogleAdsAudiencesTab";
import SearchConsoleTab from "@/components/admin/analytics/SearchConsoleTab";

export default function AnalyticsPage() {
  const state = useAnalyticsState();

  return (
    <AnalyticsShell state={state}>
      {state.tab === "overview" && (
        <OverviewTab
          range={state.range}
          segments={state.segments}
          comparePrev={state.comparePrev}
        />
      )}
      {state.tab === "acquisition" && (
        <AcquisitionTab
          range={state.range}
          comparePrev={state.comparePrev}
          segments={state.segments}
          onAddSegment={state.addSegment}
          onRemoveSegment={state.removeSegment}
        />
      )}
      {state.tab === "behavior" && (
        <BehaviorTab
          range={state.range}
          segments={state.segments}
          onAddSegment={state.addSegment}
          onRemoveSegment={state.removeSegment}
        />
      )}
      {state.tab === "conversion" && (
        <ConversionTab
          range={state.range}
          segments={state.segments}
          comparePrev={state.comparePrev}
        />
      )}
      {state.tab === "retention" && <RetentionTab range={state.range} segments={state.segments} />}
      {state.tab === "paid" && (
        <PaidMediaTab range={state.range} comparePrev={state.comparePrev} segmentsCount={state.segments.length} />
      )}
      {state.tab === "gads" && <GoogleAdsAudiencesTab />}
      {state.tab === "search" && <SearchConsoleTab range={state.range} />}
      {state.tab === "realtime" && <RealtimeTab />}
    </AnalyticsShell>
  );
}
