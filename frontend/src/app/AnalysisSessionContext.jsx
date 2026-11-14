import { createContext, useContext, useMemo, useState } from 'react'
import { createCaseId } from '../lib/report'

const AnalysisSessionContext = createContext(null)

// Sensitive source material is intentionally memory-only: it is never placed
// in a URL, query string, localStorage, or sessionStorage.
export function AnalysisSessionProvider({ children }) {
  const [analysis, setAnalysis] = useState(null)
  const [sourceText, setSourceText] = useState('')
  const [sourceKind, setSourceKind] = useState('MESSAGE')
  const [caseId, setCaseId] = useState('')
  const [rescuePlan, setRescuePlan] = useState(null)
  const value = useMemo(() => ({
    analysis, sourceText, sourceKind, caseId, rescuePlan,
    saveAnalysis: (nextAnalysis, nextText, nextKind) => {
      setAnalysis(nextAnalysis); setSourceText(nextText); setSourceKind(nextKind); setCaseId(createCaseId()); setRescuePlan(null)
    },
    setRescuePlan,
    clearAnalysis: () => { setAnalysis(null); setSourceText(''); setCaseId(''); setRescuePlan(null) },
  }), [analysis, sourceText, sourceKind, caseId, rescuePlan])
  return <AnalysisSessionContext.Provider value={value}>{children}</AnalysisSessionContext.Provider>
}

export function useAnalysisSession() {
  const context = useContext(AnalysisSessionContext)
  if (!context) throw new Error('useAnalysisSession must be used inside AnalysisSessionProvider')
  return context
}
