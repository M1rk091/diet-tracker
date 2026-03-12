import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { ArrowLeft } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

export default function Statistiche({ user }) {
  const [datiSettimana, setDatiSettimana] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchStatistiche() }, [])

  const fetchStatistiche = async () => {
    const giorni = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      giorni.push(d.toISOString().split('T')[0])
    }

    const { data: pasti } = await supabase
      .from('pasti').select('*, alimenti(*)')
      .eq('user_id', user.id)
      .gte('data', giorni[0]).lte('data', giorni[6])

    const { data: acqua } = await supabase
      .from('idratazione').select('*')
      .eq('user_id', user.id)
      .gte('data', giorni[0]).lte('data', giorni[6])

    const dati = giorni.map(giorno => {
      const pastiGiorno = pasti ? pasti.filter(p => p.data === giorno) : []
      const acquaGiorno = acqua ? acqua.filter(a => a.data === giorno) : []

      const totali = pastiGiorno.reduce((acc, p) => {
        const q = p.quantita_g / 100
        return {
          calorie: acc.calorie + p.alimenti.calorie_per_100g * q,
          proteine: acc.proteine + p.alimenti.proteine_per_100g * q,
          carboidrati: acc.carboidrati + p.alimenti.carboidrati_per_100g * q,
          grassi: acc.grassi + p.alimenti.grassi_per_100g * q,
        }
      }, { calorie: 0, proteine: 0, carboidrati: 0, grassi: 0 })

      return {
        giorno: new Date(giorno).toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit' }),
        calorie: Math.round(totali.calorie),
        proteine: Math.round(totali.proteine),
        carboidrati: Math.round(totali.carboidrati),
        grassi: Math.round(totali.grassi),
        acqua: acquaGiorno.reduce((acc, a) => acc + a.quantita_ml, 0)
      }
    })

    setDatiSettimana(dati)
    setLoading(false)
  }

  const tooltipStyle = {
    contentStyle: {
      borderRadius: '12px',
      border: 'none',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      fontSize: '12px'
    }
  }

  const mediaCalorie = datiSettimana.length
    ? Math.round(datiSettimana.reduce((a, d) => a + d.calorie, 0) / datiSettimana.filter(d => d.calorie > 0).length || 0)
    : 0

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
        <h1 className="font-semibold text-gray-900">Statistiche</h1>
        <span className="ml-auto text-xs text-gray-400">Ultimi 7 giorni</span>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-3">

        {/* Media calorie */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-50">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Media giornaliera</p>
          <p className="text-3xl font-semibold text-gray-900">{mediaCalorie || '—'}<span className="text-base text-gray-400 font-normal"> kcal</span></p>
        </div>

        {/* Calorie */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-50">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-4">Calorie</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={datiSettimana} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
              <XAxis dataKey="giorno" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} formatter={v => [`${v} kcal`, 'Calorie']} />
              <Bar dataKey="calorie" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Macros */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-50">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-4">Macronutrienti</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={datiSettimana} barSize={8}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
              <XAxis dataKey="giorno" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} formatter={(v, n) => [`${v}g`, n.charAt(0).toUpperCase() + n.slice(1)]} />
              <Bar dataKey="proteine" fill="#60a5fa" radius={[4, 4, 0, 0]} name="proteine" />
              <Bar dataKey="carboidrati" fill="#fbbf24" radius={[4, 4, 0, 0]} name="carboidrati" />
              <Bar dataKey="grassi" fill="#f87171" radius={[4, 4, 0, 0]} name="grassi" />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-3 justify-center">
            {[{ label: 'Proteine', color: 'bg-blue-400' }, { label: 'Carboidrati', color: 'bg-amber-400' }, { label: 'Grassi', color: 'bg-rose-400' }].map(item => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${item.color}`} />
                <span className="text-xs text-gray-400">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Acqua */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-50">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-4">Idratazione</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={datiSettimana}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
              <XAxis dataKey="giorno" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} formatter={v => [`${v} ml`, 'Acqua']} />
              <Line type="monotone" dataKey="acqua" stroke="#60a5fa" strokeWidth={2.5}
                dot={{ fill: '#60a5fa', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  )
}