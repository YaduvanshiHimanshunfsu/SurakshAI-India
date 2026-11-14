import { BadgeAlert, Building2, Globe2, MailCheck, ShieldCheck } from 'lucide-react'

function nodeTone(active, safe = false) { return active ? (safe ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-900') : 'border-slate-200 bg-slate-50 text-slate-500' }

export function RiskSignalMap({ result, sourceText }) {
  const flags = result.red_flags || []
  const urls = result.url_analyses || []
  const authentication = result.authentication
  const claimedOrganisation = /\b(sbi|hdfc|icici|axis|rbi|uidai|aadhaar|income tax|epfo|india post|police|cybercrime)\b/i.test(sourceText || '')
  const emailPassing = authentication && ['spf', 'dkim', 'dmarc'].every((key) => authentication[key] === 'PASS')
  const nodes = [
    { icon: BadgeAlert, label: 'Message signals', detail: flags.length ? `${flags.length} detected red flag${flags.length > 1 ? 's' : ''}` : 'No phrase-level flag extracted', active: flags.length > 0 },
    { icon: Globe2, label: 'Link intelligence', detail: urls.length ? `${urls.length} checked link${urls.length > 1 ? 's' : ''}` : 'No link found in this item', active: urls.length > 0 },
    { icon: MailCheck, label: 'Email evidence', detail: authentication ? (emailPassing ? 'Authentication checks passed' : 'Authentication needs review') : 'No email authentication evidence', active: Boolean(authentication), safe: emailPassing },
    { icon: Building2, label: 'Organisation claim', detail: claimedOrganisation ? 'A known organisation is mentioned' : 'No known organisation claim found', active: claimedOrganisation },
  ]
  return <section className="card rounded-2xl p-5 sm:p-6"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700"><ShieldCheck size={20} /></span><div><h2 className="text-xl font-bold text-slate-950">Risk Signal Map</h2><p className="mt-1 text-sm leading-6 text-slate-600">This map shows only evidence found during this check. It is not a reputation score.</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{nodes.map(({ icon: Icon, label, detail, active, safe }) => <div key={label} className={`flex gap-3 rounded-xl border p-4 ${nodeTone(active, safe)}`}><Icon size={19} className="mt-0.5 shrink-0" /><div><p className="text-sm font-bold">{label}</p><p className="mt-1 text-xs leading-5">{detail}</p></div></div>)}</div>{flags.length > 0 && <div className="mt-4 border-t border-slate-100 pt-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Signals found</p><div className="mt-2 flex flex-wrap gap-2">{flags.slice(0, 4).map((flag, index) => <span key={`${flag.phrase}-${index}`} className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900">{flag.phrase}</span>)}</div></div>}</section>
}
