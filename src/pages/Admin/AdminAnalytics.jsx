import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import AdminAnalyticsTabNav from "../../components/admin/analytics/AdminAnalyticsTabNav";
import { TAB_INDEX } from "../../components/admin/analytics/analyticsTabs";
import AnalyticsPermissionGuard from "../../components/admin/analytics/AnalyticsPermissionGuard";
import ExecutiveOverviewTab from "../../components/admin/analytics/ExecutiveOverviewTab";
import FinancialsTab from "../../components/admin/analytics/FinancialsTab";
import SalesOperationsTab from "../../components/admin/analytics/SalesOperationsTab";
import LogisticsTab from "../../components/admin/analytics/LogisticsTab";
import LogisticsDeepTab from "../../components/admin/analytics/LogisticsDeepTab";
import GrowthCommunityTab from "../../components/admin/analytics/GrowthCommunityTab";
import SupportQualityTab from "../../components/admin/analytics/SupportQualityTab";
import SupportDeepTab from "../../components/admin/analytics/SupportDeepTab";
import B2bModulesTab from "../../components/admin/analytics/B2bModulesTab";
import AudienceTab from "../../components/admin/analytics/AudienceTab";
import FunnelTab from "../../components/admin/analytics/FunnelTab";
import ContentTab from "../../components/admin/analytics/ContentTab";
import NotificationsTab from "../../components/admin/analytics/NotificationsTab";
import ReputationTab from "../../components/admin/analytics/ReputationTab";
import DemandTab from "../../components/admin/analytics/DemandTab";
import CatalogTab from "../../components/admin/analytics/CatalogTab";
import TreasuryTab from "../../components/admin/analytics/TreasuryTab";
import OnboardingTab from "../../components/admin/analytics/OnboardingTab";
import PromotionsTab from "../../components/admin/analytics/PromotionsTab";

const TAB_COMPONENTS = {
  executive: ExecutiveOverviewTab,
  audience: AudienceTab,
  funnel: FunnelTab,
  content: ContentTab,
  financials: FinancialsTab,
  sales: SalesOperationsTab,
  logistics: LogisticsTab,
  logisticsDeep: LogisticsDeepTab,
  growth: GrowthCommunityTab,
  support: SupportQualityTab,
  supportDeep: SupportDeepTab,
  b2b: B2bModulesTab,
  notifications: NotificationsTab,
  reputation: ReputationTab,
  demand: DemandTab,
  catalog: CatalogTab,
  treasury: TreasuryTab,
  onboarding: OnboardingTab,
  promotions: PromotionsTab,
};

const DEFAULT_TAB = "executive";

export default function AdminAnalytics() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    TAB_COMPONENTS[requestedTab] ? requestedTab : DEFAULT_TAB
  );

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl && TAB_COMPONENTS[tabFromUrl] && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams, activeTab]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  const meta = TAB_INDEX[activeTab];
  const ActiveTab = TAB_COMPONENTS[activeTab];

  return (
    <div className="bg-fx-base border border-fx-line rounded-2xl p-4 md:p-6">
      {/* ── Cabecera: sitúa dónde estás, sin robar alto vertical ── */}
      <header className="mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-fx-faint mb-1">
          Analíticas {meta ? `· ${meta.group}` : ""}
        </p>
        <h1 className="text-xl md:text-2xl font-semibold text-fx-text tracking-tight">
          {meta?.label ?? "Estadísticas de la plataforma"}
        </h1>
      </header>

      <div className="flex flex-col md:flex-row gap-4 md:gap-5 items-stretch md:items-start">
        <AdminAnalyticsTabNav
          activeTab={activeTab}
          onTabChange={handleTabChange}
          activeAlertsCount={0}
        />

        {/* min-w-0 es lo que permite que las tablas y gráficas se encojan
            en vez de desbordar el contenedor flex. */}
        <main className="flex-1 min-w-0">
          {ActiveTab && (
            <AnalyticsPermissionGuard
              key={activeTab}
              tabKey={activeTab}
              areaName={meta?.label ?? activeTab}
            >
              <div className="fx-enter">
                {activeTab === "executive" ? (
                  <ActiveTab onNavigateTab={handleTabChange} />
                ) : (
                  <ActiveTab />
                )}
              </div>
            </AnalyticsPermissionGuard>
          )}
        </main>
      </div>
    </div>
  );
}
