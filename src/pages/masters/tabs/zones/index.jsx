import { GenericMasterTab } from "../../components/GenericMasterTab";
import { getMasterTabConfig } from "../../master-tabs";

export default function ZonesTab() {
  const config = getMasterTabConfig("zone");
  return <GenericMasterTab config={config} />;
}
