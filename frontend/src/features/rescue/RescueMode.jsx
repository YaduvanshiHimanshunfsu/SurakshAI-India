import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, ExternalLink, Landmark, LoaderCircle, ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'

import { createRescuePlan } from '../../lib/api'

const EXPOSURES = [
  { id: 'RECEIVED_ONLY', label: 'I only received it', detail: 'I did not reply, click, install, or pay.' },
  { id: 'CLICKED_LINK', label: 'I opened a link', detail: 'I visited a website or scanned a QR code.' },
  { id: 'SHARED_PERSONAL_INFO', label: 'I shared personal information', detail: 'I shared non-secret personal details.' },
  { id: 'SHARED_SECRET', label: 'I shared a security code', detail: 'For example, an OTP, password, PIN, or card security detail.' },
  { id: 'INSTALLED_APP_OR_SCREEN_SHARE', label: 'I installed an app or shared my screen', detail: 'Someone may have viewed or controlled my device.' },
  { id: 'SENT_MONEY', label: 'I sent money or approved a payment', detail: 'A UPI, wallet, card, or bank transfer was completed.' },
]

const TONES = {
  PREVENTIVE: { panel: 'border-blue-200 bg-blue-50', badge: 'bg-blue-100 text-blue-800', label: 'Preventive guidance' },
  HIGH: { panel: 'border-amber-200 bg-amber-50', badge: 'bg-amber-100 text-amber-900', label: 'Act promptly' },
  CRITICAL: { panel: 'border-red-200 bg-red-50', badge: 'bg-red-100 text-red-800', label: 'Urgent action needed' },
}

export function RescueMode({ result, onPlanReady }) {
  const [exposure, setExposure] = useState('')
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setExposure('')
    setPlan(null)
    setLoading(false)
    onPlanReady?.(null)
  }, [result])

  async function getPlan() {
    if (!exposure || loading) return
    setLoading(true)
    try {
      const nextPlan = await createRescuePlan({
        exposure_state: exposure,
        verdict: result.verdict,
        scam_category: result.scam_category,
      })
      setPlan(nextPlan)
      onPlanReady?.(nextPlan)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const tone = plan ? TONES[plan.urgency] : null
  return <section className="card rounded-2xl p-5 sm:p-6">
    <div className="flex items-start gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-900 text-white"><ShieldAlert size={21} /></span>
      <div><h2 className="text-xl font-bold text-slate-950">What happened after you received it?</h2><p className="mt-1 text-sm leading-6 text-slate-600">Choose the closest situation. SurakshAI will show reviewed recovery steps; it never asks you to enter an OTP, password, PIN, or bank credential.</p></div>
    </div>
    <fieldset className="mt-5 grid gap-3 sm:grid-cols-2">
      <legend className="sr-only">Your exposure to the suspected scam</legend>
      {EXPOSURES.map((item) => <label key={item.id} className={`cursor-pointer rounded-xl border p-4 transition ${exposure === item.id ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100' : 'border-slate-200 bg-white hover:border-blue-200'}`}>
        <input className="sr-only" type="radio" name="exposure" value={item.id} checked={exposure === item.id} onChange={() => { setExposure(item.id); setPlan(null); onPlanReady?.(null) }} />
        <span className="block text-sm font-bold text-slate-900">{item.label}</span><span className="mt-1 block text-xs leading-5 text-slate-600">{item.detail}</span>
      </label>)}
    </fieldset>
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
      <p className="text-xs leading-5 text-slate-500">For a completed financial transfer, call 1930 immediately and report through the official portal.</p>
      <button type="button" disabled={!exposure || loading} onClick={getPlan} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50">{loading ? <><LoaderCircle size={17} className="animate-spin" /> Preparing steps…</> : 'Show safe next steps'}</button>
    </div>
    {plan && <div className={`mt-6 rounded-2xl border p-5 ${tone.panel}`}>
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-lg font-bold text-slate-950">{plan.title}</h3><p className="mt-1 text-sm text-slate-600">Follow these in order, using only independently known official channels.</p></div><span className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${tone.badge}`}>{tone.label}</span></div>
      <ol className="mt-5 space-y-3">{plan.actions.map((action) => <li key={action.priority} className="flex gap-3 rounded-xl bg-white/80 p-4"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-900 text-sm font-bold text-white">{action.priority}</span><div className="pt-0.5"><p className="text-sm leading-6 text-slate-700">{action.instruction}</p>{action.official_url && <a href={action.official_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-900">Open official reporting portal <ExternalLink size={14} /></a>}</div></li>)}</ol>
      <div className="mt-5 grid gap-4 border-t border-slate-900/10 pt-5 md:grid-cols-2"><div><h4 className="flex items-center gap-2 text-sm font-bold text-slate-900"><CheckCircle2 size={17} className="text-emerald-700" /> Preserve this evidence</h4><ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">{plan.evidence_to_preserve.map((item) => <li key={item}>• {item}</li>)}</ul></div><div><h4 className="flex items-center gap-2 text-sm font-bold text-slate-900"><AlertTriangle size={17} className="text-amber-700" /> Important limits</h4><ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">{plan.limitations.map((item) => <li key={item}>• {item}</li>)}</ul><a href="https://cybercrime.gov.in/" target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-lg border border-blue-600 bg-white px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"><Landmark size={16} /> National Cyber Crime Portal</a></div></div>
    </div>}
  </section>
}
