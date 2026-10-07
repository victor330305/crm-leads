// Dashboard principal — métricas clave en tiempo real
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

function StatCard({ label, value, sub, color }: { label: string; value: number | string; sub?: string; color?: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <p className="text-gray-400 text-sm">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color ?? 'text-white'}`}>{value}</p>
      {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/summary')
      .then(({ data }) => setSummary(data.summary))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">Cargando métricas...</div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Dashboard</h2>
        <p className="text-gray-400 text-sm mt-1">Resumen de actividad del sistema</p>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total leads" value={summary.leads.total} sub={`${summary.leads.today} hoy`} />
        <StatCard label="Esta semana" value={summary.leads.thisWeek} />
        <StatCard label="Este mes" value={summary.leads.thisMonth} />
        <StatCard label="Conversaciones" value={summary.metrics.totalConversations} />
      </div>

      {/* Temperatura */}
      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Por temperatura</h3>
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="🔥 Calientes" value={summary.byTemperature.hot}  color="text-red-400" />
          <StatCard label="🌡️ Tibios"    value={summary.byTemperature.warm} color="text-amber-400" />
          <StatCard label="❄️ Fríos"     value={summary.byTemperature.cold} color="text-blue-400" />
        </div>
      </div>

      {/* Estado y métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="⏳ Esperando vendedor" value={summary.byStatus.waitingHuman} color="text-orange-400" />
        <StatCard label="✅ Convertidos"        value={summary.byStatus.converted}    color="text-green-400" />
        <StatCard label="🔄 Recuperados"        value={summary.metrics.recovered}     color="text-indigo-400"
          sub="Atendidos por el bot" />
        <StatCard label="📊 Score promedio"     value={`${summary.metrics.avgScore}/100`} />
      </div>

      {/* Top productos */}
      {summary.topProducts.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">Productos más consultados</h3>
          <div className="space-y-2">
            {summary.topProducts.map((p) => (
              <div key={p.product} className="flex items-center justify-between">
                <span className="text-gray-300 text-sm capitalize">{p.product}</span>
                <span className="text-indigo-400 font-medium text-sm">{p.count} consultas</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Métrica estrella */}
      <div className="bg-indigo-900/30 border border-indigo-700/50 rounded-xl p-5">
        <p className="text-indigo-300 text-sm font-medium">🎯 Ventas recuperadas</p>
        <p className="text-white mt-2 text-sm">
          Este mes el sistema atendió <span className="text-indigo-400 font-bold">{summary.metrics.recovered} consultas</span> que
          podrían haberse perdido fuera del horario de atención.
        </p>
      </div>
    </div>
  );
}
