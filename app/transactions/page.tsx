'use client'

import { useEffect, useState } from 'react'
import { fetchTransactions, createTransaction, getDebtsList } from './actions'
import { Plus, Filter, ChevronLeft, ChevronRight, Link as LinkIcon } from 'lucide-react'

export default function TransactionsPage() {
  const [txns, setTxns] = useState<any[]>([])
  const [debts, setDebts] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState({ type: '', category: '' })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: 'General',
    description: '',
    date: new Date().toISOString().split('T')[0],
    party: '',
    linkDebtId: ''
  })

  useEffect(() => {
    loadData()
  }, [page, filters])

  async function loadData() {
    const token = localStorage.getItem('token') || ''
    const [tRes, dRes] = await Promise.all([
      fetchTransactions(token, filters, page),
      getDebtsList(token)
    ])
    if (tRes.success) {
      setTxns(tRes.data)
      setTotalPages(tRes.totalPages)
    }
    if (dRes.success) setDebts(dRes.data)
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const token = localStorage.getItem('token') || ''
    const res = await createTransaction(token, formData)
    if (res.success) {
      setIsModalOpen(false)
      loadData()
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-100">Transactions</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-cyan-900/20"
        >
          <Plus size={20} /> <span className="hidden sm:inline">Add New</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        <select 
          className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 ring-cyan-500 outline-none"
          onChange={(e) => setFilters({...filters, type: e.target.value})}
        >
          <option value="">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        {/* Add categories based on your actual data */}
      </div>

      {/* Transaction List */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 italic">Loading records...</div>
        ) : (
          <div className="divide-y divide-slate-800">
            {txns.map((t) => (
              <div key={t.id} className="p-4 flex justify-between items-center hover:bg-slate-800/30 transition-colors">
                <div>
                  <p className="text-slate-200 font-medium">{t.description || t.category}</p>
                  <p className="text-slate-500 text-xs">{t.date} • {t.party}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {t.type === 'income' ? '+' : '-'}{Number(t.amount).toLocaleString()} {t.currency}
                  </p>
                  <p className="text-[10px] text-slate-600 uppercase font-bold tracking-widest">{t.category}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-4 text-slate-400">
        <button disabled={page === 1} onClick={() => setPage(page - 1)} className="p-2 hover:text-white disabled:opacity-30"><ChevronLeft/></button>
        <span className="text-sm font-mono">Page {page} of {totalPages}</span>
        <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="p-2 hover:text-white disabled:opacity-30"><ChevronRight/></button>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <h2 className="text-xl font-bold text-slate-100">New Entry</h2>
              
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl">
                <button type="button" onClick={() => setFormData({...formData, type: 'expense'})} className={`py-2 rounded-lg text-sm font-bold ${formData.type === 'expense' ? 'bg-rose-500/20 text-rose-400' : 'text-slate-500'}`}>EXPENSE</button>
                <button type="button" onClick={() => setFormData({...formData, type: 'income'})} className={`py-2 rounded-lg text-sm font-bold ${formData.type === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500'}`}>INCOME</button>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Amount</label>
                <input required type="number" placeholder="0.00" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-lg focus:ring-1 ring-cyan-500 outline-none" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})}/>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 flex items-center gap-1"><LinkIcon size={10}/> Link to Debt (Optional)</label>
                <select className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-1 ring-cyan-500 outline-none" value={formData.linkDebtId} onChange={(e) => setFormData({...formData, linkDebtId: e.target.value})}>
                  <option value="">Not linked to debt</option>
                  {debts.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({Number(d.remaining_amount).toLocaleString()} {d.type === 'owed_to_me' ? 'Owed to you' : 'You owe'})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="py-3 text-slate-400 font-bold text-sm">Cancel</button>
                <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-cyan-900/40">Save Transaction</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}