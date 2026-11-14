import { useState } from 'react'
import { AlertTriangle, CheckCircle2, LoaderCircle, ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'
import { checkSafeNextStep } from '../../lib/api'

const ACTIONS = [
  ['CLICK_LINK', 'Should I click this link?'], ['CALL_NUMBER', 'Should I call this number?'], ['PAY_MONEY', 'Should I pay?'], ['INSTALL_APP', 'Should I install this app?'], ['SHARE_OTP', 'Should I share OTP?'], ['SCAN_OR_PAY_QR', 'Should I scan/pay through this QR?'], ['OPEN_ATTACHMENT', 'Should I open this attachment?'],
]
const STYLE = { STOP_NOW: 'border-red-200 bg-red-50', VERIFY_FIRST: 'border-amber-200 bg-amber-50', LOWER_RISK_STILL_VERIFY: 'border-blue-200 bg-blue-50' }

export function SafeNextStep({ result }) {
  const [answer, setAnswer] = useState(null); const [loading, setLoading] = useState(false)
  async function ask(action) { setLoading(true); try { setAnswer(await checkSafeNextStep({ action, verdict: result.verdict, scam_category: result.scam_category, exposure_state: 'RECEIVED_ONLY' })) } catch (error) { toast.error(error.message) } finally { setLoading(false) } }
  return <section className="card rounded-2xl p-5 sm:p-6"><div className="flex gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-white"><ShieldAlert size={20} /></span><div><h2 className="text-xl font-bold text-slate-950">Safe to do next?</h2><p className="mt-1 text-sm text-slate-600">Get a direct, reviewed answer before you act. No AI guesses and no secrets requested.</p></div></div><div className="mt-4 flex flex-wrap gap-2">{ACTIONS.map(([action, label]) => <button disabled={loading} key={action} type="button" onClick={() => ask(action)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50 disabled:opacity-50">{label}</button>)}</div>{loading && <p className="mt-4 flex items-center gap-2 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={16} /> Checking the safe action…</p>}{answer && <div className={`mt-5 rounded-xl border p-4 ${STYLE[answer.decision]}`}><div className="flex items-center gap-2 font-bold text-slate-950">{answer.decision === 'STOP_NOW' ? <AlertTriangle className="text-red-600" size={19} /> : <CheckCircle2 className="text-blue-700" size={19} />}{answer.title}</div><p className="mt-2 text-sm leading-6 text-slate-700">{answer.simple_explanation}</p><p className="hindi mt-2 text-sm text-slate-700">{answer.hindi_explanation}</p><ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-slate-700">{answer.steps.map((step) => <li key={step}>{step}</li>)}</ol></div>}</section>
}
