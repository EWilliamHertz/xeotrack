'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [errorMsg, setErrorMsg] = useState<string>('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/')
      return
    }

  const fetchStats = async () => {
      try {
        const res = await fetch('/api/metrics', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          },
          credentials: 'include' // <--- This forces the Cloud Shell proxy to let the request through!
        })
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        } else if (res.status === 401) {
          localStorage.removeItem('token')
          router.push('/')
        } else {
          // Capture backend server errors (like missing tables or 500 crashes)
          const text = await res.text()
          setErrorMsg(`Server Error ${res.status}: ${text}`)
        }
      } catch (err: any) {
        // Capture network errors (like adblockers or dropped connections)
        setErrorMsg(`Network Error: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [router])
  if (loading) return <div className="flex items-center justify-center h-screen text-slate-300">Loading Dashboard...</div>

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text">
            Dashboard
          </h1>
          <button
            onClick={() => {
              localStorage.removeItem('token')
              router.push('/')
            }}
            className="px-4 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 rounded transition text-sm"
          >
            Logout
          </button>
        </div>

        {stats ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-lg">
                <p className="text-slate-400 text-sm mb-1">Net Worth</p>
                <p className="text-3xl font-semibold text-slate-100">{stats.net_worth.toLocaleString()} SEK</p>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-lg">
                <p className="text-slate-400 text-sm mb-1">Liquid Balance</p>
                <p className="text-2xl font-semibold text-slate-100">{stats.total_balance.toLocaleString()} SEK</p>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-lg">
                <p className="text-slate-400 text-sm mb-1">Monthly Income</p>
                <p className="text-2xl font-semibold text-emerald-400">+{stats.monthly_income.toLocaleString()} SEK</p>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-lg">
                <p className="text-slate-400 text-sm mb-1">Monthly Expenses</p>
                <p className="text-2xl font-semibold text-rose-400">-{stats.monthly_expenses.toLocaleString()} SEK</p>
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-slate-200 mb-4">Recent Transactions</h2>
              {stats.recent_transactions.length > 0 ? (
                <div className="divide-y divide-slate-700">
                  {stats.recent_transactions.map((txn: any) => (
                    <div key={txn.id} className="py-3 flex justify-between items-center hover:bg-slate-700/50 transition px-2 rounded -mx-2">
                      <div>
                        <p className="text-slate-200 font-medium">{txn.description || txn.category}</p>
                        <p className="text-slate-500 text-xs">{txn.date} • {txn.party || 'No party'}</p>
                      </div>
                      <p className={`font-medium ${txn.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {txn.type === 'income' ? '+' : '-'}{Number(txn.amount).toLocaleString()} SEK
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm italic">No recent transactions found.</p>
              )}
            </div>
          </>
        ) : (
           <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center text-slate-400">
             <p className="mb-4">Failed to load dashboard statistics.</p>
             {errorMsg && (
               <div className="bg-slate-950 border border-red-900 text-red-400 p-4 rounded text-sm text-left font-mono overflow-auto">
                 {errorMsg}
               </div>
             )}
           </div>
        )}
      </div>
    </div>
  )
}
