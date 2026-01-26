import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import { AuthProvider } from '@/lib/auth'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MeetingMind - Stop taking notes. Start getting things done.',
  description: 'AI-powered meeting assistant that extracts action items from meeting transcripts and generates follow-up emails in 30 seconds.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <Header />
          <main className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  )
}