import { Link, Navigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { AlertTriangle, ChevronRight, Languages, ShieldAlert, ShieldCheck } from 'lucide-react'
import { AnalysisActions, AnalysisEmailEvidence, AnalysisTactics, AnalysisUrlChecks, AnalysisVerdictCard, AnalysisWhyFlagged } from '../analysisView'
import { VoiceGuidance } from '../features/accessibility/VoiceGuidance'
import { SafeNextStep } from '../features/decision/SafeNextStep'
import { ExplainSimply } from '../features/explain/ExplainSimply'
import { OrganisationVerifier } from '../features/help/OrganisationVerifier'
import { useAnalysisSession } from '../app/AnalysisSessionContext'

const tones = { SCAM: { icon: ShieldAlert, panel: 'bg-red-50' }, SUSPICIOUS: { icon: AlertTriangle, panel: 'bg-amber-50' }, SAFE: { icon: ShieldCheck, panel: 'bg-emerald-50' } }
export function ResultPage() {
  const { analysis, sourceText, rescuePlan } = useAnalysisSession(); const reducedMotion = useReducedMotion()
  if (!analysis) return <Navigate to="/check" replace />
  const tone = tones[analysis.verdict] || tones.SUSPICIOUS; const ToneIcon = tone.icon; const emailResult = analysis.kind !== 'url' && Boolean(analysis.authentication)
  const cards = [<AnalysisWhyFlagged result={analysis} resultText={sourceText} />, <AnalysisTactics result={analysis} />, <AnalysisUrlChecks result={analysis} />, <AnalysisActions result={analysis} />, <SafeNextStep result={analysis} />, <ExplainSimply result={analysis} />, <OrganisationVerifier text={sourceText} />]
  return <section className="mx-auto max-w-7xl px-4 py-10 lg:px-6"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-bold uppercase tracking-wider text-blue-700">Your result</p><h1 className="mt-1 text-3xl font-bold text-slate-950">Understand the risk, then choose a safe action</h1></div><Link to="/rescue" className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">Go to Rescue Mode <ChevronRight size={17} /></Link></div><div className="grid gap-6 lg:grid-cols-[410px_1fr]"><aside className="space-y-5"><AnalysisVerdictCard result={analysis} tone={tone} ToneIcon={ToneIcon} /><div className={`relative overflow-hidden rounded-2xl border border-amber-200 p-5 ${tone.panel}`}><div className="flex items-center gap-2 text-slate-950"><Languages size={19} className="text-orange-600" /><h2 className="font-semibold">सरल हिंदी में समझें</h2></div><p className="hindi mt-3 text-[15px] text-slate-700">{analysis.hindi_summary}</p></div><VoiceGuidance result={analysis} rescuePlan={rescuePlan} />{emailResult && <AnalysisEmailEvidence result={analysis} />}</aside><div className="space-y-6">{cards.map((card, index) => <motion.div key={index} initial={reducedMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reducedMotion ? 0 : index * 0.035 }}>{card}</motion.div>)}</div></div></section>
}
