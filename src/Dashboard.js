import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { Droplets, UtensilsCrossed, TrendingUp, LogOut, Plus } from 'lucide-react'

export default function Dashboard({ user }) {
  const [oggi, setOggi] = useState({ calorie: 0, proteine: 0, carboidrati: 0, grassi: 0, zuccheri: 0, grassi_saturi: 0, fibre: 0, sale: 0 })
  const [acqua, setAcqua] = useState(0)
  const [obiettivi, setObiettivi] = useState({ obiettivo_calorie: 2000, obiettivo_proteine: 150, obiettivo_carboidrati: 250, obiettivo_grassi: 65, obiettivo_acqua: 2000 })
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchDatiOggi() }, [])

  const fetchDatiOggi = async () => {
    const today = new Date().toISOString().split('T')[0]

    const { data: pasti } = await supabase
      .from('pasti').select('*, alimenti(*)')
      .eq('user_id', user.id).eq('data', today)

    if (pasti) {
      const totali = pasti.reduce((acc, p) => {
        const q = p.quantita_g / 100
        return {
          calorie: acc.calorie + p.alimenti.calorie_per_100g * q,
          proteine: acc.proteine + p.alimenti.proteine_per_100g * q,
          carboidrati: acc.carboidrati + p.alimenti.carboidrati_per_100g * q,
          grassi: acc.grassi + p.alimenti.grassi_per_100g * q,
          zuccheri: acc.zuccheri + (p.alimenti.zuccheri_per_100g || 0) * q,
          grassi_saturi: acc.grassi_saturi + (p.alimenti.grassi_saturi_per_100g || 0) * q,
          fibre: acc.fibre + (p.alimenti.fibre_per_100g || 0) * q,
          sale: acc.sale + (p.alimenti.sale_per_100g || 0) * q,
        }
      }, { calorie: 0, proteine: 0, carboidrati: 0, grassi: 0, zuccheri: 0, grassi_saturi: 0, fibre: 0, sale: 0 })
      setOggi(totali)
    }

    const { data: acquaData } = await supabase
      .from('idratazione').select('quantita_ml')
      .eq('user_id', user.id).eq('data', today)
    if (acquaData) setAcqua(acquaData.reduce((acc, r) => acc + r.quantita_ml, 0))

    const { data: profile } = await supabase
      .from('profiles').select('*').eq('id', user.id).single()
    if (profile) setObiettivi(profile)

    setLoading(false)
  }

  const aggiungiAcqua = async (ml) => {
    await supabase.from('idratazione').insert({
      user_id: user.id,
      quantita_ml: ml,
      data: new Date().toISOString().split('T')[0]
    })
    fetchDatiOggi()
  }

  const logout = async () => await supabase.auth.signOut()

  const Barra = ({ valore, obiettivo, colore }) => {
    const pct = Math.min((valore / obiettivo) * 100, 100)
    return (
      <div className="w-full bg-gray-100 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full transition-all duration-500 ${colore}`} style={{ width: `${pct}%` }} />
      </div>
    )
  }

  const BarraSecondaria = ({ valore, max, colore }) => (
    <div className="w-full bg-gray-200 rounded-full h-1">
      <div className={`h-1 rounded-full transition-all ${colore}`} style={{ width: `${Math.min((valore / max) * 100, 100)}%` }} />
    </div>
  )

  const calorieRimanenti = Math.max((obiettivi.obiettivo_calorie || 2000) - Math.round(oggi.calorie), 0)
  const acquaPct = Math.min((acqua / (obiettivi.obiettivo_acqua || 2000)) * 100, 100)

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-stone-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
            <span className="text-sm">🥗</span>
          </div>
          <span className="font-semibold text-gray-900">DietTracker</span>
        </div>
        <button onClick={logout} className="text-gray-300 hover:text-gray-500 transition p-1">
          <LogOut size={18} />
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-3">

        {/* Calorie card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-50">
          <div className="flex justify-between items-start mb-5">
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Oggi</p>
              <p className="text-4xl font-semibold text-gray-900 mt-0.5">
                {Math.round(oggi.calorie)}<span className="text-lg text-gray-300 font-normal"> kcal</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">rimanenti</p>
              <p className="text-xl font-semibold text-emerald-500">{calorieRimanenti}</p>
            </div>
          </div>

          {/* Macros principali */}
          <div className="space-y-3 mb-5">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-500 font-medium">Proteine</span>
                <span className="text-gray-400">{Math.round(oggi.proteine)}g / {obiettivi.obiettivo_proteine || 150}g</span>
              </div>
              <Barra valore={oggi.proteine} obiettivo={obiettivi.obiettivo_proteine || 150} colore="bg-blue-400" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-500 font-medium">Carboidrati</span>
                <span className="text-gray-400">{Math.round(oggi.carboidrati)}g / {obiettivi.obiettivo_carboidrati || 250}g</span>
              </div>
              <Barra valore={oggi.carboidrati} obiettivo={obiettivi.obiettivo_carboidrati || 250} colore="bg-amber-400" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-500 font-medium">Grassi</span>
                <span className="text-gray-400">{Math.round(oggi.grassi)}g / {obiettivi.obiettivo_grassi || 65}g</span>
              </div>
              <Barra valore={oggi.grassi} obiettivo={obiettivi.obiettivo_grassi || 65} colore="bg-rose-400" />
            </div>
          </div>

          {/* Separatore macros secondari */}
          <div className="border-t border-gray-50 pt-4">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">Dettaglio</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 rounded-2xl p-3">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs text-gray-500">Zuccheri</span>
                  <span className="text-xs font-medium text-gray-700">{Math.round(oggi.zuccheri)}g</span>
                </div>
                <BarraSecondaria valore={oggi.zuccheri} max={50} colore="bg-pink-400" />
                <p className="text-xs text-gray-300 mt-1">max 50g</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-3">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs text-gray-500">Grassi saturi</span>
                  <span className="text-xs font-medium text-gray-700">{Math.round(oggi.grassi_saturi)}g</span>
                </div>
                <BarraSecondaria valore={oggi.grassi_saturi} max={20} colore="bg-orange-400" />
                <p className="text-xs text-gray-300 mt-1">max 20g</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-3">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs text-gray-500">Fibre</span>
                  <span className="text-xs font-medium text-gray-700">{Math.round(oggi.fibre)}g</span>
                </div>
                <BarraSecondaria valore={oggi.fibre} max={25} colore="bg-green-400" />
                <p className="text-xs text-gray-300 mt-1">obiettivo 25g</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-3">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs text-gray-500">Sale</span>
                  <span className="text-xs font-medium text-gray-700">{(Math.round(oggi.sale * 10) / 10)}g</span>
                </div>
                <BarraSecondaria valore={oggi.sale} max={5} colore="bg-purple-400" />
                <p className="text-xs text-gray-300 mt-1">max 5g</p>
              </div>
            </div>
          </div>
        </div>

        {/* Acqua card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-50">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Droplets size={16} className="text-blue-400" />
              <span className="font-medium text-gray-700 text-sm">Idratazione</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">{acqua}<span className="text-gray-300 font-normal"> / {obiettivi.obiettivo_acqua || 2000}ml</span></span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
            <div className="h-2 rounded-full bg-blue-400 transition-all duration-500" style={{ width: `${acquaPct}%` }} />
          </div>
          <div className="flex gap-2">
            {[150, 250, 500].map(ml => (
              <button key={ml} onClick={() => aggiungiAcqua(ml)}
                className="flex-1 flex items-center justify-center gap-1 bg-blue-50 hover:bg-blue-100 active:scale-95 text-blue-500 text-xs font-medium py-2.5 rounded-2xl transition-all">
                <Plus size={12} />+{ml}ml
              </button>
            ))}
          </div>
        </div>

        {/* Nav grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { href: '/pasti', icon: <UtensilsCrossed size={20} />, label: 'Diario Pasti', color: 'text-emerald-500', bg: 'bg-emerald-50' },
            { href: '/alimenti', icon: <span className="text-xl">🥦</span>, label: 'Alimenti', color: 'text-purple-500', bg: 'bg-purple-50' },
            { href: '/profilo', icon: <span className="text-xl">⚙️</span>, label: 'Profilo', color: 'text-orange-500', bg: 'bg-orange-50' },
            { href: '/statistiche', icon: <TrendingUp size={20} />, label: 'Statistiche', color: 'text-blue-500', bg: 'bg-blue-50' },
          ].map(item => (
            <a key={item.href} href={item.href}
              className="bg-white rounded-3xl p-5 shadow-sm border border-gray-50 flex items-center gap-3 hover:shadow-md active:scale-95 transition-all">
              <div className={`w-10 h-10 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center`}>
                {item.icon}
              </div>
              <span className="font-medium text-gray-700 text-sm">{item.label}</span>
            </a>
          ))}
        </div>

      </div>
    </div>
  )
}