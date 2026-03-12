import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { ArrowLeft, Plus, Trash2, Search } from 'lucide-react'

const TIPI_PASTO = [
  { id: 'colazione', label: 'Colazione', emoji: '☀️' },
  { id: 'spuntino_mattina', label: 'Spuntino mattina', emoji: '🍎' },
  { id: 'pranzo', label: 'Pranzo', emoji: '🍽️' },
  { id: 'spuntino_pomeriggio', label: 'Spuntino pomeriggio', emoji: '🍊' },
  { id: 'cena', label: 'Cena', emoji: '🌙' },
]

export default function Pasti({ user }) {
  const [pasti, setPasti] = useState([])
  const [alimenti, setAlimenti] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [tipoPasto, setTipoPasto] = useState('colazione')
  const [alimentoId, setAlimentoId] = useState('')
  const [quantita, setQuantita] = useState('')
  const [ricerca, setRicerca] = useState('')
  const [loading, setLoading] = useState(true)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => { fetchPasti(); fetchAlimenti() }, [])

  const fetchPasti = async () => {
    const { data } = await supabase
      .from('pasti').select('*, alimenti(*)')
      .eq('user_id', user.id).eq('data', today)
      .order('created_at', { ascending: true })
    if (data) setPasti(data)
    setLoading(false)
  }

  const fetchAlimenti = async () => {
    const { data } = await supabase
      .from('alimenti').select('*')
      .eq('user_id', user.id).order('nome', { ascending: true })
    if (data) setAlimenti(data)
  }

  const aggiungiPasto = async () => {
    if (!alimentoId || !quantita) return
    await supabase.from('pasti').insert({
      user_id: user.id,
      alimento_id: alimentoId,
      tipo_pasto: tipoPasto,
      quantita_g: parseFloat(quantita),
      data: today
    })
    setShowForm(false)
    setAlimentoId('')
    setQuantita('')
    setRicerca('')
    fetchPasti()
  }

  const eliminaPasto = async (id) => {
    await supabase.from('pasti').delete().eq('id', id)
    fetchPasti()
  }

  const nutri = (pasto) => {
    const q = pasto.quantita_g / 100
    return {
      calorie: Math.round(pasto.alimenti.calorie_per_100g * q),
      proteine: Math.round(pasto.alimenti.proteine_per_100g * q * 10) / 10,
      carboidrati: Math.round(pasto.alimenti.carboidrati_per_100g * q * 10) / 10,
      grassi: Math.round(pasto.alimenti.grassi_per_100g * q * 10) / 10,
      zuccheri: Math.round((pasto.alimenti.zuccheri_per_100g || 0) * q * 10) / 10,
      grassi_saturi: Math.round((pasto.alimenti.grassi_saturi_per_100g || 0) * q * 10) / 10,
      fibre: Math.round((pasto.alimenti.fibre_per_100g || 0) * q * 10) / 10,
      sale: Math.round((pasto.alimenti.sale_per_100g || 0) * q * 10) / 10,
    }
  }

  const alimentiFiltrati = alimenti.filter(a =>
    a.nome.toLowerCase().includes(ricerca.toLowerCase())
  )

  const totaleDel = (tipo) => pasti
    .filter(p => p.tipo_pasto === tipo)
    .reduce((acc, p) => acc + nutri(p).calorie, 0)

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
        <h1 className="font-semibold text-gray-900">Diario Pasti</h1>
        <span className="ml-auto text-xs text-gray-400">
          {new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
        </span>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-3">
        {TIPI_PASTO.map(tipo => {
          const pastiTipo = pasti.filter(p => p.tipo_pasto === tipo.id)
          const kcal = totaleDel(tipo.id)

          return (
            <div key={tipo.id} className="bg-white rounded-3xl shadow-sm border border-gray-50 overflow-hidden">
              <div className="px-5 py-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span>{tipo.emoji}</span>
                  <span className="font-medium text-gray-800">{tipo.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  {kcal > 0 && <span className="text-xs text-gray-400 font-medium">{kcal} kcal</span>}
                  <button
                    onClick={() => { setTipoPasto(tipo.id); setShowForm(true) }}
                    className="w-7 h-7 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-xl flex items-center justify-center transition-all"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {pastiTipo.length > 0 && (
                <div className="border-t border-gray-50 divide-y divide-gray-50">
                  {pastiTipo.map(pasto => {
                    const n = nutri(pasto)
                    return (
                      <div key={pasto.id} className="px-5 py-3 flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700">{pasto.alimenti.nome}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {pasto.quantita_g}g · <span className="text-gray-600 font-medium">{n.calorie} kcal</span>
                          </p>
                          <div className="flex gap-2 mt-1 flex-wrap">
                            <span className="text-xs text-blue-400">P {n.proteine}g</span>
                            <span className="text-xs text-amber-400">C {n.carboidrati}g</span>
                            <span className="text-xs text-rose-400">G {n.grassi}g</span>
                            {n.zuccheri > 0 && <span className="text-xs text-pink-400">Zucc {n.zuccheri}g</span>}
                            {n.grassi_saturi > 0 && <span className="text-xs text-orange-400">Sat {n.grassi_saturi}g</span>}
                            {n.fibre > 0 && <span className="text-xs text-green-400">Fib {n.fibre}g</span>}
                            {n.sale > 0 && <span className="text-xs text-purple-400">Sale {n.sale}g</span>}
                          </div>
                        </div>
                        <button onClick={() => eliminaPasto(pasto.id)} className="text-gray-200 hover:text-rose-400 transition ml-3 p-1 mt-0.5">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {pastiTipo.length === 0 && (
                <div className="px-5 pb-4">
                  <p className="text-xs text-gray-300">Nessun alimento registrato</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-end justify-center z-50 px-4 pb-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-semibold text-gray-900">
                {TIPI_PASTO.find(t => t.id === tipoPasto)?.emoji} Aggiungi a {TIPI_PASTO.find(t => t.id === tipoPasto)?.label}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-300 hover:text-gray-500 transition">✕</button>
            </div>

            <div className="relative mb-3">
              <Search className="absolute left-3.5 top-3 text-gray-300" size={15} />
              <input
                type="text"
                placeholder="Cerca alimento..."
                value={ricerca}
                onChange={e => { setRicerca(e.target.value); setAlimentoId('') }}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
              />
            </div>

            {ricerca && (
              <div className="max-h-40 overflow-y-auto mb-3 space-y-1">
                {alimentiFiltrati.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-3">Nessun alimento trovato</p>
                )}
                {alimentiFiltrati.map(a => (
                  <button
                    key={a.id}
                    onClick={() => { setAlimentoId(a.id); setRicerca(a.nome) }}
                    className={`w-full text-left px-4 py-2.5 rounded-2xl text-sm transition ${alimentoId === a.id ? 'bg-emerald-50 text-emerald-700 font-medium' : 'hover:bg-gray-50 text-gray-700'}`}
                  >
                    {a.nome} <span className="text-gray-400 text-xs">· {a.calorie_per_100g} kcal/100g</span>
                  </button>
                ))}
              </div>
            )}

            <input
              type="number"
              placeholder="Quantità in grammi"
              value={quantita}
              onChange={e => setQuantita(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
            />

            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)}
                className="flex-1 border border-gray-200 text-gray-500 py-3 rounded-2xl text-sm font-medium hover:bg-gray-50 transition">
                Annulla
              </button>
              <button onClick={aggiungiPasto}
                disabled={!alimentoId || !quantita}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white py-3 rounded-2xl text-sm font-medium transition active:scale-95">
                Aggiungi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}