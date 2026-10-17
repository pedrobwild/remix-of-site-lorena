import AdminLayout from "@/components/admin/AdminLayout";
import RadarCollectionsPanel from "@/components/admin/RadarCollectionsPanel";

export default function ColetasRadarAdminPage() {
  return <AdminLayout active="coletas-radar" title="Coletas do Radar"><RadarCollectionsPanel /></AdminLayout>;
}