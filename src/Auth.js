import { useState } from 'react'
import { supabase } from './supabaseClient'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleAuth = async () => {
    setLoading(true)
    setMessage('')
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage(error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setMessage(error.message)
      else setMessage('Controlla la tua email per confermare la registrazione!')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-500 rounded-2xl mb-4 shadow-lg shadow-emerald-200">
            <span className="text-2xl">🥗</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">DietTracker</h1>
          <p className="text-sm text-gray-400 mt-1">{isLogin ? 'Bentornato' : 'Crea il tuo account'}</p>
        </div>

        {/* Form */}
        <div className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent placeholder-gray-300 transition"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAuth()}
            className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent placeholder-gray-300 transition"
          />
        </div>

        {message && (
          <p className="text-xs text-center mt-4 text-emerald-600 bg-emerald-50 py-2 px-4 rounded-xl">{message}</p>
        )}

        <button
          onClick={handleAuth}
          disabled={loading}
          className="w-full mt-5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-medium py-3.5 rounded-2xl transition-all duration-150 shadow-lg shadow-emerald-200 text-sm"
        >
          {loading ? '...' : isLogin ? 'Accedi' : 'Registrati'}
        </button>

        <p className="text-center text-xs text-gray-400 mt-5">
          {isLogin ? 'Non hai un account?' : 'Hai già un account?'}{' '}
          <span onClick={() => setIsLogin(!isLogin)} className="text-emerald-500 font-medium cursor-pointer hover:underline">
            {isLogin ? 'Registrati' : 'Accedi'}
          </span>
        </p>
      </div>
    </div>
  )
}