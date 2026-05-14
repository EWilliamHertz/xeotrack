import Link from 'next/link'
import { Home, LineChart, WalletCards, ArrowLeftRight, PiggyBank } from 'lucide-react'

export default function Navbar() {
  return (
    <nav 
      className="bg-slate-900/95 backdrop-blur-xl border border-slate-800 pb-safe shadow-[0_-20px_40px_rgba(0,0,0,0.6)] rounded-t-3xl sm:rounded-3xl sm:mb-4 fixed bottom-0 z-[100]"
      style={{ left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '600px' }}
    >
      <div className="w-full px-6 h-20 flex items-center justify-evenly gap-2 sm:gap-4">
        <Link href="/dashboard" className="p-3 text-slate-400 hover:text-cyan-400 transition-colors">
          <Home size={24} />
        </Link>
        <Link href="/transactions" className="p-3 text-slate-400 hover:text-cyan-400 transition-colors">
          <ArrowLeftRight size={24} />
        </Link>
        <Link href="/investments" className="p-3 text-slate-400 hover:text-cyan-400 transition-colors">
          <LineChart size={24} />
        </Link>
        <Link href="/debts" className="p-3 text-slate-400 hover:text-cyan-400 transition-colors">
          <WalletCards size={24} />
        </Link>
        <Link href="/savings" className="p-3 text-slate-400 hover:text-emerald-400 transition-colors">
          <PiggyBank size={24} />
        </Link>
      </div>
    </nav>
  )
}