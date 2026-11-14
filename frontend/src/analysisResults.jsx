import {
  AlertTriangle, BadgeAlert, Copy, Globe2, Landmark, Mail, Paperclip, ShieldCheck, Sparkles,
} from 'lucide-react'
import toast from 'react-hot-toast'

import { pretty } from './analysisUtils'

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function HighlightedText({ text, flags }) {
  const phrases = [...new Set((flags || []).map((flag) => flag.phrase).filter((phrase) => phrase && phrase.length < 200))]
  if (!text || !phrases.length) return <>{text || 'No readable message content was provided.'}</>
  const expression = new RegExp(`(${phrases.map(escapeRegExp).join('|')})`, 'gi')
  const flagByPhrase = new Map(phrases.map((phrase) => [phrase.toLowerCase(), true]))
  return text.split(expression).map((segment, index) => (
    flagByPhrase.has(segment.toLowerCase())
      ? <mark key={`${segment}-${index}`} className="rounded bg-red-100 px-1 font-medium text-red-800">{segment}</mark>
      : <span key={`${segment}-${index}`}>{segment}</span>
  ))
}

function ConfidenceRing({ value, color }) {
  return <div className="relative h-16 w-16 shrink-0"><svg className="h-full w-full -rotate-90" viewBox="0 0 36 36" aria-label={`${value}% confidence`}><path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="3" /><path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={color} strokeDasharray={`${Math.min(100, value)}, 100`} strokeLinecap="round" strokeWidth="3" /></svg><span className="absolute inset-0 grid place-items-center text-sm font-bold text-slate-900">{value}%</span></div>
}

function AuthPill({ name, value }) {
  const good = value === 'PASS'
  const bad = ['FAIL', 'SOFTFAIL'].includes(value)
  return <div className={`rounded-lg px-3 py-2 text-sm ${good ? 'bg-emerald-50 text-emerald-800' : bad ? 'bg-red-50 text-red-800' : 'bg-slate-100 text-slate-700'}`}><span className="font-semibold">{name}</span><span className="ml-2 text-xs">{pretty(value)}</span></div>
}

export function VerdictCard({ result, tone, ToneIcon }) {
  return <div className={`relative overflow-hidden rounded-2xl ${tone.panel} p-5`}><div className={`absolute inset-y-0 left-0 w-1 ${tone.edge}`} /><div className="flex items-start gap-3"><span className={`grid h-11 w-11 place-items-center rounded-full ${tone.badge}`}><ToneIcon size={23} /></span><div><h2 className="text-xl font-bold text-slate-950">{tone.label}</h2><p className="mt-1 text-sm text-slate-600">{tone.body}</p></div></div><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-white/80 p-3"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Severity</p><p className={`mt-1 text-sm font-bold ${tone.text}`}>{pretty(result.severity)} risk</p></div><div className="rounded-xl bg-white/80 p-3"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Category</p><p className="mt-1 text-sm font-bold text-slate-800">{pretty(result.scam_category)}</p></div></div><div className="mt-4 flex items-center gap-3 rounded-xl bg-white/80 p-3"><ConfidenceRing value={result.confidence} color={tone.ring} /><div><p className="text-sm font-semibold text-slate-800">Confidence score</p><p className="mt-1 text-xs leading-5 text-slate-500">Based on the available evidence; it is not a guarantee of sender identity.</p></div></div><div className="mt-4 border-t border-slate-900/10 pt-3 text-right text-[11px] font-medium text-slate-500">{result.analysis_source === 'AI' ? 'Analysed with Gemini + safety checks' : result.analysis_source === 'RULE_FALLBACK' ? 'Limited offline safety analysis' : 'URL intelligence analysis'}</div></div>
}

