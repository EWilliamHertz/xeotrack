'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  TrendingUp, 
  Wallet, 
  Menu, 
  X, 
  LogOut,
  Settings
} from 'lucide-react'

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
  { name: 'Investments', href: '/investments', icon: TrendingUp },
  { name: 'Debts', href: '/debts', icon: Wallet },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  if (pathname === '/') return null

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/')
  }

  return (
    <>
      {/* Mobile Menu Drawer (Slides UP from bottom) */}
      {isOpen && (
        <div className="fixed bottom-20 left-4 right-4 z-50 md:hidden">
          <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl p-2 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
            <Link
              href="/settings"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-slate-300 hover:bg-slate-800 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Settings size={20} /> Settings
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-rose-400 hover:bg-slate-800 transition-colors"
            >
              <LogOut size={20} /> Logout
            </button>
          </div>
        </div>
      )}

      {/* Main Bottom Navbar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-t border-slate-800 pb-safe">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Logo (Desktop Only) */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center font-bold text-white">
              X
            </div>
          </div>

          {/* Navigation Links (Middle) */}
          <div className="flex flex-1 items-center justify-around max-w-2xl mx-auto">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex flex-col items-center gap-0.5 min-w-[64px] transition-all duration-200 ${
                    isActive ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <div className={`p-1.5 rounded-xl ${isActive ? 'bg-cyan-500/10' : ''}`}>
                    <Icon size={26} />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-tighter">{item.name}</span>
                </Link>
              )
            })}
          </div>

          {/* Hamburger Menu (Right) */}
          <div className="flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`p-2 rounded-xl transition-colors ${isOpen ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-900'}`}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

        </div>
      </nav>
    </>
  )
}