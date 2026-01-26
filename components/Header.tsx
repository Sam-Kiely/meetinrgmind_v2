'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="bg-black text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold">
              MeetingMind
            </Link>
          </div>

          <nav className="hidden md:flex space-x-8">
            <Link href="/how-it-works" className="text-gray-300 hover:text-white transition-colors">
              How It Works
            </Link>
            <Link href="/pricing" className="text-gray-300 hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="/dashboard" className="text-gray-300 hover:text-white transition-colors">
              Dashboard
            </Link>
          </nav>

          <div className="hidden md:flex space-x-4">
            <Link
              href="/auth/signin"
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="px-6 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
            >
              Sign Up
            </Link>
          </div>

          <button
            className="md:hidden text-gray-300 hover:text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-700">
            <div className="flex flex-col space-y-2">
              <Link href="/how-it-works" className="text-gray-300 hover:text-white py-2">
                How It Works
              </Link>
              <Link href="/pricing" className="text-gray-300 hover:text-white py-2">
                Pricing
              </Link>
              <Link href="/dashboard" className="text-gray-300 hover:text-white py-2">
                Dashboard
              </Link>
              <Link href="/auth/signin" className="text-gray-300 hover:text-white py-2">
                Sign In
              </Link>
              <Link href="/auth/signup" className="text-gray-300 hover:text-white py-2">
                Sign Up
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}