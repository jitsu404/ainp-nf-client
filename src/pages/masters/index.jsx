import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth";
import { Page, Tabs } from "../../components/ui";
import { getAvailableTabs, MASTER_TAB_MAP } from "./master-tabs";

import SeasonsTab from "./tabs/seasons";
import UnitsTab from "./tabs/units";
import CropsTab from "./tabs/crops";
import NfInputsTab from "./tabs/nfInputs";
import ProgrammesTab from "./tabs/programmes";
import BudgetHeadTab from "./tabs/budgetHead";
import FundCategoriesTab from "./tabs/fundCategories";
import StaffPostsTab from "./tabs/staffPosts";
import FinancialYearsTab from "./tabs/financialYears";
import ParametersTab from "./tabs/parameters";
import RolesTab from "./tabs/roles";

const TAB_COMPONENTS = {
  season: SeasonsTab,
  unit: UnitsTab,
  crop: CropsTab,
  nfInput: NfInputsTab,
  programme: ProgrammesTab,
  budgetHead: BudgetHeadTab,
  fundCategory: FundCategoriesTab,
  staffPost: StaffPostsTab,
  fy: FinancialYearsTab,
  parameters: ParametersTab,
  roles: RolesTab,
};

export default function Masters() {
  const { can } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const availableTabs = getAvailableTabs(can);

  // Tab can be read from URL query param ?tab=..., fallback to "season"
  const paramTab = searchParams.get("tab");
  const initialTab =
    paramTab && MASTER_TAB_MAP.has(paramTab) ? paramTab : "season";
  const [tab, setTab] = useState(initialTab);

  const handleTabChange = (newTab) => {
    setTab(newTab);
    setSearchParams(newTab === "season" ? {} : { tab: newTab }, {
      replace: true,
    });
  };

  const ActiveComponent = TAB_COMPONENTS[tab] ?? SeasonsTab;

  return (
    <Page title="Masters">
      <Tabs
        value={tab}
        onChange={handleTabChange}
        tabs={availableTabs.map((t) => [t.id, t.label])}
      />
      <ActiveComponent />
    </Page>
  );
}
