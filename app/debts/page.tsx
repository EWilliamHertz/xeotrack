'use client'
import { useEffect, useState } from 'react'
import { Plus, Trash2, X, Activity, DollarSign, Settings2 } from 'lucide-react'
import { fetchDebts, createDebt, updateDebtValue, deleteDebt, logDebtPayment, fetchDebtLogs } from './actions'

export default function DebtsPage() {
  const [debts, setDebts] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'in' | 'out'>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const [viewedDebt, setViewedDebt] = useState<any>(null)
  const [updateRemaining, setUpdateRemaining] = useState('')
  const [updateTotal, setUpdateTotal] = useState('')
  
  const [logs, setLogs] = useState<any[]>([])
  const [paymentAmount, setPaymentAmount] = useState('')
  const [isEditingMode, setIsEditingMode] = useState(false)

  const [form, setForm] = useState({
    name: '', type: 'payables', total_amount: '', remaining_amount: '', interest_rate: '0', monthly_payment: '0'
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
      setForm({ name: '', type: 'payables', total_amount: '', remaining_amount: '', interest_rate: '0', monthly_payment: '0' })
      loadDebts()
    }
  }

  const handleEditSubmit = async () => {
    if (!viewedDebt) return
    const res = await updateDebtValue(localStorage.getItem('token') || '', viewedDebt.id, updateRemaining, updateTotal, viewedDebt.type)
    if (res.success) { 
      setIsEditingMode(false)
      setViewedDebt({...viewedDebt, remaining_amount: updateRemaining, total_amount: updateTotal})
      loadDebts() 
    }
  }

  const handlePaymentSubmit = async () => {
    if (!viewedDebt || !paymentAmount) return
    const res = await logDebtPayment(localStorage.getItem('token') || '', viewedDebt.id, viewedDebt.type, Number(paymentAmount))
    if (res.success) {
      setPaymentAmount('')
      const logRes = await fetchDebtLogs(localStorage.getItem('token') || '', viewedDebt.id)
      if (logRes.success) setLogs(logRes.data)
      setViewedDebt({...viewedDebt, remaining_amount: viewedDebt.remaining_amount - Number(paymentAmount)})
      loadDebts()
    }
  }

  const handleDelete = async () => {
    if (!viewedDebt) return
    const res = await deleteDebt(localStorage.getItem('token') || '', viewedDebt.id, viewedDebt.type)
    if (res.success) { setViewedDebt(null); loadDebts(); }
  }

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
            onClick={async () => { 
              setViewedDebt(d); 
              setUpdateRemaining(d.remaining_amount); 
              setUpdateTotal(d.total_amount);
              setIsEditingMode(false);
              const logRes = await fetchDebtLogs(localStorage.getItem('token') || '', d.id);
              if (logRes.success) setLogs(logRes.data);
            }}
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
              <button type="button" onClick={() => setForm({...form, type:'payables'})} className={`flex-1 py-2 rounded-xl text-xs font-black transition-colors ${form.type === 'payables' ? 'bg-rose-500 text-white' : 'text-slate-500 hover:text-slate-300'}`}>I.O.U (PAYABLES)</button>
              <button type="button" onClick={() => setForm({...form, type:'receivables'})} className={`flex-1 py-2 rounded-xl text-xs font-black transition-colors ${form.type === 'receivables' ? 'bg-emerald-500 text-white' : 'text-slate-500 hover:text-slate-300'}`}>P.O.M (RECEIVABLES)</button>
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

      {viewedDebt && (
        <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-[2.5rem] p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-white">{viewedDebt.name}</h2>
                <p className={`text-sm uppercase font-bold tracking-wider ${isAsset(viewedDebt.type) ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isAsset(viewedDebt.type) ? 'P.O.M (Receivable)' : 'I.O.U (Liability)'}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setIsEditingMode(!isEditingMode)} className={`p-2 rounded-xl transition ${isEditingMode ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                  <Settings2 size={20} />
                </button>
                <button onClick={() => setViewedDebt(null)} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition">
                  <X size={20} />
                </button>
              </div>
            </div>

            {!isEditingMode ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <p className="text-xs text-slate-500 font-bold tracking-widest mb-1">REMAINING</p>
                    <p className="font-mono text-xl text-white">{Number(viewedDebt.remaining_amount).toLocaleString()} SEK</p>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 opacity-60">
                    <p className="text-xs text-slate-500 font-bold tracking-widest mb-1">TOTAL ORIGINAL</p>
                    <p className="font-mono text-xl text-slate-300">{Number(viewedDebt.total_amount).toLocaleString()}</p>
                  </div>
                </div>

                <div className="bg-slate-950/50 border border-cyan-500/30 p-4 rounded-xl space-y-3">
                  <p className="text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2"><DollarSign size={16}/> Log a Payment</p>
                  <div className="flex gap-2">
                    <input type="number" placeholder="Amount Paid..." value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} className="flex-1 bg-slate-900 border border-slate-800 p-3 rounded-lg font-mono outline-none" />
                    <button onClick={handlePaymentSubmit} className="bg-cyan-600 hover:bg-cyan-500 px-6 rounded-lg font-bold">Log</button>
                  </div>
                </div>

                {logs.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-slate-800">
                    <p className="text-xs text-slate-500 font-bold tracking-widest flex items-center gap-2"><Activity size={14}/> PAYMENT HISTORY</p>
                    <div className="max-h-32 overflow-y-auto space-y-2 pr-2">
                      {logs.map((log: any) => (
                        <div key={log.id} className="flex justify-between items-center text-sm bg-slate-950 p-3 rounded-lg border border-slate-800/50">
                          <span className="text-emerald-400 font-bold uppercase px-2 py-1 rounded bg-emerald-500/10 text-[10px]">Payment</span>
                          <span className="text-slate-200 font-mono">{Number(log.amount).toLocaleString()} SEK</span>
                          <span className="text-slate-500 text-xs">{new Date(log.date).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <p className="text-sm font-bold text-slate-300 mb-4">Direct Override Editor</p>
                <div className="space-y-2">
                  <label className="text-xs text-slate-500 font-bold tracking-widest">EDIT REMAINING AMOUNT</label>
                  <input type="number" value={updateRemaining} onChange={e => setUpdateRemaining(e.target.value)} className="w-full bg-slate-900 border border-slate-800 p-3 rounded-lg font-mono text-white outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-500 font-bold tracking-widest">EDIT TOTAL ORIGINAL AMOUNT</label>
                  <input type="number" value={updateTotal} onChange={e => setUpdateTotal(e.target.value)} className="w-full bg-slate-900 border border-slate-800 p-3 rounded-lg font-mono text-white outline-none" />
                </div>
                <button onClick={handleEditSubmit} className="w-full bg-cyan-600 hover:bg-cyan-500 py-3 rounded-lg font-bold">Force Save Overrides</button>
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t border-slate-800/50">
              <button onClick={handleDelete} className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 py-3 rounded-xl transition flex justify-center items-center gap-2 text-sm font-bold">
                <Trash2 size={16} /> Delete Entire Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}