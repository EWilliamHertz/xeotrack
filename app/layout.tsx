import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'XeoTrack - Financial Command Center',
  description: 'Premium financial tracking and management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
<body className="bg-slate-950 text-slate-100 min-h-screen relative">
        {/* Top Branding Logo */}
        <header className="fixed top-0 left-0 right-0 z-[40] bg-slate-950/80 backdrop-blur-md border-b border-slate-900 px-6 py-4">
          <div className="flex items-center gap-2 max-w-5xl mx-auto">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/20">
              X
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-100">XeoTrack</span>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="pt-24 pb-32 px-4 max-w-5xl mx-auto">
          {children}
        </main>
        
        {/* Fixed Bottom Navbar */}
        <Navbar />
      </body>
    </html>
  )
}