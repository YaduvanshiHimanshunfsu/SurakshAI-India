import { Link, useLocation } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Check, FileLock2, Flag, ScanSearch, ShieldAlert } from 'lucide-react'

import { useAnalysisSession } from '../../app/AnalysisSessionContext'

const steps = [
  { id: 'check', label: 'Check', path: '/check', icon: ScanSearch, always: true },
  { id: 'result', label: 'Result', path: '/result', icon: Check },
  { id: 'rescue', label: 'Rescue', path: '/rescue', icon: ShieldAlert },
  { id: 'evidence', label: 'Evidence', path: '/evidence', icon: FileLock2 },
  { id: 'report', label: 'Report', path: '/help', icon: Flag, always: true },
]

export function SafetyWorkflow() {
  const { pathname } = useLocation()
  const { analysis } = useAnalysisSession()
  const reducedMotion = useReducedMotion()
  const active = pathname === '/help' ? 'report' : steps.find((step) => pathname.startsWith(step.path))?.id
  const activeIndex = Math.max(0, steps.findIndex((step) => step.id === active))
  return <div className="border-b border-slate-200 bg-white/95"><div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 lg:px-6"><span className="hidden shrink-0 text-xs font-bold uppercase tracking-wider text-slate-400 sm:inline">Safety path</span><nav aria-label="Safety workflow" className="flex min-w-0 flex-1 items-center overflow-x-auto"><div className="flex min-w-max items-center">{steps.map((step, index) => {
    const Icon = step.icon; const available = step.always || Boolean(analysis); const current = active === step.id; const done = index < activeIndex && Boolean(analysis)
    const item = <span className={`relative inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition sm:px-3 sm:text-sm ${current ? 'bg-blue-100 text-blue-800' : available ? 'text-slate-600 hover:bg-slate-50 hover:text-blue-700' : 'cursor-not-allowed text-slate-400'}`}><span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] ${current ? 'bg-blue-600 text-white' : done ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{done ? <Check size={12} /> : <Icon size={12} />}</span>{step.label}{current && <motion.span layoutId="workflow-active" transition={{ duration: reducedMotion ? 0 : 0.18 }} className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-blue-600" />}</span>
    return <div key={step.id} className="flex shrink-0 items-center">{available ? <Link to={step.path} aria-current={current ? 'step' : undefined}>{item}</Link> : <span title="Complete a safety check first" aria-disabled="true">{item}</span>}{index < steps.length - 1 && <span aria-hidden="true" className="mx-0.5 text-slate-300 sm:mx-1">→</span>}</div>
  })}</div></nav><span className="hidden rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 lg:inline">Private by design</span></div></div>
}
