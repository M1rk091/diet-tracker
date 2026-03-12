import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function Peso({ user }) {
  const [misurazioni, setMisurazioni] = useState([])
  const [nuovoPeso, setNuovoPeso] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchPeso() }, [])

  const fetchPeso = async () => {
    const { data } = await supabase
      .from('peso').select('*')
      .eq('user_id', user.id)
      .order('data', { ascending: true })
    if (data) setMisurazioni(data)
    setLoading(false)
  }

  const aggiungiPeso = async () => {
    if (!nuovoPeso) return
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('peso').insert({
      user_id: user.id,
      peso_kg: parseFloat(nuovoPeso),
      data: today
    })
    setNuovoPeso('')
    fetchPeso()
  }

  const eliminaMisurazione = async (id) => {
    await supabase.from('peso').delete().eq('id', id)
    fetchPeso()
  }

  const datiGrafico = misurazioni.map(m => ({
    data: new Date(m.data).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }),
    peso: m.peso_kg
  }))

  const ultimoPeso = misurazioni[misurazioni.length - 1]
  const primoPeso = misurazioni[0]
  const differenza = ultimoPeso && primoPeso && misurazioni.length > 1
    ? (ultimoPeso.peso_kg - primoPeso.peso_kg).toFixed(1)
    : null

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-3 sticky top-0 z-10">
        <a href="/" className="text-gray-300 hover:text-gray-500 transition p-1 -ml-1">
          <ArrowLeft size={20} />
        </a>
        <h1 className="font-semibold text-gray-900">Peso Corporeo</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-3">

        {/* Registra peso */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-50">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">Registra oggi</p>
          <div className="flex gap-2">
            <input
              type="number" step="0.1" placeholder="Es. 75.5"
              value={nuovoPeso} onChange={e => setNuovoPeso(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && aggiungiPeso()}
              className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
            />
            <button onClick={aggiungiPeso}
              className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white px-5 rounded-2xl font-medium transition-all shadow-sm shadow-emerald-200 flex items-center gap-1.5 text-sm">
              <Plus size={16} /> kg
            </button>
          </div>
        </div>

        {/* Stats */}
        {misurazioni.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-50">
              <p className="text-xs text-gray-400 mb-1">Peso attuale</p>
              <p className="text-2xl font-semibold text-gray-900">{ultimoPeso.peso_kg}<span className="text-sm text-gray-400 font-normal"> kg</span></p>
            </div>
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-50">
              <p className="text-xs text-gray-400 mb-1">Variazione totale</p>
              <p className={`text-2xl font-semibold ${differenza > 0 ? 'text-rose-400' : differenza < 0 ? 'text-emerald-500' : 'text-gray-300'}`}>
                {differenza !== null ? `${differenza > 0 ? '+' : ''}${differenza}` : '—'}<span className="text-sm font-normal text-gray-400"> kg</span>
              </p>
            </div>
          </div>
        )}

        {/* Grafico */}
        {misurazioni.length > 1 && (
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-50">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-4">Andamento</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={datiGrafico}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                <XAxis dataKey="data" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '12px' }}
                  formatter={(v) => [`${v} kg`, 'Peso']}
                />
                <Line type="monotone" dataKey="peso" stroke="#10b981" strokeWidth={2.5}
                  dot={{ fill: '#10b981', r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Storico */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-50">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-4">Storico</p>
          {misurazioni.length === 0 && (
            <p className="text-sm text-gray-300 text-center py-4">Nessuna misurazione registrata</p>
          )}
          <div className="space-y-1">
            {[...misurazioni].reverse().map(m => (
              <div key={m.id} className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-700">{m.peso_kg} kg</p>
                  <p className="text-xs text-gray-400">{new Date(m.data).toLocaleDateString('it-IT', { weekday: 'long', day: '2-digit', month: 'long' })}</p>
                </div>
                <button onClick={() => eliminaMisurazione(m.id)} className="text-gray-200 hover:text-rose-400 transition p-1">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}