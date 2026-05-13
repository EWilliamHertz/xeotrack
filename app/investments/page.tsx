'use client'
import { useEffect, useState } from 'react'
import { Plus, TrendingUp, TrendingDown, Trash2, X } from 'lucide-react'
import { fetchInvestments, createInvestment, updateInvestmentValue, deleteInvestment } from './actions'

export default function InvestmentsPage() {
  const [investments, setInvestments] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [viewedInv, setViewedInv] = useState<any>(null)
  const [updateValue, setUpdateValue] = useState('')
  const [form, setForm] = useState({
    name: '', category: 'Stock', quantity: '', buy_price: '', purchase_date: new Date().toISOString().split('T')[0]
  })

  const loadInvestments = async () => {
    const res = await fetchInvestments(localStorage.getItem('token') || '')
    if (res.success) setInvestments(res.data)
  }

  useEffect(() => { loadInvestments() }, [])

  const handleSave = async (e: any) => {
    e.preventDefault()
    const res = await createInvestment(localStorage.getItem('token') || '', form)
    if (res.success) {
      setIsModalOpen(false)
      loadInvestments()
    }
  }

  const handleUpdate = async () => {
    if (!viewedInv || !updateValue) return
    const res = await updateInvestmentValue(localStorage.getItem('token') || '', viewedInv.id, updateValue)
    if (res.success) {
      setViewedInv(null)
      loadInvestments()
    }
  }

  const handleDelete = async () => {
    if (!viewedInv) return
    const res = await deleteInvestment(localStorage.getItem('token') || '', viewedInv.id)
    if (res.success) {
      setViewedInv(null)
      loadInvestments()
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-100">Investments</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-cyan-600 hover:bg-cyan-500 p-3 rounded-2xl shadow-lg">
          <Plus size={24} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {investments.map((inv: any) => (
          <div 
            key={inv.id} 
            onClick={() => { setViewedInv(inv); setUpdateValue(inv.current_value); }}
            className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 cursor-pointer p-6 rounded-3xl flex justify-between items-center transition"
          >
            <div>
              <h3 className="font-bold text-lg text-slate-200">{inv.name}</h3>
              <p className="text-sm text-slate-500">{inv.quantity} units @ {inv.buy_price} SEK</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-mono font-bold text-slate-100">{Number(inv.current_value).toLocaleString()} SEK</p>
              <div className={`flex items-center gap-1 justify-end text-sm font-bold ${inv.profit_loss >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {inv.profit_loss >= 0 ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
                {inv.profit_loss >= 0 ? '+' : ''}{Number(inv.profit_loss).toLocaleString()} ({inv.profit_loss_pct}%)
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-[2.5rem] p-8 space-y-4 shadow-2xl">
            <h2 className="text-2xl font-bold mb-4">Add Investment</h2>
            
            <input required placeholder="Asset Name (e.g. AAPL)" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl" onChange={e => setForm({...form, name: e.target.value})} />
            
            <div className="grid grid-cols-2 gap-3">
              <input required type="number" placeholder="Quantity" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl" onChange={e => setForm({...form, quantity: e.target.value})} />
              <input required type="number" placeholder="Buy Price (SEK)" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl" onChange={e => setForm({...form, buy_price: e.target.value})} />
            </div>
            
            <input required type="date" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl" value={form.purchase_date} onChange={e => setForm({...form, purchase_date: e.target.value})} />

            <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 py-4 rounded-2xl font-bold shadow-lg">Save Investment</button>
            <button type="button" onClick={() => setIsModalOpen(false)} className="w-full text-slate-500 text-sm py-2">Discard</button>
          </form>
        </div>
      )}

      {/* View/Edit Modal */}
      {viewedInv && (
        <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-[2.5rem] p-8 space-y-6 shadow-2xl relative">
            <button onClick={() => setViewedInv(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white">
              <X size={24} />
            </button>
            
            <div>
              <h2 className="text-2xl font-bold text-white">{viewedInv.name}</h2>
              <p className="text-slate-400 text-sm">Purchased {new Date(viewedInv.purchase_date).toLocaleDateString()}</p>
            </div>

            {/* Trajectory Graph Visualization */}
            <div className="bg-slate-950 rounded-2xl p-4 h-32 relative flex items-end border border-slate-800 overflow-hidden">
              <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
                <path 
                  d={`M 0,${viewedInv.profit_loss >= 0 ? '100' : '20'} L 400,${viewedInv.profit_loss >= 0 ? '20' : '100'}`} 
                  stroke={viewedInv.profit_loss >= 0 ? '#10b981' : '#f43f5e'} 
                  strokeWidth="4" 
                  fill="none" 
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <p className="text-xs text-slate-500 font-bold tracking-widest mb-1">BUY VALUE</p>
                <p className="font-mono text-slate-200">{(viewedInv.quantity * viewedInv.buy_price).toLocaleString()} SEK</p>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <p className="text-xs text-slate-500 font-bold tracking-widest mb-1">PROFIT/LOSS</p>
                <p className={`font-mono ${viewedInv.profit_loss >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {viewedInv.profit_loss >= 0 ? '+' : ''}{viewedInv.profit_loss.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-500 font-bold tracking-widest">UPDATE CURRENT TOTAL VALUE (SEK)</label>
              <input 
                type="number" 
                value={updateValue} 
                onChange={e => setUpdateValue(e.target.value)} 
                className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl font-mono text-xl text-white" 
              />
            </div>

            <div className="flex gap-2">
              <button onClick={handleUpdate} className="flex-1 bg-cyan-600 hover:bg-cyan-500 py-3 rounded-xl font-bold">Update</button>
              <button onClick={handleDelete} className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 px-4 py-3 rounded-xl transition">
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}