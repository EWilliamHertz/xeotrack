'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, LineChart, WalletCards, ArrowLeftRight, PiggyBank } from 'lucide-react'

export default function Navbar() {
  const pathname = usePathname()

  // We have completely removed the `if (pathname === '/') return null` check.
  // The Navbar will now render unconditionally and cannot delete itself.

  return (
    <div className="fixed bottom-6 left-0 right-0 flex justify-center px-4 z-[9999] pointer-events-none">
      <nav className="bg-slate-900 border border-slate-700 shadow-[0_10px_50px_rgba(0,0,0,0.9)] rounded-2xl h-16 flex items-center justify-evenly w-full max-w-md pointer-events-auto">
        <Link href="/dashboard" className={`p-3 transition-colors ${pathname?.includes('/dashboard') ? 'text-cyan-400' : 'text-slate-400 hover:text-white'}`}>
          <Home size={24} />
        </Link>
        <Link href="/transactions" className={`p-3 transition-colors ${pathname?.includes('/transactions') ? 'text-cyan-400' : 'text-slate-400 hover:text-white'}`}>
          <ArrowLeftRight size={24} />
        </Link>
        <Link href="/investments" className={`p-3 transition-colors ${pathname?.includes('/investments') ? 'text-cyan-400' : 'text-slate-400 hover:text-white'}`}>
          <LineChart size={24} />
        </Link>
        <Link href="/debts" className={`p-3 transition-colors ${pathname?.includes('/debts') ? 'text-cyan-400' : 'text-slate-400 hover:text-white'}`}>
          <WalletCards size={24} />
        </Link>
        <Link href="/savings" className={`p-3 transition-colors ${pathname?.includes('/savings') ? 'text-emerald-400' : 'text-slate-400 hover:text-white'}`}>
          <PiggyBank size={24} />
        </Link>
      </nav>
    </div>
  )
}