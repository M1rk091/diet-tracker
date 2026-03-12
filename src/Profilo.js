import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { ArrowLeft, Save } from 'lucide-react'

const LIVELLI_ATTIVITA = [
  { id: 'sedentario', label: 'Sedentario', desc: 'Lavoro d\'ufficio, poco movimento', pal: 1.2 },
  { id: 'leggero', label: 'Leggermente attivo', desc: 'Esercizio leggero 1-3 giorni/sett.', pal: 1.375 },
  { id: 'moderato', label: 'Moderatamente attivo', desc: 'Esercizio moderato 3-5 giorni/sett.', pal: 1.55 },
  { id: 'attivo', label: 'Molto attivo', desc: 'Esercizio intenso 6-7 giorni/sett.', pal: 1.725 },
  { id: 'molto_attivo', label: 'Estremamente attivo', desc: 'Lavoro fisico intenso + allenamento', pal: 1.9 },
]

const OBIETTIVI = [
  { id: 'dimagrimento_veloce', label: 'Dimagrimento rapido', desc: 'Deficit -500 kcal/giorno (-0.5kg/sett.)', modificatore: -500 },
  { id: 'dimagrimento', label: 'Dimagrimento graduale', desc: 'Deficit -250 kcal/giorno (-0.25kg/sett.)', modificatore: -250 },
  { id: 'mantenimento', label: 'Mantenimento', desc: 'Mantieni il peso attuale', modificatore: 0 },
  { id: 'aumento', label: 'Aumento massa', desc: 'Surplus +250 kcal/giorno', modificatore: 250 },
  { id: 'aumento_veloce', label: 'Aumento massa rapido', desc: 'Surplus +500 kcal/giorno', modificatore: 500 },
]

