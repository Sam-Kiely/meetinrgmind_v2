'use client'

import { useState } from 'react'
import UploadSection from '@/components/UploadSection'
import ResultsDisplay from '@/components/ResultsDisplay'
import { MeetingAnalysis } from '@/types'
import { useAuth } from '@/lib/auth'

export default function HomePage() {
  const [analysis, setAnalysis] = useState<MeetingAnalysis | null>(null)
  const { user } = useAuth()

  const handleAnalysisComplete = async (analysisResult: MeetingAnalysis, transcript: string) => {
    setAnalysis(analysisResult)

    // Auto-save the meeting to database for dashboard
    if (user) {
      try {
        await fetch('/api/meetings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transcript,
            analysis: analysisResult,
            userId: user.id,
          }),
        })
      } catch (error) {
        console.error('Error saving meeting:', error)
        // Don't show error to user - saving is silent
      }
    }
  }

  const generateMeetingTitle = (analysis: MeetingAnalysis): string => {
    const participants = analysis.participants || []
    const summary = analysis.summary || ''

    // Try to find company/client names from participants
    const clientCompany = participants.find(p => p.company && p.role?.toLowerCase().includes('client'))?.company

    if (clientCompany) {
      return `Meeting with ${clientCompany}`
    }

    // Use first few words of summary
    const summaryWords = summary.split(' ').slice(0, 4).join(' ')
    if (summaryWords) {
      return `${summaryWords}...`
    }

    // Fallback
    return `Meeting - ${new Date().toLocaleDateString()}`
  }

  const resetAnalysis = () => {
    setAnalysis(null)
  }

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      {!analysis ? (
        <>
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Stop taking notes.
              <br />
              <span className="bg-gradient-to-r from-black to-gray-600 bg-clip-text text-transparent">
                Start getting things done.
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              MeetingMind is an AI-powered assistant that extracts action items from meeting transcripts
              and generates follow-up emails in 30 seconds. Action-first, not transcript-first.
            </p>
            <div className="flex justify-center mb-12">
              <a href="/how-it-works" className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold">
                See How It Works
              </a>
            </div>
          </div>

          <UploadSection onAnalysisComplete={handleAnalysisComplete} />

          <div className="max-w-4xl mx-auto mt-16 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-12">How MeetingMind Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <span className="text-white font-bold text-xl">1</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Upload or Paste</h3>
                <p className="text-gray-600">
                  No bot needed, process meetings anytime. Just paste your transcript or upload audio.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <span className="text-white font-bold text-xl">2</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">AI Extracts Actions</h3>
                <p className="text-gray-600">
                  Our AI identifies who does what by when, plus key decisions and important dates.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <span className="text-white font-bold text-xl">3</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Get Follow-up Emails</h3>
                <p className="text-gray-600">
                  Auto-generated emails for clients and internal team, ready to send.
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-8">
          <div className="text-center">
            <button
              onClick={resetAnalysis}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← Analyze Another Meeting
            </button>
          </div>
          <ResultsDisplay analysis={analysis} />
        </div>
      )}
    </div>
  )
}