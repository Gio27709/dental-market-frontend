import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import useAnalyticsPermissions from "../../../hooks/useAnalyticsPermissions";
import { TAB_GROUPS } from "./analyticsTabs";

/** Quita acentos para que "logistica" encuentre "Logística". */
const normalize = (value) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export default function AdminAnalyticsTabNav({ activeTab, onTabChange, activeAlertsCount = 0 }) {
  const { canViewTab } = useAnalyticsPermissions();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState("");

  const visibleGroups = useMemo(() => {
    const needle = normalize(query.trim());
    return TAB_GROUPS.map((group) => ({
      ...group,
      tabs: group.tabs.filter(
        (tab) =>
          canViewTab(tab.permissionKey) &&
          (!needle || normalize(tab.label).includes(needle) || normalize(group.label).includes(needle))
      ),
    })).filter((group) => group.tabs.length > 0);
  }, [canViewTab, query]);

  const handleSelectTab = (tabKey) => {
    onTabChange(tabKey);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("tab", tabKey);
    setSearchParams(newParams);
  };

  const badgeFor = (tabKey) =>
    tabKey === "executive" && activeAlertsCount > 0 ? activeAlertsCount : null;

  return (
    <>
      {/* ── Móvil: un solo selector en vez de 19 pastillas con scroll ── */}
      <div className="md:hidden fx-surface p-2">
        <select
          value={activeTab}
          onChange={(e) => handleSelectTab(e.target.value)}
          className="w-full bg-transparent text-fx-text text-sm font-semibold px-2 py-2 focus:outline-none"
          aria-label="Área de analíticas"
        >
          {visibleGroups.map((group) => (
            <optgroup key={group.label} label={group.label} className="bg-fx-panel">
              {group.tabs.map((tab) => (
                <option key={tab.key} value={tab.key} className="bg-fx-panel">
                  {tab.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* ── Escritorio: rail vertical agrupado ── */}
      <nav
        className="hidden md:flex flex-col fx-surface w-[232px] shrink-0 self-start sticky top-6 max-h-[calc(100vh-3rem)]"
        aria-label="Áreas de analíticas"
      >
        <div className="p-2.5 border-b border-fx-line">
          <div className="relative">
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-fx-faint pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar área"
              aria-label="Buscar área de analíticas"
              className="w-full bg-fx-inset border border-fx-line rounded-lg pl-8 pr-2 py-1.5 text-xs text-fx-text placeholder:text-fx-faint focus:outline-none focus:border-fx-line-strong transition-colors"
            />
          </div>
        </div>

        <div className="fx-rail flex-1 overflow-y-auto py-2">
          {visibleGroups.length === 0 && (
            <p className="px-4 py-6 text-xs text-fx-faint text-center">Sin áreas que coincidan.</p>
          )}

          {visibleGroups.map((group) => (
            <div key={group.label} className="mb-1 last:mb-0">
              <p className="px-4 pt-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-fx-faint">
                {group.label}
              </p>

              {group.tabs.map((tab) => {
                const isActive = activeTab === tab.key;
                const badge = badgeFor(tab.key);
                const Icon = tab.icon;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => handleSelectTab(tab.key)}
                    aria-current={isActive ? "page" : undefined}
                    className={`group w-full flex items-center gap-2.5 pl-3.5 pr-3 py-2 text-left text-[13px] transition-colors border-l-2 ${
                      isActive
                        ? "border-fx-accent bg-fx-raised text-fx-text font-semibold"
                        : "border-transparent text-fx-muted hover:text-fx-text hover:bg-fx-raised/50 font-medium"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? "text-fx-accent" : "text-fx-faint group-hover:text-fx-muted"
                      }`}
                      aria-hidden="true"
                    />
                    <span className="truncate flex-1">{tab.label}</span>
                    {badge && (
                      <span className="shrink-0 fx-num text-[10px] font-bold text-fx-warn bg-fx-warn/12 border border-fx-warn/30 rounded px-1.5 py-px">
                        {badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </nav>
    </>
  );
}

AdminAnalyticsTabNav.propTypes = {
  activeTab: PropTypes.string.isRequired,
  onTabChange: PropTypes.func.isRequired,
  activeAlertsCount: PropTypes.number,
};
