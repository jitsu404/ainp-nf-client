import { GenericMasterTab } from "../../components/GenericMasterTab";
import { getMasterTabConfig } from "../../master-tabs";

export default function FundCategoriesTab() {
  const config = getMasterTabConfig("fundCategory");
  return <GenericMasterTab config={config} />;
}
