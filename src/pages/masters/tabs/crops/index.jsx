import { GenericMasterTab } from "../../components/GenericMasterTab";
import { getMasterTabConfig } from "../../master-tabs";

export default function CropsTab() {
  const config = getMasterTabConfig("crop");
  return <GenericMasterTab config={config} />;
}
