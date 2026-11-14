import { motion, useReducedMotion } from 'framer-motion'
import { CheckCircle2, Sparkles } from 'lucide-react'

export const MODE_COPY = {
  message: { short: 'Paste text', detail: 'SMS, WhatsApp, chat, or social post' },
  link: { short: 'Inspect a URL', detail: 'Check structure without opening it' },
  email: { short: 'Check an email', detail: 'Review sender and authentication clues' },
  screenshot: { short: 'Extract text', detail: 'Review visible text before checking it' },
  voice: { short: 'Review audio', detail: 'Correct the transcript before checking it' },
  qr: { short: 'Check QR payload', detail: 'Decode locally before analysing it' },
}

export function InputModePicker({ modes, mode, onChange }) {
  const reducedMotion = useReducedMotion()
  const current = MODE_COPY[mode]
  return <div>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-bold text-slate-950">1. What would you like to check?</p><p className="mt-0.5 text-xs text-slate-500">Choose the format you received. You can switch any time.</p></div><span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-800"><Sparkles size={13} /> {current.short}</span></div>
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" role="tablist" aria-label="Choose what to check">
      {modes.map(([id, label, Icon], index) => {
        const active = mode === id
        return <motion.button type="button" key={id} role="tab" aria-selected={active} onClick={() => onChange(id)} initial={reducedMotion ? false : { opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? 0 : 0.18, delay: reducedMotion ? 0 : index * 0.025 }} whileHover={reducedMotion ? undefined : { y: -2 }} className={`relative rounded-xl border p-3 text-left transition ${active ? 'border-blue-400 bg-blue-50 shadow-sm ring-2 ring-blue-100' : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50'}`}>
          {active && <motion.span layoutId="active-mode" transition={{ duration: reducedMotion ? 0 : 0.18 }} className="absolute right-2 top-2 text-blue-700"><CheckCircle2 size={16} /></motion.span>}
          <span className={`grid h-9 w-9 place-items-center rounded-lg ${active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}><Icon size={17} /></span>
          <span className="mt-2 block pr-5 text-sm font-bold text-slate-900">{label}</span>
          <span className="mt-0.5 block text-xs leading-5 text-slate-500">{MODE_COPY[id].detail}</span>
        </motion.button>
      })}
    </div>
  </div>
}
