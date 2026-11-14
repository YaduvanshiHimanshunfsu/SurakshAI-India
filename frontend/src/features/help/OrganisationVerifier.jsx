import { useState } from 'react'
import { Building2, ExternalLink, LoaderCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { verifyOrganisation } from '../../lib/api'

export function OrganisationVerifier({ text }) {
  const [data, setData] = useState(null); const [loading, setLoading] = useState(false)
  async function check() { setLoading(true); try { setData(await verifyOrganisation(text.slice(0, 5000))) } catch (error) { toast.error(error.message) } finally { setLoading(false) } }
  return <section className="card rounded-2xl p-5"><div className="flex items-start justify-between gap-3"><div className="flex gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-700 text-white"><Building2 size={20} /></span><div><h2 className="font-bold text-slate-950">Bank & government claim checker</h2><p className="mt-1 text-sm text-slate-600">Finds claims such as SBI, RBI, UIDAI, courier or police — it never declares a message genuine.</p></div></div><button type="button" disabled={loading || !text?.trim()} onClick={check} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800">{loading ? <LoaderCircle size={16} className="animate-spin" /> : 'Check claim'}</button></div>{data && <div className="mt-4 space-y-3"><p className="text-sm text-slate-600">{data.notice}</p>{data.claims.map((claim) => <div key={claim.claimed_organisation} className="rounded-xl border border-blue-100 bg-blue-50 p-4"><p className="font-bold text-slate-950">Claims to be: {claim.claimed_organisation}</p><p className="mt-2 text-sm text-slate-700">{claim.risk_reason}</p><p className="mt-2 text-sm font-medium text-slate-800">{claim.safe_instruction}</p>{claim.official_domains.map((domain) => <a key={domain} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-blue-700" href={`https://${domain}`} target="_blank" rel="noreferrer">{domain} <ExternalLink size={13} /></a>)}</div>)}</div>}</section>
}