export default function Profilo({ user }) {
  const [form, setForm] = useState({
    sesso: 'M',
    eta: '',
    altezza_cm: '',
    peso_kg: '',
    livello_attivita: 'sedentario',
    obiettivo: 'mantenimento',
  })
  const [risultati, setRisultati] = useState(null)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchProfilo() }, [])

  const fetchProfilo = async () => {
    const { data } = await supabase
      .from('profiles').select('*').eq('id', user.id).single()
    if (data && data.eta) {
      setForm({
        sesso: data.sesso || 'M',
        eta: data.eta || '',
        altezza_cm: data.altezza_cm || '',
        peso_kg: data.peso_kg || '',
        livello_attivita: data.livello_attivita || 'sedentario',
        obiettivo: data.obiettivo || 'mantenimento',
      })
      calcolaFabbisogno({
        sesso: data.sesso || 'M',
        eta: data.eta,
        altezza_cm: data.altezza_cm,
        peso_kg: data.peso_kg,
        livello_attivita: data.livello_attivita || 'sedentario',
        obiettivo: data.obiettivo || 'mantenimento',
      })
    }
    setLoading(false)
  }

  const calcolaFabbisogno = (f) => {
    if (!f.eta || !f.altezza_cm || !f.peso_kg) return

    // Mifflin-St Jeor (formula più accurata per la popolazione generale)
    let bmr
    if (f.sesso === 'M') {
      bmr = 10 * parseFloat(f.peso_kg) + 6.25 * parseFloat(f.altezza_cm) - 5 * parseFloat(f.eta) + 5
    } else {
      bmr = 10 * parseFloat(f.peso_kg) + 6.25 * parseFloat(f.altezza_cm) - 5 * parseFloat(f.eta) - 161
    }

    const pal = LIVELLI_ATTIVITA.find(l => l.id === f.livello_attivita)?.pal || 1.2
    const tdee = Math.round(bmr * pal)
    const modificatore = OBIETTIVI.find(o => o.id === f.obiettivo)?.modificatore || 0
    const calorieTarget = tdee + modificatore

    // Macronutrienti secondo linee guida EFSA
    // Proteine: 1.6g/kg per attivi, 1.2g/kg per sedentari (ottimale per composizione corporea)
    const palValue = pal
    const proteine_g = Math.round(
      parseFloat(f.peso_kg) * (palValue >= 1.55 ? 1.6 : 1.2)
    )
    const proteine_kcal = proteine_g * 4

    // Grassi: 25-30% delle calorie target (EFSA 20-35%)
    const grassi_kcal = Math.round(calorieTarget * 0.275)
    const grassi_g = Math.round(grassi_kcal / 9)

    // Carboidrati: restante (EFSA 45-60%)
    const carbo_kcal = calorieTarget - proteine_kcal - grassi_kcal
    const carbo_g = Math.round(carbo_kcal / 4)

    setRisultati({ bmr: Math.round(bmr), tdee, calorieTarget, proteine_g, grassi_g, carbo_g })
    return { bmr: Math.round(bmr), tdee, calorieTarget, proteine_g, grassi_g, carbo_g }
  }

  const salva = async () => {
    if (!risultati) return
    const upsertData = {
      id: user.id,
      sesso: form.sesso,
      eta: parseInt(form.eta),
      altezza_cm: parseInt(form.altezza_cm),
      peso_kg: parseFloat(form.peso_kg),
      livello_attivita: form.livello_attivita,
      obiettivo: form.obiettivo,
      obiettivo_calorie: risultati.calorieTarget,
      obiettivo_proteine: risultati.proteine_g,
      obiettivo_carboidrati: risultati.carbo_g,
      obiettivo_grassi: risultati.grassi_g,
    }
    await supabase.from('profiles').upsert(upsertData)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleChange = (field, value) => {
    const newForm = { ...form, [field]: value }
    setForm(newForm)
    calcolaFabbisogno(newForm)
  }

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
        <h1 className="font-semibold text-gray-900">Profilo & Fabbisogno</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-3">

        {/* Dati biometrici */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-50">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-4">Dati biometrici</p>

          {/* Sesso */}
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2 font-medium">Sesso biologico</p>
            <div className="grid grid-cols-2 gap-2">
              {[{ id: 'M', label: '♂ Maschio' }, { id: 'F', label: '♀ Femmina' }].map(s => (
                <button key={s.id} onClick={() => handleChange('sesso', s.id)}
                  className={`py-3 rounded-2xl text-sm font-medium transition ${form.sesso === s.id ? 'bg-emerald-500 text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Eta, altezza, peso */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div>
              <p className="text-xs text-gray-400 mb-1.5 text-center">Età</p>
              <input type="number" placeholder="30"
                value={form.eta} onChange={e => handleChange('eta', e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 text-center"
              />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1.5 text-center">Altezza (cm)</p>
              <input type="number" placeholder="175"
                value={form.altezza_cm} onChange={e => handleChange('altezza_cm', e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 text-center"
              />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1.5 text-center">Peso (kg)</p>
              <input type="number" placeholder="75" step="0.1"
                value={form.peso_kg} onChange={e => handleChange('peso_kg', e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 text-center"
              />
            </div>
          </div>
        </div>

        {/* Livello attività */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-50">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">Livello di attività</p>
          <div className="space-y-2">
            {LIVELLI_ATTIVITA.map(l => (
              <button key={l.id} onClick={() => handleChange('livello_attivita', l.id)}
                className={`w-full text-left px-4 py-3 rounded-2xl transition ${form.livello_attivita === l.id ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50 border border-transparent hover:bg-gray-100'}`}>
                <p className={`text-sm font-medium ${form.livello_attivita === l.id ? 'text-emerald-700' : 'text-gray-700'}`}>{l.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{l.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Obiettivo */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-50">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">Obiettivo</p>
          <div className="space-y-2">
            {OBIETTIVI.map(o => (
              <button key={o.id} onClick={() => handleChange('obiettivo', o.id)}
                className={`w-full text-left px-4 py-3 rounded-2xl transition ${form.obiettivo === o.id ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50 border border-transparent hover:bg-gray-100'}`}>
                <p className={`text-sm font-medium ${form.obiettivo === o.id ? 'text-emerald-700' : 'text-gray-700'}`}>{o.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{o.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Risultati */}
        {risultati && (
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-50">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-4">Il tuo fabbisogno calcolato</p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 rounded-2xl p-4 text-center">
                <p className="text-xs text-gray-400 mb-1">BMR</p>
                <p className="text-xl font-semibold text-gray-700">{risultati.bmr}</p>
                <p className="text-xs text-gray-400">kcal a riposo</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 text-center">
                <p className="text-xs text-gray-400 mb-1">TDEE</p>
                <p className="text-xl font-semibold text-gray-700">{risultati.tdee}</p>
                <p className="text-xs text-gray-400">kcal mantenimento</p>
              </div>
            </div>

            <div className="bg-emerald-50 rounded-2xl p-4 text-center mb-4">
              <p className="text-xs text-emerald-600 mb-1 font-medium">Obiettivo calorico giornaliero</p>
              <p className="text-3xl font-bold text-emerald-600">{risultati.calorieTarget}</p>
              <p className="text-xs text-emerald-500">kcal / giorno</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-blue-50 rounded-2xl p-3 text-center">
                <p className="text-xs text-blue-400 mb-1">Proteine</p>
                <p className="text-lg font-semibold text-blue-500">{risultati.proteine_g}g</p>
                <p className="text-xs text-blue-300">{Math.round(risultati.proteine_g * 4 / risultati.calorieTarget * 100)}%</p>
              </div>
              <div className="bg-amber-50 rounded-2xl p-3 text-center">
                <p className="text-xs text-amber-400 mb-1">Carboidrati</p>
                <p className="text-lg font-semibold text-amber-500">{risultati.carbo_g}g</p>
                <p className="text-xs text-amber-300">{Math.round(risultati.carbo_g * 4 / risultati.calorieTarget * 100)}%</p>
              </div>
              <div className="bg-rose-50 rounded-2xl p-3 text-center">
                <p className="text-xs text-rose-400 mb-1">Grassi</p>
                <p className="text-lg font-semibold text-rose-500">{risultati.grassi_g}g</p>
                <p className="text-xs text-rose-300">{Math.round(risultati.grassi_g * 9 / risultati.calorieTarget * 100)}%</p>
              </div>
            </div>

            <p className="text-xs text-gray-300 text-center mt-3">Formula Mifflin-St Jeor · Linee guida EFSA</p>
          </div>
        )}

        {/* Salva */}
        <button
          onClick={salva}
          disabled={!risultati}
          className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 active:scale-95 text-white py-4 rounded-3xl font-medium transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
        >
          <Save size={18} />
          {saved ? '✓ Salvato!' : 'Salva e aggiorna obiettivi'}
        </button>

        <p className="text-xs text-gray-300 text-center pb-4">
          Salvando, gli obiettivi nella dashboard verranno aggiornati automaticamente
        </p>

      </div>
    </div>
  )
}