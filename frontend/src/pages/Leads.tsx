// Página de leads — lista con filtros y acceso al detalle
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

interface Lead {
  id: string;
  name: string | null;
  phone: string | null;
  city: string | null;
  channel: string;
  score: number;
  temperature: 'COLD' | 'WARM' | 'HOT';
  status: string;
  product: string | null;
  createdAt: string;
  _count: { conversations: number };
}

const tempColors = {
  HOT:  'text-red-400 bg-red-400/10',
  WARM: 'text-amber-400 bg-amber-400/10',
  COLD: 'text-blue-400 bg-blue-400/10',
};

const tempLabels = { HOT: '🔥 Caliente', WARM: '🌡️ Tibio', COLD: '❄️ Frío' };

const statusLabels: Record<string, string> = {
  NEW:           'Nuevo',
  IN_PROGRESS:   'En progreso',
  WAITING_HUMAN: '⏳ Espera vendedor',
  ASSIGNED:      'Asignado',
  FOLLOWUP:      'Seguimiento',
  CONVERTED:     '✅ Convertido',
  LOST:          'Perdido',
  CLOSED:        'Cerrado',
};

export default function Leads() {
  const navigate = useNavigate();
  const [leads, setLeads]           = useState<Lead[]>([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [temperature, setTemperature] = useState('');
  const [status, setStatus]         = useState('');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search)      params.set('search', search);
    if (temperature) params.set('temperature', temperature);
    if (status)      params.set('status', status);

    api.get(`/leads?${params.toString()}`)
      .then(({ data }) => { setLeads(data.leads); setTotal(data.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, temperature, status]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Leads</h2>
          <p className="text-gray-400 text-sm mt-1">{total} en total</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Buscar por nombre, ciudad, producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
        />
        <select
          value={temperature}
          onChange={(e) => setTemperature(e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="">Todas las temperaturas</option>
          <option value="HOT">🔥 Calientes</option>
          <option value="WARM">🌡️ Tibios</option>
          <option value="COLD">❄️ Fríos</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="">Todos los estados</option>
          <option value="NEW">Nuevos</option>
          <option value="WAITING_HUMAN">Esperando vendedor</option>
          <option value="IN_PROGRESS">En progreso</option>
          <option value="CONVERTED">Convertidos</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Cargando...</div>
        ) : leads.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No hay leads que coincidan con los filtros</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left">Lead</th>
                <th className="px-4 py-3 text-left">Producto</th>
                <th className="px-4 py-3 text-left">Temperatura</th>
                <th className="px-4 py-3 text-left">Score</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-left">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => navigate(`/leads/${lead.id}`)}
                  className="border-b border-gray-800/50 hover:bg-gray-800/50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="text-white font-medium">{lead.name ?? 'Sin nombre'}</p>
                    <p className="text-gray-400 text-xs">{lead.city ?? lead.channel}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    {lead.product ?? <span className="text-gray-600">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${tempColors[lead.temperature]}`}>
                      {tempLabels[lead.temperature]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-700 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${lead.score >= 71 ? 'bg-red-400' : lead.score >= 31 ? 'bg-amber-400' : 'bg-blue-400'}`}
                          style={{ width: `${lead.score}%` }}
                        />
                      </div>
                      <span className="text-gray-300 text-xs">{lead.score}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-xs">
                    {statusLabels[lead.status] ?? lead.status}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(lead.createdAt).toLocaleDateString('es-AR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
