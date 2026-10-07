// Página de analytics — métricas detalladas
import { useEffect, useState } from 'react';
import api from '../lib/api';

interface Summary {
  leads: { total: number; today: number; thisWeek: number; thisMonth: number };
  byTemperature: { cold: number; warm: number; hot: number };
  byStatus: { waitingHuman: number; converted: number; lost: number };
  metrics: { recovered: number; conversionRate: number; avgScore: number; totalConversations: number };
  byChannel: { channel: string; count: number }[];
  topProducts: { product: string; count: number }[];
}

export default function Analytics() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/summary')
      .then(({ data }) => setSummary(data.summary))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-gray-400">Cargando...</div>;
  if (!summary) return null;

  const total = summary.leads.total || 1;

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold text-white">Analytics</h2>

      {/* Funnel de conversión */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Funnel de conversión</h3>
        <div className="space-y-3">
          {[
            { label: 'Leads totales',        value: summary.leads.total,              color: 'bg-blue-500' },
            { label: 'En progreso',          value: summary.byTemperature.warm + summary.byTemperature.hot, color: 'bg-amber-500' },
            { label: 'Esperando vendedor',   value: summary.byStatus.waitingHuman,    color: 'bg-orange-500' },
            { label: 'Convertidos',          value: summary.byStatus.converted,       color: 'bg-green-500' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <p className="text-gray-400 text-sm w-44">{item.label}</p>
              <div className="flex-1 bg-gray-800 rounded-full h-2">
                <div
                  className={`${item.color} h-2 rounded-full transition-all`}
                  style={{ width: `${Math.max(2, (item.value / total) * 100)}%` }}
                />
              </div>
              <p className="text-white text-sm w-8 text-right">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Métricas clave */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Tasa de conversión</p>
          <p className="text-3xl font-bold text-green-400 mt-1">{summary.metrics.conversionRate}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Score promedio</p>
          <p className="text-3xl font-bold text-white mt-1">{summary.metrics.avgScore}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Leads recuperados</p>
          <p className="text-3xl font-bold text-indigo-400 mt-1">{summary.metrics.recovered}</p>
        </div>
      </div>

      {/* Por canal y productos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Por canal</h3>
          {summary.byChannel.map((c) => (
            <div key={c.channel} className="flex justify-between py-2 border-b border-gray-800 last:border-0">
              <span className="text-gray-300 capitalize">{c.channel}</span>
              <span className="text-white font-medium">{c.count}</span>
            </div>
          ))}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Productos más consultados</h3>
          {summary.topProducts.length === 0 ? (
            <p className="text-gray-500 text-sm">Sin datos todavía</p>
          ) : summary.topProducts.map((p) => (
            <div key={p.product} className="flex justify-between py-2 border-b border-gray-800 last:border-0">
              <span className="text-gray-300 capitalize">{p.product}</span>
              <span className="text-white font-medium">{p.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
