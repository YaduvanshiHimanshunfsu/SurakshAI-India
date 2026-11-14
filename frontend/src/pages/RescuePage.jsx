import { Link } from 'react-router-dom'
import { AlertTriangle, Landmark } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { RescueMode } from '../features/rescue/RescueMode'
import { VoiceGuidance } from '../features/accessibility/VoiceGuidance'
import { useAnalysisSession } from '../app/AnalysisSessionContext'
import { EmptyAnalysisState } from '../features/navigation/EmptyAnalysisState'

export function RescuePage() {
  const { analysis, rescuePlan, setRescuePlan, setExposureState } = useAnalysisSession()
  if (!analysis) return <EmptyAnalysisState type="rescue" />
  const level = rescuePlan?.urgency || 'PREVENTIVE'
  const style = level === 'CRITICAL' ? 'bg-red-600' : level === 'HIGH' ? 'bg-amber-500' : 'bg-blue-600'
  const fill = level === 'CRITICAL' ? '100%' : level === 'HIGH' ? '66%' : '33%'
  const reducedMotion = useReducedMotion()
  return <section className="mx-auto max-w-5xl px-4 py-10 lg:px-6"><div className="card rounded-2xl p-6">
    <div className="flex items-start gap-3"><span className={`grid h-11 w-11 place-items-center rounded-xl text-white ${style}`}><AlertTriangle size={22} /></span><div><p className="text-sm font-bold uppercase tracking-wider text-blue-700">Rescue Mode</p><h1 className="mt-1 text-3xl font-bold text-slate-950">Take the right next step</h1><p className="mt-2 text-slate-600">Select what happened. Guidance is deterministic and never asks for a password, PIN, OTP, card number, or bank account detail.</p></div></div>
    <div className="mt-6"><div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-500"><span>Preventive</span><span>Act promptly</span><span>Critical</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><motion.div className={`h-full rounded-full ${style}`} initial={reducedMotion ? { width: fill } : { width: 0 }} animate={{ width: fill }} transition={{ duration: reducedMotion ? 0 : 0.55, ease: 'easeOut' }} /></div><p className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-500">Current urgency: {level.replace('_', ' ')}</p></div>
    <div className="mt-6"><RescueMode result={analysis} onPlanReady={setRescuePlan} onExposureChange={setExposureState} /></div><div className="mt-6"><VoiceGuidance result={analysis} rescuePlan={rescuePlan} /></div><div className="mt-6 flex flex-wrap gap-3"><a href="tel:1930" className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-3 font-semibold text-white"><Landmark size={17} /> Call 1930 for financial fraud</a><Link to="/evidence" className="rounded-lg border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700">Preserve evidence</Link></div>
  </div></section>
}
