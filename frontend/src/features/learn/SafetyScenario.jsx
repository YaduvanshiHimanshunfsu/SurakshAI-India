import { useState } from 'react'
import { CheckCircle2, CircleAlert } from 'lucide-react'

export function SafetyScenario({ title, prompt, choices, answer, explanation }) {
  const [selected, setSelected] = useState(null)
  const resolved = selected !== null
  return <article className="card rounded-2xl p-5"><p className="text-xs font-bold uppercase tracking-wider text-violet-700">Quick decision</p><h2 className="mt-2 text-lg font-bold text-slate-950">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{prompt}</p><div className="mt-4 grid gap-2">{choices.map((choice, index) => <button key={choice} type="button" aria-pressed={selected === index} onClick={() => setSelected(index)} className={`rounded-lg border px-3 py-2.5 text-left text-sm font-semibold transition ${selected === index ? (index === answer ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-red-300 bg-red-50 text-red-900') : 'border-slate-200 bg-white text-slate-700 hover:border-violet-300 hover:bg-violet-50'}`}>{choice}</button>)}</div>{resolved && <p aria-live="polite" className={`mt-4 flex gap-2 rounded-lg p-3 text-sm leading-6 ${selected === answer ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-950'}`}>{selected === answer ? <CheckCircle2 className="mt-0.5 shrink-0" size={18} /> : <CircleAlert className="mt-0.5 shrink-0" size={18} />}{explanation}</p>}</article>
}
