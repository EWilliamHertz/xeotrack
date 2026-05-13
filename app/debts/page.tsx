'use client'
import { useEffect, useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { fetchDebts, createDebt, updateDebtValue, deleteDebt } from './actions'

export default function DebtsPage() {
  const [debts, setDebts] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'in' | 'out'>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const [viewedDebt, setViewedDebt] = useState<any>(null)
  const [updateValue, setUpdateValue] = useState('')

  const [form, setForm] = useState({
    name: '', type: 'owed by me', total_amount: '', remaining_amount: '', interest_rate: '0', monthly_payment: '0'
  })

  const loadDebts = async () => {
    const res = await fetchDebts(localStorage.getItem('token') || '')
    if (res.success) setDebts(res.data)
  }

  useEffect(() => { loadDebts() }, [])

  const handleSave = async (e: any) => {
    e.preventDefault()
    const res = await createDebt(localStorage.getItem('token') || '', form)
    if (res.success) {
      setIsModalOpen(false)
      setForm({ name: '', type: 'owed by me', total_amount: '', remaining_amount: '', interest_rate: '0', monthly_payment: '0' })
      loadDebts()
    }
  }

  const handleUpdate = async () => {
    if (!viewedDebt || !updateValue) return
    const res = await updateDebtValue(localStorage.getItem('token') || '', viewedDebt.id, updateValue)
    if (res.success) { setViewedDebt(null); loadDebts(); }
  }

  const handleDelete = async () => {
    if (!viewedDebt) return
    const res = await deleteDebt(localStorage.getItem('token') || '', viewedDebt.id)
    if (res.success) { setViewedDebt(null); loadDebts(); }
  }

  // Robust check for what constitutes an asset (P.O.M)
  const isAsset = (typeString: string) => {
    const t = (typeString || '').toLowerCase().trim()
    return (t.includes('owed') && t.includes('to me')) || t === 'owed_to_me' || t === 'receivable' || t === 'receivables' || t === 'asset'
  }
  const pom = debts.filter(d => isAsset(d.type)).reduce((sum, d) => sum + Number(d.remaining_amount), 0)
  const iou = debts.filter(d => !isAsset(d.type)).reduce((sum, d) => sum + Number(d.remaining_amount), 0)
  const total = pom - iou

  const filteredDebts = debts.filter(d => {
    if (activeTab === 'in') return isAsset(d.type)
    if (activeTab === 'out') return !isAsset(d.type)
    return true
  })

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-100">Debts & Loans</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-cyan-600 hover:bg-cyan-500 p-3 rounded-2xl shadow-lg">
          <Plus size={24} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-center">
          <p className="text-xs text-slate-500 font-bold tracking-widest mb-1">I.O.U (OUT)</p>
          <p className="text-xl font-bold text-rose-400">{iou.toLocaleString()} SEK</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-center">
          <p className="text-xs text-slate-500 font-bold tracking-widest mb-1">P.O.M (IN)</p>
          <p className="text-xl font-bold text-emerald-400">{pom.toLocaleString()} SEK</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-center">
          <p className="text-xs text-slate-500 font-bold tracking-widest mb-1">TOTAL NET</p>
          <p className={`text-xl font-bold ${total >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {total > 0 ? '+' : ''}{total.toLocaleString()} SEK
          </p>
        </div>
      </div>

      <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800 w-full md:w-fit">
        <button onClick={() => setActiveTab('all')} className={`px-6 py-2 rounded-xl text-sm font-bold transition-colors ${activeTab === 'all' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}>All</button>
        <button onClick={() => setActiveTab('in')} className={`px-6 py-2 rounded-xl text-sm font-bold transition-colors ${activeTab === 'in' ? 'bg-slate-800 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}>IN (P.O.M)</button>
        <button onClick={() => setActiveTab('out')} className={`px-6 py-2 rounded-xl text-sm font-bold transition-colors ${activeTab === 'out' ? 'bg-slate-800 text-rose-400' : 'text-slate-500 hover:text-slate-300'}`}>OUT (I.O.U)</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDebts.map((d: any) => (
          <div 
            key={d.id} 
            onClick={() => { setViewedDebt(d); setUpdateValue(d.remaining_amount); }}
            className="cursor-pointer bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col gap-2 hover:border-cyan-500/50 transition"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg text-slate-200">{d.name}</h3>
                <p className={`text-xs uppercase font-bold tracking-wider ${isAsset(d.type) ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {(d.type || 'Unknown').replace(/_/g, ' ')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-mono font-bold text-slate-100">{Number(d.remaining_amount).toLocaleString()} SEK</p>
                <p className="text-sm text-slate-500">of {Number(d.total_amount).toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-[2.5rem] p-8 space-y-4 shadow-2xl">
            <h2 className="text-2xl font-bold mb-4">Add Debt/Loan</h2>
            
            <div className="flex bg-slate-950 p-1 rounded-2xl">
              <button type="button" onClick={() => setForm({...form, type:'owed by me'})} className={`flex-1 py-2 rounded-xl text-xs font-black ${form.type === 'owed by me' ? 'bg-rose-500 text-white' : 'text-slate-500'}`}>OWED BY ME</button>
              <button type="button" onClick={() => setForm({...form, type:'owed to me'})} className={`flex-1 py-2 rounded-xl text-xs font-black ${form.type === 'owed to me' ? 'bg-emerald-500 text-white' : 'text-slate-500'}`}>OWED TO ME</button>
            </div>

            <input required placeholder="Debt Name (e.g. Car Loan)" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl" onChange={e => setForm({...form, name: e.target.value})} />
            
            <div className="grid grid-cols-2 gap-3">
              <input required type="number" placeholder="Total Amount" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl" onChange={e => setForm({...form, total_amount: e.target.value, remaining_amount: e.target.value})} />
              <input required type="number" placeholder="Interest Rate %" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl" onChange={e => setForm({...form, interest_rate: e.target.value})} />
            </div>
            
            <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 py-4 rounded-2xl font-bold shadow-lg">Save Debt</button>
            <button type="button" onClick={() => setIsModalOpen(false)} className="w-full text-slate-500 text-sm py-2">Discard</button>
          </form>
        </div>
      )}

      {/* View/Edit Modal */}
      {viewedDebt && (
        <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-[2.5rem] p-8 space-y-6 shadow-2xl relative">
            <button onClick={() => setViewedDebt(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white">
              <X size={24} />
            </button>
            
            <div>
              <h2 className="text-2xl font-bold text-white">{viewedDebt.name}</h2>
              <p className={`text-sm uppercase font-bold tracking-wider ${isAsset(viewedDebt.type) ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isAsset(viewedDebt.type) ? 'P.O.M (Receivable)' : 'I.O.U (Liability)'}
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <p className="text-xs text-slate-500 font-bold tracking-widest mb-1">TOTAL ORIGINAL AMOUNT</p>
              <p className="font-mono text-slate-200">{Number(viewedDebt.total_amount).toLocaleString()} SEK</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-500 font-bold tracking-widest">UPDATE REMAINING AMOUNT (SEK)</label>
              <input 
                type="number" 
                value={updateValue} 
                onChange={e => setUpdateValue(e.target.value)} 
                className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl font-mono text-xl text-white outline-none" 
              />
            </div>

            <div className="flex gap-2">
              <button onClick={handleUpdate} className="flex-1 bg-cyan-600 hover:bg-cyan-500 py-3 rounded-xl font-bold">Update Remaining</button>
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