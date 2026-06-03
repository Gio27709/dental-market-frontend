import { useState } from "react";
import { getRiderStatsAPI } from "../../services/api";
import { useEffect } from "react";

export default function RiderStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getRiderStatsAPI();
        setStats(res.data.data);
      } catch {
        // Silently fail — stats are non-critical
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading || !stats) return null;

  const statItems = [
    { 
      label: "Completadas", 
      value: stats.delivered, 
      icon: "check_circle", 
      color: "text-green-600", 
      bg: "bg-green-50" 
    },
    { 
      label: "En Curso", 
      value: stats.in_progress, 
      icon: "local_shipping", 
      color: "text-blue-600", 
      bg: "bg-blue-50" 
    },
    { 
      label: "Fallidas", 
      value: stats.failed, 
      icon: "cancel", 
      color: "text-red-500", 
      bg: "bg-red-50" 
    },
    { 
      label: "Tasa Éxito", 
      value: `${stats.success_rate}%`, 
      icon: "trending_up", 
      color: stats.success_rate >= 80 ? "text-green-600" : "text-amber-500", 
      bg: stats.success_rate >= 80 ? "bg-green-50" : "bg-amber-50" 
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {statItems.map((s) => (
        <div 
          key={s.label} 
          className={`${s.bg} rounded-2xl p-4 flex flex-col items-center gap-1.5 transition-transform hover:scale-[1.02]`}
        >
          <span className={`material-symbols-outlined text-[22px] ${s.color}`}>{s.icon}</span>
          <span className="text-xl font-extrabold text-gray-900">{s.value}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{s.label}</span>
        </div>
      ))}
    </div>
  );
}
