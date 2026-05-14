'use client'
import { useEffect, useState } from 'react'
import { Plus, PiggyBank, Target, ArrowRight, Settings2, Trash2, X, Activity, Gift, DollarSign, LineChart as ChartIcon, List } from 'lucide-react'
import { fetchSavings, createSavingsAccount, updateSavingsAccount, deleteSavingsAccount, logSavingsTransaction, fetchSavingsLogs } from './actions'

export default function SavingsPage() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState({ name: '', target_amount: '', balance: '' })

  const [viewedAcc, setViewedAcc] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', target_amount: '' })
  
  const [logs, setLogs] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'history' | 'chart'>('history')
  const [actionType, setActionType] = useState<'deposit' | 'withdraw' | 'in-kind' | null>(null)
  const [actionForm, setActionForm] = useState({ amount: '', description: '' })

  const loadSavings = async () => {
    const res = await fetchSavings(localStorage.getItem('token') || '')
    if (res.success) setAccounts(res.data)
  }

  useEffect(() => { loadSavings() }, [])

  const handleSave = async (e: any) => {
    e.preventDefault()
    const res = await createSavingsAccount(localStorage.getItem('token') || '', form)
    if (res.success) {
      setIsModalOpen(false)
      setForm({ name: '', target_amount: '', balance: '' })
      loadSavings()
    }
  }

  const handleUpdateAccount = async () => {
    if (!viewedAcc) return
    const res = await updateSavingsAccount(localStorage.getItem('token') || '', viewedAcc.id, editForm.name, editForm.target_amount)
    if (res.success) {
      setIsEditing(false)
      setViewedAcc({...viewedAcc, name: editForm.name, target_amount: editForm.target_amount})
      loadSavings()
    }
  }

  const handleDelete = async () => {
    if (!viewedAcc) return
    const res = await deleteSavingsAccount(localStorage.getItem('token') || '', viewedAcc.id)
    if (res.success) { setViewedAcc(null); loadSavings(); }
  }

  const handleTransaction = async (e: any) => {
    e.preventDefault()
    if (!viewedAcc || !actionType) return
    const res = await logSavingsTransaction(localStorage.getItem('token') || '', viewedAcc.id, actionType, Number(actionForm.amount), actionForm.description)
    if (res.success) {
      setActionType(null)
      setActionForm({ amount: '', description: '' })
      
      // Refresh local state
      const logRes = await fetchSavingsLogs(localStorage.getItem('token') || '', viewedAcc.id)
      if (logRes.success) setLogs(logRes.data)
      
      const newBal = actionType === 'withdraw' 
        ? viewedAcc.balance - Number(actionForm.amount) 
        : viewedAcc.balance + Number(actionForm.amount)
        
      setViewedAcc({...viewedAcc, balance: newBal})
      loadSavings()
    }
  }

  // Calculate cumulative balance points for the chart
  const getChartPoints = () => {
    if (logs.length === 0) return ""
    let runningBalance = 0
    const points = logs.map((log, index) => {
      runningBalance += (log.type === 'withdraw' ? -Number(log.amount) : Number(log.amount))
      // Scale X to 100%, Y to 100px height. Min Y is 0, Max Y is current balance or slightly higher
      const x = (index / Math.max(1, logs.length - 1)) * 400
      const maxBal = Math.max(viewedAcc.balance, runningBalance, 1000)
      const y = 100 - ((runningBalance / maxBal) * 100)
      return `${x},${y}`
    })
    return `0,100 ${points.join(' ')}`
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
          <PiggyBank className="text-emerald-400" size={32} /> Savings
        </h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 p-3 rounded-2xl shadow-lg transition">
          <Plus size={24} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accounts.map((acc: any) => {
          const progress = acc.target_amount > 0 ? Math.min(100, (acc.balance / acc.target_amount) * 100) : 0
          return (
            <div 
              key={acc.id} 
              onClick={async () => {
                setViewedAcc(acc)
                setEditForm({ name: acc.name, target_amount: acc.target_amount })
                setIsEditing(false)
                setActionType(null)
                const logRes = await fetchSavingsLogs(localStorage.getItem('token') || '', acc.id)
                if (logRes.success) setLogs(logRes.data)
              }}
              className="cursor-pointer bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-6 rounded-3xl flex flex-col gap-4 relative overflow-hidden transition"
            >
              <div className="absolute top-0 left-0 h-1 bg-slate-800 w-full">
                <div className="h-full bg-emerald-500 transition-all duration-1000" style={{width: `${progress}%`}} />
              </div>
              
              <div className="flex justify-between items-start pt-2">
                <h3 className="font-bold text-xl text-slate-200">{acc.name}</h3>
                <span className="bg-slate-800 text-slate-400 px-3 py-1 rounded-lg text-xs font-bold tracking-widest">VIEW</span>
              </div>

              <div>
                <p className="text-3xl font-mono font-black text-white">{Number(acc.balance).toLocaleString()} SEK</p>
                {Number(acc.target_amount) > 0 && (
                  <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                    <Target size={14} /> Goal: {Number(acc.target_amount).toLocaleString()} SEK ({progress.toFixed(0)}%)
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-[2.5rem] p-8 space-y-4 shadow-2xl relative">
            <button type="button" onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X size={24} /></button>
            <h2 className="text-2xl font-bold mb-4 text-white">Create Account</h2>
            <input required placeholder="Account Name (e.g. Family Company)" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-white outline-none focus:border-emerald-500" onChange={e => setForm({...form, name: e.target.value})} />
            <input type="number" placeholder="Initial Cash Balance (Optional)" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-white outline-none focus:border-emerald-500" onChange={e => setForm({...form, balance: e.target.value})} />
            <input type="number" placeholder="Target Goal (Optional)" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-white outline-none focus:border-emerald-500" onChange={e => setForm({...form, target_amount: e.target.value})} />
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 py-4 rounded-2xl font-bold shadow-lg mt-4">Save Account</button>
          </form>
        </div>
      )}

      {/* Detailed View / Edit Modal */}
      {viewedAcc && (
        <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-[2.5rem] p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-white">{viewedAcc.name}</h2>
                <p className="text-sm uppercase font-bold tracking-wider text-emerald-400">Savings & Assets</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setIsEditing(!isEditing)} className={`p-2 rounded-xl transition ${isEditing ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                  <Settings2 size={20} />
                </button>
                <button onClick={() => setViewedAcc(null)} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition">
                  <X size={20} />
                </button>
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <p className="text-sm font-bold text-slate-300 mb-2">Edit Account Details</p>
                <div className="space-y-2">
                  <label className="text-xs text-slate-500 font-bold tracking-widest">ACCOUNT NAME</label>
                  <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full bg-slate-900 border border-slate-800 p-3 rounded-lg text-white outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-500 font-bold tracking-widest">TARGET GOAL (SEK)</label>
                  <input type="number" value={editForm.target_amount} onChange={e => setEditForm({...editForm, target_amount: e.target.value})} className="w-full bg-slate-900 border border-slate-800 p-3 rounded-lg font-mono text-white outline-none" />
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={handleUpdateAccount} className="flex-1 bg-emerald-600 hover:bg-emerald-500 py-3 rounded-lg font-bold">Save Changes</button>
                  <button onClick={handleDelete} className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 px-4 py-3 rounded-lg transition"><Trash2 size={20} /></button>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center">
                  <p className="text-xs text-slate-500 font-bold tracking-widest mb-1">TOTAL VALUE (CASH + ASSETS)</p>
                  <p className="font-mono text-3xl font-black text-white">{Number(viewedAcc.balance).toLocaleString()} SEK</p>
                  {Number(viewedAcc.target_amount) > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-800">
                      <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                        <span>Progress</span>
                        <span>{Math.min(100, (viewedAcc.balance / viewedAcc.target_amount) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{width: `${Math.min(100, (viewedAcc.balance / viewedAcc.target_amount) * 100)}%`}} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Transaction Actions */}
                <div className="flex gap-2">
                  <button onClick={() => setActionType('deposit')} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold bg-slate-950 border border-slate-800 text-emerald-400 hover:bg-slate-800 transition"><DollarSign size={14}/> DEPOSIT</button>
                  <button onClick={() => setActionType('withdraw')} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold bg-slate-950 border border-slate-800 text-rose-400 hover:bg-slate-800 transition"><ArrowRight size={14}/> WITHDRAW</button>
                  <button onClick={() => setActionType('in-kind')} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold bg-slate-950 border border-slate-800 text-cyan-400 hover:bg-slate-800 transition"><Gift size={14}/> IN-KIND</button>
                </div>

                {actionType && (
                  <form onSubmit={handleTransaction} className="bg-slate-900 border border-emerald-500/30 p-4 rounded-xl space-y-3">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                        {actionType === 'in-kind' ? <><Gift size={16}/> Donate Asset</> : actionType === 'deposit' ? 'Cash Deposit' : 'Cash Withdrawal'}
                      </p>
                      <button type="button" onClick={() => setActionType(null)} className="text-slate-500 hover:text-white"><X size={16}/></button>
                    </div>
                    
                    <input required type="number" placeholder={actionType === 'in-kind' ? "Appreciated Value (SEK)" : "Amount (SEK)"} value={actionForm.amount} onChange={e => setActionForm({...actionForm, amount: e.target.value})} className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg text-sm outline-none focus:border-emerald-500" />
                    
                    {(actionType === 'in-kind' || actionType === 'withdraw') && (
                      <input required={actionType === 'in-kind'} placeholder={actionType === 'in-kind' ? "Asset Name (e.g. Machinery, Artwork)" : "Reason/Reference (Optional)"} value={actionForm.description} onChange={e => setActionForm({...actionForm, description: e.target.value})} className="w-full bg-slate-950 border border-slate-800 p-3 rounded-lg text-sm outline-none focus:border-emerald-500" />
                    )}

                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded-lg text-sm font-bold">
                      Confirm {actionType === 'in-kind' ? 'Asset Injection' : 'Transaction'}
                    </button>
                  </form>
                )}

                {/* Tabs for Chart vs History */}
                <div className="pt-2">
                  <div className="flex gap-4 border-b border-slate-800 mb-4">
                    <button onClick={() => setActiveTab('history')} className={`pb-2 text-sm font-bold flex items-center gap-2 transition-colors ${activeTab === 'history' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}><List size={16}/> Ledger</button>
                    <button onClick={() => setActiveTab('chart')} className={`pb-2 text-sm font-bold flex items-center gap-2 transition-colors ${activeTab === 'chart' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}><ChartIcon size={16}/> Growth Chart</button>
                  </div>

                  {activeTab === 'history' ? (
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                      {logs.length === 0 ? <p className="text-center text-slate-500 text-sm py-4">No transactions yet.</p> : logs.slice().reverse().map((log: any) => (
                        <div key={log.id} className="flex justify-between items-center text-sm bg-slate-950 p-3 rounded-lg border border-slate-800/50">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-black uppercase px-2 py-1 rounded border ${log.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : log.type === 'withdraw' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'}`}>
                                {log.type}
                              </span>
                              {log.description && <span className="text-slate-400 text-xs truncate max-w-[100px]">{log.description}</span>}
                            </div>
                            <span className="text-slate-600 text-[10px] mt-1 block">{new Date(log.date).toLocaleString()}</span>
                          </div>
                          <span className={`font-mono font-bold ${log.type === 'withdraw' ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {log.type === 'withdraw' ? '-' : '+'}{Number(log.amount).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-950 rounded-2xl p-4 h-48 relative flex items-end border border-slate-800 overflow-hidden">
                      {logs.length > 0 ? (
                        <>
                          <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 400 100">
                            <polyline 
                              points={getChartPoints()} 
                              fill="none" 
                              stroke="#10b981" 
                              strokeWidth="3" 
                              vectorEffect="non-scaling-stroke"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path 
                              d={`M 0,100 L ${getChartPoints()} L 400,100 Z`} 
                              fill="url(#emerald-gradient)" 
                              opacity="0.2"
                            />
                            <defs>
                              <linearGradient id="emerald-gradient" x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0%" stopColor="#10b981" />
                                <stop offset="100%" stopColor="transparent" />
                              </linearGradient>
                            </defs>
                          </svg>
                        </>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">Not enough data to graph</div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}