export function WhyFlagged({ result, resultText }) {
  return <section className="card rounded-2xl p-5 sm:p-6"><div className="flex items-center gap-2"><BadgeAlert size={20} className="text-blue-600" /><h2 className="text-lg font-bold text-slate-900">Why this was flagged</h2></div><div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 leading-7 text-slate-700"><HighlightedText text={resultText} flags={result.red_flags} /></div><div className="mt-4 space-y-3">{result.red_flags?.length ? result.red_flags.map((flag, index) => <div key={`${flag.phrase}-${index}`} className="flex gap-3 rounded-xl bg-slate-50 p-3"><AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-600" /><div><p className="font-semibold text-slate-800">{flag.phrase}</p><p className="mt-1 text-sm leading-6 text-slate-600">{flag.explanation}</p></div></div>) : <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">No specific phrase was extracted. Review the verdict and independently verify any sensitive request.</p>}</div></section>
}

export function Tactics({ result }) {
  return <section className="card rounded-2xl p-5 sm:p-6"><div className="flex items-center gap-2"><Sparkles size={20} className="text-blue-600" /><h2 className="text-lg font-bold text-slate-900">Manipulation tactics</h2></div><p className="mt-2 text-sm leading-6 text-slate-600">Scammers often combine emotion and pressure to stop people from checking independently.</p><div className="mt-4 flex flex-wrap gap-2">{result.psychological_tactics?.length ? result.psychological_tactics.map((tactic) => <span key={tactic} className="rounded-full bg-blue-50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-blue-800">{pretty(tactic)}</span>) : <span className="rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-600">No specific social-engineering tactic was identified.</span>}</div></section>
}

export function UrlChecks({ result }) {
  if (!result.url_analyses?.length) return null
  return <section className="card rounded-2xl p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-center gap-2"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700"><Globe2 size={20} /></span><div><h2 className="text-lg font-bold text-slate-900">Link Profile</h2><p className="text-xs text-slate-500">Domain context, connection checks, and threat signals — without opening the page.</p></div></div><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">No page content was fetched</span></div><div className="mt-5 space-y-4">{result.url_analyses.map((url) => <UrlProfileCard key={url.original_url} url={url} />)}</div></section>
}

