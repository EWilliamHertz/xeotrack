import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'XeoTrack',
  description: 'Personal Finance Tracker',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      {/* h-[100dvh]: Locks body to exact visible screen.
        flex flex-col: Stacks Header, Main, and Navbar.
        overflow-hidden: Stops the outer page from scrolling entirely.
      */}
      <body className={`${inter.className} bg-slate-950 text-slate-100 h-[100dvh] flex flex-col overflow-hidden`}>
        
        {/* Header: flex-none so it never shrinks */}
        <header className="flex-none h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 px-6 flex items-center z-[40]">
          <div className="flex items-center gap-2 max-w-5xl mx-auto w-full">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/20">
              X
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-100">XeoTrack</span>
          </div>
        </header>

        {/* Main Content: flex-1 takes all remaining space. overflow-y-auto makes ONLY this middle section scroll! */}
        <main className="flex-1 overflow-y-auto p-4 w-full scroll-smooth">
          <div className="max-w-5xl mx-auto pb-10">
            {children}
          </div>
        </main>
        
        {/* Global Navbar Component: Automatically pushed to the absolute bottom of the flex container */}
        <Navbar />

      </body>
    </html>
  )
}