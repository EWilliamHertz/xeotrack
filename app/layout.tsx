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
      <body className="bg-slate-950 text-slate-100 min-h-screen pb-20">
        <Navbar />
        <main>
          {children}
        </main>
      </body>
    </html>
  )
}