function UrlProfileCard({ url }) {
  const knownDomain = url.site_profile?.status === 'KNOWN_OFFICIAL_DOMAIN'
  const validTls = url.tls?.status === 'VALID'
  const riskClass = ['CRITICAL', 'HIGH'].includes(url.risk_level) ? 'bg-red-100 text-red-800' : url.risk_level === 'MEDIUM' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
  return <article className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"><div className="p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="break-all text-lg font-bold text-slate-900">{url.host || url.original_url}</p><p className="mt-1 text-sm text-slate-500">Registered domain: <strong className="text-slate-700">{url.registered_domain || 'unavailable'}</strong></p></div><span className={`rounded-full px-3 py-1.5 text-xs font-bold ${riskClass}`}>{url.risk_score}/100 · {pretty(url.risk_level)} risk</span></div><div className="mt-4 grid gap-3 md:grid-cols-2"><div className={`rounded-xl border p-4 ${knownDomain ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'}`}><p className={`text-xs font-bold uppercase tracking-wider ${knownDomain ? 'text-emerald-800' : 'text-slate-600'}`}>{knownDomain ? 'Reviewed domain match' : 'Domain directory result'}</p><p className="mt-2 font-bold text-slate-900">{knownDomain ? url.site_profile?.name : 'Not in the reviewed directory'}</p><p className="mt-1 text-sm leading-6 text-slate-600">{url.site_profile?.description || 'No domain profile was available for this link.'}</p></div><div className={`rounded-xl border p-4 ${validTls ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}><p className={`text-xs font-bold uppercase tracking-wider ${validTls ? 'text-emerald-800' : 'text-amber-800'}`}>Connection signal</p><p className="mt-2 font-bold text-slate-900">{validTls ? 'HTTPS certificate validated' : `TLS: ${pretty(url.tls?.status || 'NOT_CHECKED')}`}</p><p className="mt-1 text-sm leading-6 text-slate-600">{validTls ? 'The certificate matched this hostname during the check.' : 'A missing or unavailable TLS check needs independent verification.'}</p></div></div><p className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm leading-6 text-blue-950"><strong>What SurakshAI can say:</strong> {url.summary}</p>{url.site_profile?.verification_note && <p className="mt-3 text-xs leading-5 text-slate-500">{url.site_profile.verification_note}</p>}{url.reputation?.length > 0 && <p className="mt-3 text-xs text-slate-500">Reputation: {url.reputation.map((item) => `${item.provider}: ${pretty(item.status)}`).join(' · ')}</p>}</div></article>
}

export function EmailEvidence({ result }) {
  const sender = result.sender || {}
  const reply = result.reply_to || {}
  return <section className="card rounded-2xl p-5"><div className="flex items-center gap-2"><Mail size={19} className="text-blue-600" /><h3 className="font-bold text-slate-900">Email evidence</h3></div><dl className="mt-4 space-y-3 text-sm"><div><dt className="font-medium text-slate-500">From</dt><dd className="mt-1 break-all text-slate-800">{sender.display_name || sender.address || 'Not available'} {sender.address && sender.display_name ? <span className="text-slate-500">&lt;{sender.address}&gt;</span> : null}</dd></div>{reply.address && <div><dt className="font-medium text-slate-500">Reply-To</dt><dd className="mt-1 break-all text-slate-800">{reply.address}</dd></div>}<div><dt className="font-medium text-slate-500">Email type</dt><dd className="mt-1 font-semibold text-slate-800">{pretty(result.email_type)}</dd></div></dl><div className="mt-5 grid grid-cols-2 gap-2"><AuthPill name="SPF" value={result.authentication.spf} /><AuthPill name="DKIM" value={result.authentication.dkim} /><AuthPill name="DMARC" value={result.authentication.dmarc} /><AuthPill name="Alignment" value={result.authentication.alignment} /></div><p className="mt-3 text-xs leading-5 text-slate-500">Evidence source: {result.authentication.source}</p>{result.attachments?.length > 0 && <div className="mt-5 border-t border-slate-100 pt-4"><p className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800"><Paperclip size={16} /> Attachments</p>{result.attachments.map((file, index) => <p key={`${file.filename}-${index}`} className="mt-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-600"><strong>{file.filename || 'Unnamed attachment'}</strong> · {pretty(file.risk)} risk<br />{file.reason}</p>)}</div>}</section>
}

export function Actions({ result }) {
  const copy = async () => { try { await navigator.clipboard.writeText(result.action_steps.map((action, index) => `${index + 1}. ${action}`).join('\n')); toast.success('Safety steps copied.') } catch { toast.error('Could not copy the steps.') } }
  return <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5 sm:p-6"><div className="flex items-center gap-2"><ShieldCheck size={22} className="text-blue-700" /><h2 className="text-xl font-bold text-slate-950">What you should do next</h2></div><ol className="mt-5 space-y-3">{result.action_steps.map((action, index) => <li key={action} className="flex gap-3 rounded-xl bg-white p-4 shadow-sm"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-100 text-sm font-bold text-blue-800">{index + 1}</span><p className="pt-0.5 text-sm leading-6 text-slate-700">{action}</p></li>)}</ol><div className="mt-5 flex flex-wrap gap-3"><a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"><Landmark size={17} /> Report to Cybercrime.gov.in</a><button type="button" onClick={copy} className="inline-flex items-center gap-2 rounded-lg border border-blue-600 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50"><Copy size={17} /> Copy steps</button></div>{result.limitations?.length > 0 && <div className="mt-5 border-t border-blue-200 pt-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Limits of this analysis</p><ul className="mt-2 space-y-1 text-xs leading-5 text-slate-600">{result.limitations.map((item) => <li key={item}>• {item}</li>)}</ul></div>}</section>
}
