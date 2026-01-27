'use client'

import { useState, useCallback, useEffect } from 'react'
import { MeetingAnalysis } from '@/types'
import { RecordingDisclaimer } from './RecordingDisclaimer'
import { useRecordingDisclaimer } from '@/hooks/useRecordingDisclaimer'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { uploadAudioDirectly, transcribeFromUrl } from '@/lib/client-upload'

interface UploadSectionProps {
  onAnalysisComplete: (analysis: MeetingAnalysis, transcript: string) => void
}

type UploadMode = 'text' | 'audio'
type ProcessingStep = 'idle' | 'uploading' | 'transcribing' | 'analyzing'

export default function UploadSection({ onAnalysisComplete }: UploadSectionProps) {
  const [mode, setMode] = useState<UploadMode>('text')
  const [transcript, setTranscript] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [processingStep, setProcessingStep] = useState<ProcessingStep>('idle')
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [user, setUser] = useState<User | null>(null)
  const { hasAcknowledged, showDisclaimer, setShowDisclaimer, acknowledge } = useRecordingDisclaimer()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [])

  const sampleTranscript = `Client Meeting - Website Redesign Project
Date: January 20, 2026

Sarah (Client): Thanks for meeting today. We need to discuss the website redesign timeline.

John (Project Manager): Of course. Based on our initial discussion, I'm thinking we can have wireframes ready by February 5th. Does that work?

Sarah: That's perfect. One thing though - we need to add an e-commerce component. I know that wasn't in the original scope.

John: Okay, that's a significant addition. I'll need to get a quote from the dev team. Can you send me the specific requirements? Like how many products, payment processors you want to integrate?

Sarah: Sure, I'll email that by end of day Wednesday. We're looking at about 50 products initially, and we want Stripe and PayPal.

John: Great. I'll have the updated quote to you by Friday. Also, who on your team should review the wireframes when they're ready?

Sarah: That would be me and Tom from marketing. Loop us both in.

John: Perfect. Let's reconnect next Monday to review everything.

Sarah: Sounds good. I'll send a calendar invite. Thanks John!`

  const isProcessing = processingStep !== 'idle'

  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    const maxSize = 200 * 1024 * 1024 // 200MB (we'll chunk anything over 25MB)
    const allowedTypes = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/webm', 'video/mp4', 'video/webm', 'audio/ogg', 'audio/flac', 'audio/x-m4a', 'audio/m4a']
    const allowedExtensions = ['.mp3', '.mp4', '.wav', '.webm', '.ogg', '.flac', '.m4a']

    if (file.size > maxSize) {
      setError('File size must be less than 200MB')
      return
    }

    // Check by MIME type or by file extension (for M4A files which sometimes have inconsistent MIME types)
    const hasAllowedType = allowedTypes.includes(file.type)
    const hasAllowedExtension = allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext))

    if (!hasAllowedType && !hasAllowedExtension) {
      setError('Please upload a valid audio file (MP3, M4A, MP4, WAV, WEBM, OGG, FLAC)')
      return
    }

    // Check if we need consent for audio files
    if (!hasAcknowledged) {
      setPendingFile(file)
      setShowDisclaimer(true)
      return
    }

    setSelectedFile(file)
    setError('')
  }, [hasAcknowledged, setShowDisclaimer])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFileUpload(e.dataTransfer.files)
  }, [handleFileUpload])

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e.target.files)
  }

  const transcribeAudio = async (file: File): Promise<string> => {
    // For files over 4MB, upload directly to Supabase first
    if (file.size > 4 * 1024 * 1024) {
      if (!user?.id) {
        throw new Error('Please sign in to upload files larger than 4MB')
      }

      // Upload directly to Supabase Storage
      const { url, path } = await uploadAudioDirectly(file)

      // Transcribe from the uploaded URL
      return await transcribeFromUrl(url, path)
    }

    // Small files can still go through FormData
    const formData = new FormData()
    formData.append('audio', file)

    const response = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      let errorMessage = 'Failed to transcribe audio'
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorMessage
      } catch {
        errorMessage = `Failed to transcribe audio (${response.status})`
      }
      throw new Error(errorMessage)
    }

    const data = await response.json()
    return data.transcript
  }

  const analyzeTranscript = async (text: string): Promise<MeetingAnalysis> => {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transcript: text }),
    })

    if (!response.ok) {
      throw new Error('Failed to analyze transcript')
    }

    return await response.json()
  }

  const handleProcess = async () => {
    setError('')

    try {
      let finalTranscript = ''

      if (mode === 'text') {
        if (!transcript.trim()) {
          setError('Please enter a meeting transcript')
          return
        }
        finalTranscript = transcript.trim()
      } else {
        if (!selectedFile) {
          setError('Please select an audio file')
          return
        }

        // Check for consent one more time before processing audio
        if (!hasAcknowledged) {
          setShowDisclaimer(true)
          return
        }

        // Check if user is signed in for large files
        if (selectedFile.size > 4 * 1024 * 1024 && !user?.id) {
          setError('Please sign in to upload files larger than 4MB')
          return
        }

        // Set appropriate processing step
        setProcessingStep(selectedFile.size > 4 * 1024 * 1024 ? 'uploading' : 'transcribing')

        finalTranscript = await transcribeAudio(selectedFile)
        setTranscript(finalTranscript) // Update transcript display
      }

      setProcessingStep('analyzing')
      const analysis = await analyzeTranscript(finalTranscript)
      onAnalysisComplete(analysis, finalTranscript)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
    } finally {
      setProcessingStep('idle')
    }
  }

  const loadSampleTranscript = () => {
    setTranscript(sampleTranscript)
    setMode('text')
  }

  const clearFile = () => {
    setSelectedFile(null)
    setError('')
  }

  const handleDisclaimerAccept = () => {
    acknowledge()
    if (pendingFile) {
      setSelectedFile(pendingFile)
      setPendingFile(null)
    }
  }

  const handleDisclaimerClose = () => {
    setShowDisclaimer(false)
    setPendingFile(null)
  }

  const getProcessingText = () => {
    if (processingStep === 'uploading') return `Uploading... ${uploadProgress}%`
    if (processingStep === 'transcribing') return 'Transcribing audio...'
    if (processingStep === 'analyzing') return 'Analyzing meeting...'
    return mode === 'audio' && selectedFile ? 'Transcribe & Analyze' : 'Extract Action Items'
  }

  return (
    <>
      <RecordingDisclaimer
        isOpen={showDisclaimer}
        onClose={handleDisclaimerClose}
        onAccept={handleDisclaimerAccept}
      />
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Transform Your Meeting Notes
        </h2>
        <p className="text-gray-600 text-lg">
          Upload audio files or paste transcripts to get action items, decisions, and follow-up emails
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setMode('text')}
            className={`px-6 py-2 rounded-md transition-colors ${
              mode === 'text'
                ? 'bg-black text-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📝 Paste Transcript
          </button>
          <button
            onClick={() => setMode('audio')}
            className={`px-6 py-2 rounded-md transition-colors ${
              mode === 'audio'
                ? 'bg-black text-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            🎵 Upload Audio
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {mode === 'text' ? (
          <div>
            <label htmlFor="transcript" className="block text-sm font-medium text-gray-700 mb-2">
              Meeting Transcript
            </label>
            <textarea
              id="transcript"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Paste your meeting transcript here..."
              className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 bg-white"
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Audio File Upload
            </label>

            {!selectedFile ? (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                  dragActive
                    ? 'border-black bg-gray-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="space-y-4">
                  <div className="text-4xl">🎵</div>
                  <div>
                    <p className="text-lg text-gray-600 mb-2">
                      Drag and drop your audio file here
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      or click to select a file
                    </p>
                    <input
                      type="file"
                      accept="audio/*,video/mp4,video/webm,.m4a"
                      onChange={handleFileInputChange}
                      className="hidden"
                      id="audio-upload"
                    />
                    <label
                      htmlFor="audio-upload"
                      className="inline-block px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      Choose File
                    </label>
                  </div>
                  <p className="text-xs text-gray-400">
                    Supports: MP3, M4A, MP4, WAV, WEBM, OGG, FLAC (max 200MB)
                  </p>
                </div>
              </div>
            ) : (
              <div className="border border-gray-300 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">🎵</div>
                    <div>
                      <p className="font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={clearFile}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {transcript && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transcribed Text (Preview)
                </label>
                <textarea
                  value={transcript}
                  readOnly
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800 text-sm resize-none"
                />
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={loadSampleTranscript}
            className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Try Demo with Sample
          </button>

          <button
            onClick={handleProcess}
            disabled={isProcessing}
            className="px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[200px]"
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {getProcessingText()}
              </>
            ) : (
              getProcessingText()
            )}
          </button>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          Now with audio support • Supports all meeting types • Secure and private
        </p>
      </div>
      </div>
    </>
  )
}