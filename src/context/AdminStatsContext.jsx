import { createContext, useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { getAdminStatsAPI } from "../services/api";

const AdminStatsContext = createContext();

export function AdminStatsProvider({ children }) {
  const [stats, setStats] = useState({
    pendingOrders: 0,
    pendingPayments: 0,
    totalProducts: 0,
    totalUsers: 0,
    activeStores: 0,
    monthlyRevenue: 0,
    completedOrders: 0,
    pendingPayouts: 0,
    processingRefunds: 0,
    pendingProducts: 0,
    pendingStores: 0,
    pendingRiders: 0,
    pendingTickets: 0,
    pendingDiscounts: 0,
    pendingPenalties: 0,
  });
  const [loading, setLoading] = useState(false);

  const refreshStats = async () => {
    setLoading(true);
    try {
      const res = await getAdminStatsAPI();
      if (res.data?.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error("Error refreshing admin stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshStats();
  }, []);

  return (
    <AdminStatsContext.Provider value={{ stats, loading, refreshStats }}>
      {children}
    </AdminStatsContext.Provider>
  );
}

AdminStatsProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAdminStats = () => {
  const context = useContext(AdminStatsContext);
  if (!context) {
    throw new Error("useAdminStats must be used within an AdminStatsProvider");
  }
  return context;
};
