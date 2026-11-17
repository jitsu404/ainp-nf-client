import { GenericMasterTab } from "../../components/GenericMasterTab";
import { getMasterTabConfig } from "../../master-tabs";

export default function BudgetHeadTab() {
  const config = getMasterTabConfig("budgetHead");
  return <GenericMasterTab config={config} />;
}
