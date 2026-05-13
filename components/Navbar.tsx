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
  { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { name: 'History', href: '/transactions', icon: ArrowLeftRight },
  { name: 'Invest', href: '/investments', icon: TrendingUp },
  { name: 'Debts', href: '/debts', icon: Wallet },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  // Only hide on the landing/login page
  if (pathname === '/') return null

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/')
  }

  return (
    <>
      {/* Settings/Logout Drawer (Slides UP) */}
      {isOpen && (
        <div className="fixed bottom-24 left-4 right-4 z-[100] animate-in slide-in-from-bottom-10 duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-3 shadow-2xl">
            <Link
              href="/settings"
              className="flex items-center gap-4 px-4 py-4 rounded-2xl text-slate-300 hover:bg-slate-800 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Settings size={20} />
              <span className="font-bold">Settings</span>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut size={20} />
              <span className="font-bold">Logout</span>
            </button>
          </div>
        </div>
      )}

     {/* Main Bottom Navbar - High Z-Index for Visibility */}
      <nav 
        className="bg-slate-900 border-t border-slate-800 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.4)]"
        style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', zIndex: 100 }}
      >
        <div className="max-w-xl mx-auto px-2 h-20 flex items-center justify-around">
          
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 min-w-[64px] h-full transition-all duration-200 ${
                  isActive ? 'text-cyan-400' : 'text-slate-500'
                }`}
              >
                <div className={`p-2 rounded-2xl transition-colors ${isActive ? 'bg-cyan-500/10' : ''}`}>
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                  {item.name}
                </span>
              </Link>
            )
          })}

          {/* Hamburger / Menu Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`flex flex-col items-center justify-center gap-1 min-w-[64px] h-full transition-all ${
              isOpen ? 'text-white' : 'text-slate-500'
            }`}
          >
            <div className={`p-2 rounded-2xl ${isOpen ? 'bg-slate-800' : ''}`}>
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
              More
            </span>
          </button>

        </div>
      </nav>
    </>
  )
}