import { GenericMasterTab } from "../../components/GenericMasterTab";
import { getMasterTabConfig } from "../../master-tabs";

export default function ProgrammesTab() {
  const config = getMasterTabConfig("programme");
  return <GenericMasterTab config={config} />;
}
