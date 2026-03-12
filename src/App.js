import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Auth from './Auth'
import Dashboard from './Dashboard'
import Pasti from './Pasti'
import Alimenti from './Alimenti'
import Peso from './Peso'
import Statistiche from './Statistiche'
import Profilo from './Profilo'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Controlla sessione attiva
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Ascolta cambiamenti autenticazione
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-500">
      Caricamento...
    </div>
  )

  if (!user) return <Auth />

  // Routing semplice basato su pathname
  const path = window.location.pathname

  if (path === '/pasti') return <Pasti user={user} />
  if (path === '/alimenti') return <Alimenti user={user} />
  if (path === '/peso') return <Peso user={user} />
  if (path === '/statistiche') return <Statistiche user={user} />
  if (path === '/profilo') return <Profilo user={user} />

  return <Dashboard user={user} />
}

export default App