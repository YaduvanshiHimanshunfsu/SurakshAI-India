import { useState } from 'react'
import { Download, FileText, Landmark, LoaderCircle } from 'lucide-react'
import toast from 'react-hot-toast'

import { buildEvidenceReport, downloadEvidencePack } from '../../lib/report'
import { readEvidence } from '../../lib/vault'

export function ReportPack({ caseId, analysis, sourceText, sourceKind, rescuePlan }) {
  const [includeUnredacted, setIncludeUnredacted] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [working, setWorking] = useState(false)

  async function exportPack() {
    if (includeUnredacted && !confirmed) return
    setWorking(true)
    try {
      let savedEvidence = []
      try { savedEvidence = await readEvidence(caseId) } catch { /* Export stays useful when local vault is unavailable. */ }
      const report = buildEvidenceReport({ caseId, analysis, sourceText, sourceKind, rescuePlan, evidence: savedEvidence, includeUnredacted })
      downloadEvidencePack(report)
      toast.success(includeUnredacted ? 'Unredacted PDF exported.' : 'Masked PDF Evidence Pack exported.')
    } catch (error) { toast.error(error.message || 'The Evidence Pack could not be created.') } finally { setWorking(false) }
  }

  return <section className="card rounded-2xl p-5 sm:p-6"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-700 text-white"><FileText size={21} /></span><div><h2 className="text-xl font-bold text-slate-950">Report Pack</h2><p className="mt-1 text-sm leading-6 text-slate-600">Case <strong>{caseId}</strong>. Export a privacy-safe PDF with analysis, indicators, local evidence, rescue actions, and official reporting links.</p></div></div><label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700"><input type="checkbox" checked={includeUnredacted} onChange={(event) => { setIncludeUnredacted(event.target.checked); setConfirmed(false) }} className="mt-1 h-4 w-4" /><span><strong>Include unredacted evidence</strong><br />Default export masks phone numbers, email usernames, UPI IDs, cards, identity numbers, URLs with private query data, and security codes.</span></label>{includeUnredacted && <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-1 h-4 w-4" /><span>I understand this PDF may contain personal or sensitive information. I will share it only with an authorised official channel.</span></label>}<div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5"><a href="https://cybercrime.gov.in/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900"><Landmark size={17} /> Official reporting portal</a><button type="button" disabled={working || (includeUnredacted && !confirmed)} onClick={exportPack} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{working ? <><LoaderCircle size={16} className="animate-spin" /> Creating PDF…</> : <><Download size={16} /> Download PDF Evidence Pack</>}</button></div></section>
}
