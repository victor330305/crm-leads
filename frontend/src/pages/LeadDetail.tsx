// Detalle de un lead — conversación completa + acciones del vendedor
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';

interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  intentDetected: string | null;
  scoreChange: number | null;
  createdAt: string;
}

interface Lead {
  id: string;
  name: string | null;
  phone: string | null;
  city: string | null;
  province: string | null;
  channel: string;
  score: number;
  temperature: string;
  status: string;
  product: string | null;
  use: string | null;
  intention: string | null;
  notes: string | null;
  isRecovered: boolean;
  createdAt: string;
  conversations: {
    id: string;
    channel: string;
    summary: string | null;
    createdAt: string;
    messages: Message[];
  }[];
}

const statusOptions = [
  { value: 'NEW',           label: 'Nuevo' },
  { value: 'IN_PROGRESS',   label: 'En progreso' },
  { value: 'WAITING_HUMAN', label: 'Esperando vendedor' },
  { value: 'ASSIGNED',      label: 'Asignado' },
  { value: 'CONVERTED',     label: '✅ Convertido' },
  { value: 'LOST',          label: 'Perdido' },
  { value: 'CLOSED',        label: 'Cerrado' },
];

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lead, setLead]     = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes]   = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get(`/leads/${id}`)
      .then(({ data }) => {
        setLead(data.lead);
        setNotes(data.lead.notes ?? '');
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  async function updateStatus(status: string) {
    if (!id) return;
    await api.patch(`/leads/${id}`, { status });
    setLead((prev) => prev ? { ...prev, status } : prev);
  }

  async function saveNotes() {
    if (!id) return;
    setSaving(true);
    await api.patch(`/leads/${id}`, { notes });
    setSaving(false);
  }

  if (loading) return <div className="p-6 text-gray-400">Cargando...</div>;
  if (!lead)   return <div className="p-6 text-gray-400">Lead no encontrado</div>;

  const lastConv = lead.conversations[0];
  const tempColor = lead.temperature === 'HOT' ? 'text-red-400' : lead.temperature === 'WARM' ? 'text-amber-400' : 'text-blue-400';

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate('/leads')} className="text-gray-400 hover:text-white mt-1">←</button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white">{lead.name ?? 'Sin nombre'}</h2>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
            {lead.city && <span>📍 {lead.city}{lead.province ? `, ${lead.province}` : ''}</span>}
            {lead.phone && <span>📱 {lead.phone}</span>}
            <span>Canal: {lead.channel}</span>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold ${tempColor}`}>{lead.score}</p>
          <p className="text-gray-400 text-xs">score</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda — info + acciones */}
        <div className="space-y-4">
          {/* Datos del lead */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Datos</h3>
            {lead.product   && <div><p className="text-xs text-gray-500">Producto</p><p className="text-white text-sm">{lead.product}</p></div>}
            {lead.use       && <div><p className="text-xs text-gray-500">Uso</p><p className="text-white text-sm capitalize">{lead.use}</p></div>}
            {lead.intention && <div><p className="text-xs text-gray-500">Intención</p><p className="text-white text-sm">{lead.intention}</p></div>}
            {lead.isRecovered && <div className="text-xs text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded">🔄 Recuperado por el bot</div>}
          </div>

          {/* Cambiar estado */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Estado</h3>
            <div className="space-y-1">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateStatus(opt.value)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    lead.status === opt.value
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notas */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Notas del vendedor</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-indigo-500"
              placeholder="Agregar notas..."
            />
            <button
              onClick={saveNotes}
              disabled={saving}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm py-2 rounded-lg transition-colors"
            >
              {saving ? 'Guardando...' : 'Guardar notas'}
            </button>
          </div>
        </div>

        {/* Columna derecha — conversación */}
        <div className="lg:col-span-2 space-y-4">
          {/* Resumen IA */}
          {lastConv?.summary && (
            <div className="bg-indigo-900/30 border border-indigo-700/50 rounded-xl p-4">
              <p className="text-indigo-300 text-xs font-medium uppercase tracking-wider mb-2">Resumen generado por IA</p>
              <p className="text-gray-200 text-sm">{lastConv.summary}</p>
            </div>
          )}

          {/* Mensajes */}
          {lastConv && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-800">
                <p className="text-sm text-gray-400">
                  Conversación — {new Date(lastConv.createdAt).toLocaleDateString('es-AR')}
                </p>
              </div>
              <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                {lastConv.messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'USER' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-sm px-3 py-2 rounded-xl text-sm ${
                      msg.role === 'USER'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-800 text-gray-100'
                    }`}>
                      <p>{msg.content}</p>
                      {msg.scoreChange && msg.scoreChange > 0 && (
                        <p className="text-xs opacity-60 mt-1">+{msg.scoreChange} pts</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
