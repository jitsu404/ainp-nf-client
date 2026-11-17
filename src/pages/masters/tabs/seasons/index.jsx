import { GenericMasterTab } from "../../components/GenericMasterTab";
import { getMasterTabConfig } from "../../master-tabs";

export default function SeasonsTab() {
  const config = getMasterTabConfig("season");
  return <GenericMasterTab config={config} />;
}
