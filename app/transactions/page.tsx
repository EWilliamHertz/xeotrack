'use client'
import { useEffect, useState } from 'react'
import { fetchTransactions, createTransaction } from './actions'
import { fetchDebts } from '../debts/actions'
import { Plus, ChevronLeft, ChevronRight, Calendar, User, Filter, X } from 'lucide-react'

export default function Transactions() {
  const [txns, setTxns] = useState([])
  const [debts, setDebts] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  
  const [filters, setFilters] = useState({
    type: '', name: '', party: '', minAmount: '', maxAmount: ''
  })
  
  const [form, setForm] = useState({
    type: 'expense', amount: '', category: 'General', description: '',
    date: new Date().toISOString().split('T')[0], party: '', linkDebtId: ''
  })

  const loadTxns = () => {
    const token = localStorage.getItem('token') || ''
    fetchTransactions(token, page, filters).then(res => {
      if (res.success) { setTxns(res.data); setTotalPages(res.totalPages); }
    })
    fetchDebts(token).then(res => {
      if (res.success) { setDebts(res.data); }
    })
  }

  useEffect(() => { loadTxns() }, [page, isModalOpen])

  const isAsset = (typeString: string) => {
    const t = (typeString || '').toLowerCase().trim()
    return (t.includes('owed') && t.includes('to me')) || t === 'owed_to_me' || t === 'receivable' || t === 'receivables' || t === 'asset'
  }

  const applyFilters = () => {
    setPage(1)
    loadTxns()
  }

  const clearFilters = () => {
    setFilters({ type: '', name: '', party: '', minAmount: '', maxAmount: '' })
    setPage(1)
    setTimeout(loadTxns, 0)
  }

  const handleSave = async (e: any) => {
    e.preventDefault()
    const res = await createTransaction(localStorage.getItem('token') || '', form)
    if (res.success) setIsModalOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-100">Ledger</h1>
        <div className="flex gap-2">
          <button onClick={() => setIsFilterOpen(!isFilterOpen)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-3 rounded-2xl shadow-lg border border-slate-700">
            <Filter size={24} />
          </button>
          <button onClick={() => setIsModalOpen(true)} className="bg-cyan-600 hover:bg-cyan-500 p-3 rounded-2xl shadow-lg">
            <Plus size={24} />
          </button>
        </div>
      </div>

      {isFilterOpen && (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl space-y-4 shadow-xl">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-slate-300">Advanced Filters</h3>
            <button onClick={() => setIsFilterOpen(false)} className="text-slate-500 hover:text-slate-300"><X size={20}/></button>
          </div>
          
          <div className="flex bg-slate-950 p-1 rounded-2xl">
            {['', 'income', 'expense'].map((t) => (
              <button key={t} onClick={() => setFilters({...filters, type: t})} className={`flex-1 py-2 rounded-xl text-xs font-black uppercase transition-colors ${filters.type === t ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                {t === '' ? 'All' : t}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Search Description..." value={filters.name} onChange={e => setFilters({...filters, name: e.target.value})} className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-sm outline-none" />
            <input placeholder="Search Party..." value={filters.party} onChange={e => setFilters({...filters, party: e.target.value})} className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-sm outline-none" />
            <input type="number" placeholder="Min Amount (SEK)" value={filters.minAmount} onChange={e => setFilters({...filters, minAmount: e.target.value})} className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-sm outline-none" />
            <input type="number" placeholder="Max Amount (SEK)" value={filters.maxAmount} onChange={e => setFilters({...filters, maxAmount: e.target.value})} className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-sm outline-none" />
          </div>

          <div className="flex gap-2">
            <button onClick={applyFilters} className="flex-1 bg-cyan-600 hover:bg-cyan-500 py-3 rounded-xl text-sm font-bold">Apply Filters</button>
            <button onClick={clearFilters} className="flex-1 bg-slate-800 hover:bg-slate-700 py-3 rounded-xl text-sm font-bold text-rose-400">Clear</button>
          </div>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden divide-y divide-slate-800">
        {txns.map((t: any) => (
          <div key={t.id} className="p-4 flex justify-between items-center">
            <div>
              <p className="font-bold text-slate-200">{t.description || t.category}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">{t.date} • {t.party || 'No Party'}</p>
            </div>
            <p className={`font-mono font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {t.type === 'income' ? '+' : '-'}{Number(t.amount).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <div className="flex justify-center items-center gap-6 text-slate-500">
        <button disabled={page === 1} onClick={() => setPage(page-1)} className="disabled:opacity-20"><ChevronLeft/></button>
        <span className="text-sm font-bold">Page {page} of {totalPages}</span>
        <button disabled={page === totalPages} onClick={() => setPage(page+1)} className="disabled:opacity-20"><ChevronRight/></button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-[2.5rem] p-8 space-y-4 shadow-2xl">
            <h2 className="text-2xl font-bold mb-4">New Transaction</h2>
            <div className="flex bg-slate-950 p-1 rounded-2xl">
              <button type="button" onClick={() => setForm({...form, type:'expense'})} className={`flex-1 py-2 rounded-xl text-xs font-black ${form.type === 'expense' ? 'bg-rose-500 text-white' : 'text-slate-500'}`}>EXPENSE</button>
              <button type="button" onClick={() => setForm({...form, type:'income'})} className={`flex-1 py-2 rounded-xl text-xs font-black ${form.type === 'income' ? 'bg-emerald-500 text-white' : 'text-slate-500'}`}>INCOME</button>
            </div>
            <input required type="number" placeholder="0.00 SEK" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-2xl font-mono" onChange={e => setForm({...form, amount: e.target.value})} />
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <Calendar size={18} className="text-slate-500"/>
                <input type="date" className="bg-transparent outline-none w-full" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
              </div>
              <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <User size={18} className="text-slate-500"/>
                <input placeholder="Party (Who?)" className="bg-transparent outline-none w-full" onChange={e => setForm({...form, party: e.target.value})} />
              </div>
            </div>
            <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 py-4 rounded-2xl font-bold shadow-lg">Add to Ledger</button>
            <button type="button" onClick={() => setIsModalOpen(false)} className="w-full text-slate-500 text-sm py-2">Discard</button>
          </form>
        </div>
      )}
    </div>
  )
}