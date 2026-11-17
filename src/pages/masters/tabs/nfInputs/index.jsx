import { GenericMasterTab } from "../../components/GenericMasterTab";
import { getMasterTabConfig } from "../../master-tabs";

export default function NfInputsTab() {
  const config = getMasterTabConfig("nfInput");
  return <GenericMasterTab config={config} />;
}
