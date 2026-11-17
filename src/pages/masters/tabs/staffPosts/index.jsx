import { GenericMasterTab } from "../../components/GenericMasterTab";
import { getMasterTabConfig } from "../../master-tabs";

export default function StaffPostsTab() {
  const config = getMasterTabConfig("staffPost");
  return <GenericMasterTab config={config} />;
}
