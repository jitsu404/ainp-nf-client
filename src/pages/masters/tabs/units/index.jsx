import { GenericMasterTab } from "../../components/GenericMasterTab";
import { getMasterTabConfig } from "../../master-tabs";

export default function UnitsTab() {
  const config = getMasterTabConfig("unit");
  return <GenericMasterTab config={config} />;
}
