import { useState, useEffect } from 'react'

const STORAGE_KEY = 'meetingmind_recording_disclaimer_acknowledged'

export function useRecordingDisclaimer() {
  const [hasAcknowledged, setHasAcknowledged] = useState<boolean>(false)
  const [showDisclaimer, setShowDisclaimer] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    // Check localStorage on mount
    const acknowledged = localStorage.getItem(STORAGE_KEY) === 'true'
    setHasAcknowledged(acknowledged)
    setIsLoading(false)
  }, [])

  const acknowledge = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setHasAcknowledged(true)
    setShowDisclaimer(false)
  }

  const requestUpload = (callback: () => void) => {
    if (hasAcknowledged) {
      callback()
    } else {
      setShowDisclaimer(true)
    }
  }

  return {
    hasAcknowledged,
    showDisclaimer,
    setShowDisclaimer,
    acknowledge,
    requestUpload,
    isLoading
  }
}