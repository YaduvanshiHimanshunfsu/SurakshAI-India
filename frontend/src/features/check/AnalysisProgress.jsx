import { Check, SearchCheck, ShieldCheck } from 'lucide-react'

const steps = [
  ['Checking message patterns', SearchCheck],
  ['Reviewing link and sender signals', ShieldCheck],
  ['Preparing safe next steps', Check],
]

export function AnalysisProgress({ stage = 0 }) {
  return <div aria-live="polite" className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4"><p className="text-sm font-bold text-slate-900">Analysing safely</p><ol className="mt-3 grid gap-3 sm:grid-cols-3">{steps.map(([label, Icon], index) => { const done = index < stage; const current = index === stage; return <li key={label} className="flex items-center gap-2 text-xs leading-5 text-slate-700"><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${done ? 'bg-emerald-600 text-white' : current ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-400'}`}>{done ? <Check size={15} /> : <Icon size={15} />}</span>{label}</li> })}</ol></div>
}
