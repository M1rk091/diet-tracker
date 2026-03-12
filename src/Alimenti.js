import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient'
import { ArrowLeft, Plus, Trash2, Search, Download, X } from 'lucide-react'

export default function Alimenti({ user }) {
  const [alimenti, setAlimenti] = useState([])
  const [ricerca, setRicerca] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const debounceRef = useRef(null)
  const [form, setForm] = useState({
    nome: '', calorie_per_100g: '', proteine_per_100g: '', carboidrati_per_100g: '', grassi_per_100g: '',
    zuccheri_per_100g: '', grassi_saturi_per_100g: '', fibre_per_100g: '', sale_per_100g: ''
  })

  useEffect(() => { fetchAlimenti() }, [])

  const fetchAlimenti = async () => {
    const { data } = await supabase
      .from('alimenti').select('*')
      .eq('user_id', user.id).order('nome', { ascending: true })
    if (data) setAlimenti(data)
    setLoading(false)
  }

  const aggiungiAlimento = async () => {
    if (!form.nome || !form.calorie_per_100g) return
    await supabase.from('alimenti').insert({
      user_id: user.id,
      nome: form.nome,
      calorie_per_100g: parseFloat(form.calorie_per_100g),
      proteine_per_100g: parseFloat(form.proteine_per_100g) || 0,
      carboidrati_per_100g: parseFloat(form.carboidrati_per_100g) || 0,
      grassi_per_100g: parseFloat(form.grassi_per_100g) || 0,
      zuccheri_per_100g: parseFloat(form.zuccheri_per_100g) || 0,
      grassi_saturi_per_100g: parseFloat(form.grassi_saturi_per_100g) || 0,
      fibre_per_100g: parseFloat(form.fibre_per_100g) || 0,
      sale_per_100g: parseFloat(form.sale_per_100g) || 0,
    })
    setForm({ nome: '', calorie_per_100g: '', proteine_per_100g: '', carboidrati_per_100g: '', grassi_per_100g: '', zuccheri_per_100g: '', grassi_saturi_per_100g: '', fibre_per_100g: '', sale_per_100g: '' })
    setShowForm(false)
    fetchAlimenti()
  }

  const eliminaAlimento = async (id) => {
    await supabase.from('alimenti').delete().eq('id', id)
    fetchAlimenti()
  }

  const cercaSuOpenFoodFacts = async (query) => {
    if (!query.trim()) { setSearchResults([]); return }
    setSearchLoading(true)

    // Prima mostra risultati locali istantaneamente
    const locali = alimenti
      .filter(a => a.nome.toLowerCase().includes(query.toLowerCase()))
      .map(a => ({
        nome: a.nome,
        calorie: a.calorie_per_100g,
        proteine: a.proteine_per_100g,
        carboidrati: a.carboidrati_per_100g,
        grassi: a.grassi_per_100g,
        zuccheri: a.zuccheri_per_100g || 0,
        grassi_saturi: a.grassi_saturi_per_100g || 0,
        fibre: a.fibre_per_100g || 0,
        sale: a.sale_per_100g || 0,
        locale: true
      }))
    setSearchResults(locali)

    // Poi cerca su Open Food Facts
    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20&lc=it&cc=it`
      )
      const data = await res.json()
      const online = (data.products || [])
        .filter(p => p.product_name && p.nutriments && p.nutriments['energy-kcal_100g'])
        .map(p => ({
          nome: p.product_name_it || p.product_name,
          calorie: Math.round(p.nutriments['energy-kcal_100g'] || 0),
          proteine: Math.round((p.nutriments['proteins_100g'] || 0) * 10) / 10,
          carboidrati: Math.round((p.nutriments['carbohydrates_100g'] || 0) * 10) / 10,
          grassi: Math.round((p.nutriments['fat_100g'] || 0) * 10) / 10,
          zuccheri: Math.round((p.nutriments['sugars_100g'] || 0) * 10) / 10,
          grassi_saturi: Math.round((p.nutriments['saturated-fat_100g'] || 0) * 10) / 10,
          fibre: Math.round((p.nutriments['fiber_100g'] || 0) * 10) / 10,
          sale: Math.round((p.nutriments['salt_100g'] || 0) * 10) / 10,
          locale: false
        }))

      // Unisci: locali prima, poi online senza duplicati
      const nomiLocali = new Set(locali.map(a => a.nome.toLowerCase()))
      const onlineFiltrati = online.filter(a => !nomiLocali.has(a.nome.toLowerCase()))
      setSearchResults([...locali, ...onlineFiltrati])
    } catch (e) {
      console.error(e)
    }
    setSearchLoading(false)
  }

  const importaAlimento = async (alimento) => {
    await supabase.from('alimenti').insert({
      user_id: user.id,
      nome: alimento.nome,
      calorie_per_100g: alimento.calorie,
      proteine_per_100g: alimento.proteine,
      carboidrati_per_100g: alimento.carboidrati,
      grassi_per_100g: alimento.grassi,
      zuccheri_per_100g: alimento.zuccheri,
      grassi_saturi_per_100g: alimento.grassi_saturi,
      fibre_per_100g: alimento.fibre,
      sale_per_100g: alimento.sale,
    })
    fetchAlimenti()
  }

  const alimentiFiltrati = alimenti.filter(a =>
    a.nome.toLowerCase().includes(ricerca.toLowerCase())
  )

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
        <h1 className="font-semibold text-gray-900">Database Alimenti</h1>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setShowSearch(true)}
            className="w-8 h-8 bg-blue-50 hover:bg-blue-100 active:scale-95 text-blue-500 rounded-xl flex items-center justify-center transition-all"
            title="Cerca su Open Food Facts"
          >
            <Download size={16} />
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="w-8 h-8 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-xl flex items-center justify-center transition-all shadow-sm shadow-emerald-200"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5">
        {/* Ricerca locale */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-3 text-gray-300" size={16} />
          <input
            type="text"
            placeholder="Cerca nel tuo database..."
            value={ricerca}
            onChange={e => setRicerca(e.target.value)}
            className="w-full bg-white border border-gray-100 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent shadow-sm"
          />
        </div>

        {alimentiFiltrati.length === 0 && (
          <div className="text-center py-16">
            <p className="text-3xl mb-3">🥦</p>
            <p className="text-sm text-gray-400">Nessun alimento trovato</p>
            <p className="text-xs text-gray-300 mt-1">Aggiungine uno manualmente o importa da Open Food Facts</p>
          </div>
        )}

        <div className="space-y-2">
          {alimentiFiltrati.map(a => (
            <div key={a.id} className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-50 flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-800 text-sm">{a.nome}</p>
                <div className="flex gap-3 mt-1 flex-wrap">
                  <span className="text-xs text-gray-500 font-medium">{a.calorie_per_100g} kcal</span>
                  <span className="text-xs text-blue-400">P {a.proteine_per_100g}g</span>
                  <span className="text-xs text-amber-400">C {a.carboidrati_per_100g}g</span>
                  <span className="text-xs text-rose-400">G {a.grassi_per_100g}g</span>
                  {a.fibre_per_100g > 0 && <span className="text-xs text-green-400">Fib {a.fibre_per_100g}g</span>}
                  {a.sale_per_100g > 0 && <span className="text-xs text-purple-400">Sale {a.sale_per_100g}g</span>}
                </div>
              </div>
              <button onClick={() => eliminaAlimento(a.id)} className="text-gray-200 hover:text-rose-400 transition p-1 ml-3">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Modal ricerca Open Food Facts */}
      {showSearch && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-end justify-center z-50 px-4 pb-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">Cerca Alimento</h3>
                <p className="text-xs text-gray-400 mt-0.5">Database locale + Open Food Facts</p>
              </div>
              <button onClick={() => { setShowSearch(false); setSearchResults([]); setSearchQuery('') }}
                className="text-gray-300 hover:text-gray-500 transition">
                <X size={20} />
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Es. petto di pollo, pasta, mela..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value)
                  if (debounceRef.current) clearTimeout(debounceRef.current)
                  debounceRef.current = setTimeout(() => {
                    cercaSuOpenFoodFacts(e.target.value)
                  }, 400)
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    if (debounceRef.current) clearTimeout(debounceRef.current)
                    cercaSuOpenFoodFacts(searchQuery)
                  }
                }}
                className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
              <button
                onClick={() => {
                  if (debounceRef.current) clearTimeout(debounceRef.current)
                  cercaSuOpenFoodFacts(searchQuery)
                }}
                className="bg-blue-500 hover:bg-blue-600 active:scale-95 text-white px-4 rounded-2xl text-sm font-medium transition-all"
              >
                Cerca
              </button>
            </div>

            {searchLoading && (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!searchLoading && searchResults.length === 0 && searchQuery && (
              <p className="text-sm text-gray-300 text-center py-8">Nessun risultato trovato</p>
            )}

            <div className="overflow-y-auto flex-1 space-y-1">
              {searchResults.length > 0 && (
                <>
                  {searchResults.some(r => r.locale) && (
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide px-1 mb-1">Dal tuo database</p>
                  )}
                  {searchResults.filter(r => r.locale).map((r, i) => (
                    <div key={`locale-${i}`} className="bg-emerald-50 rounded-2xl px-4 py-3 flex justify-between items-center mb-1">
                      <div className="flex-1 mr-3">
                        <p className="text-sm font-medium text-emerald-700 leading-tight">{r.nome}</p>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-gray-500 font-medium">{r.calorie} kcal</span>
                          <span className="text-xs text-blue-400">P {r.proteine}g</span>
                          <span className="text-xs text-amber-400">C {r.carboidrati}g</span>
                          <span className="text-xs text-rose-400">G {r.grassi}g</span>
                        </div>
                      </div>
                      <button
                        onClick={() => importaAlimento(r)}
                        className="w-8 h-8 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-xl flex items-center justify-center transition-all flex-shrink-0"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  ))}
                  {searchResults.some(r => !r.locale) && (
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide px-1 mb-1 mt-3">Da Open Food Facts</p>
                  )}
                  {searchResults.filter(r => !r.locale).map((r, i) => (
                    <div key={`online-${i}`} className="bg-gray-50 rounded-2xl px-4 py-3 flex justify-between items-center mb-1">
                      <div className="flex-1 mr-3">
                        <p className="text-sm font-medium text-gray-700 leading-tight">{r.nome}</p>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-gray-500 font-medium">{r.calorie} kcal</span>
                          <span className="text-xs text-blue-400">P {r.proteine}g</span>
                          <span className="text-xs text-amber-400">C {r.carboidrati}g</span>
                          <span className="text-xs text-rose-400">G {r.grassi}g</span>
                        </div>
                      </div>
                      <button
                        onClick={() => importaAlimento(r)}
                        className="w-8 h-8 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-xl flex items-center justify-center transition-all flex-shrink-0"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal aggiungi manuale */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-end justify-center z-50 px-4 pb-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-semibold text-gray-900">Nuovo Alimento</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-300 hover:text-gray-500 transition">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <input type="text" placeholder="Nome alimento *"
                value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
              />
              <input type="number" placeholder="Calorie per 100g *"
                value={form.calorie_per_100g} onChange={e => setForm({ ...form, calorie_per_100g: e.target.value })}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
              />
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-xs text-gray-400 text-center mb-1">Proteine g</p>
                  <input type="number" placeholder="0"
                    value={form.proteine_per_100g} onChange={e => setForm({ ...form, proteine_per_100g: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 text-center"
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-400 text-center mb-1">Carbo g</p>
                  <input type="number" placeholder="0"
                    value={form.carboidrati_per_100g} onChange={e => setForm({ ...form, carboidrati_per_100g: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 text-center"
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-400 text-center mb-1">Grassi g</p>
                  <input type="number" placeholder="0"
                    value={form.grassi_per_100g} onChange={e => setForm({ ...form, grassi_per_100g: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 text-center"
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-400 text-center mb-1">Zuccheri g</p>
                  <input type="number" placeholder="0"
                    value={form.zuccheri_per_100g} onChange={e => setForm({ ...form, zuccheri_per_100g: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 text-center"
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-400 text-center mb-1">Saturi g</p>
                  <input type="number" placeholder="0"
                    value={form.grassi_saturi_per_100g} onChange={e => setForm({ ...form, grassi_saturi_per_100g: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 text-center"
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-400 text-center mb-1">Fibre g</p>
                  <input type="number" placeholder="0"
                    value={form.fibre_per_100g} onChange={e => setForm({ ...form, fibre_per_100g: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 text-center"
                  />
                </div>
                <div className="col-span-3">
                  <p className="text-xs text-gray-400 text-center mb-1">Sale g</p>
                  <input type="number" placeholder="0"
                    value={form.sale_per_100g} onChange={e => setForm({ ...form, sale_per_100g: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 text-center"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowForm(false)}
                className="flex-1 border border-gray-200 text-gray-500 py-3 rounded-2xl text-sm font-medium hover:bg-gray-50 transition">
                Annulla
              </button>
              <button onClick={aggiungiAlimento}
                disabled={!form.nome || !form.calorie_per_100g}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white py-3 rounded-2xl text-sm font-medium transition active:scale-95">
                Salva
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}