'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, LineChart, WalletCards, ArrowLeftRight, PiggyBank } from 'lucide-react'

export default function Navbar() {
  const pathname = usePathname()

  // Safely hide on login pages
  if (pathname === '/' || pathname === '/login') return null

  return (
    // flex-none prevents the navbar from shrinking. Notice there is NO "fixed" and NO "bottom-0" anywhere in here.
    <div className="flex-none w-full bg-slate-950 border-t border-slate-800 z-[100] h-20 px-4 flex items-center justify-center pb-safe shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
      <nav className="flex justify-between items-center w-full max-w-md">
        
        <Link href="/dashboard" className={`flex flex-col items-center gap-1 p-2 transition-colors ${pathname?.includes('/dashboard') ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}>
          <Home size={22} />
          <span className="text-[10px] font-bold tracking-wider">Home</span>
        </Link>
        
        <Link href="/transactions" className={`flex flex-col items-center gap-1 p-2 transition-colors ${pathname?.includes('/transactions') ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}>
          <ArrowLeftRight size={22} />
          <span className="text-[10px] font-bold tracking-wider">Ledger</span>
        </Link>
        
        <Link href="/investments" className={`flex flex-col items-center gap-1 p-2 transition-colors ${pathname?.includes('/investments') ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}>
          <LineChart size={22} />
          <span className="text-[10px] font-bold tracking-wider">Assets</span>
        </Link>
        
        <Link href="/debts" className={`flex flex-col items-center gap-1 p-2 transition-colors ${pathname?.includes('/debts') ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}>
          <WalletCards size={22} />
          <span className="text-[10px] font-bold tracking-wider">Debts</span>
        </Link>
        
        <Link href="/savings" className={`flex flex-col items-center gap-1 p-2 transition-colors ${pathname?.includes('/savings') ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}>
          <PiggyBank size={22} />
          <span className="text-[10px] font-bold tracking-wider">Savings</span>
        </Link>

      </nav>
    </div>
  )
}