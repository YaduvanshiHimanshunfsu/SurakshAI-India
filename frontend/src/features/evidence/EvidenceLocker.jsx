import { useEffect, useState } from 'react'
import { FileLock2, LoaderCircle, Save, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

import { deleteEvidence, listEvidence, saveEvidence, vaultIsAvailable } from '../../lib/vault'

const LABELS = { MESSAGE: 'Message text', URL: 'URL analysed', EMAIL: 'Email text', SCREENSHOT: 'Screenshot text', VOICE_TRANSCRIPT: 'Voice transcript' }

export function EvidenceLocker({ caseId, sourceText, sourceKind }) {
  const [entries, setEntries] = useState([])
  const [available, setAvailable] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [note, setNote] = useState('')

  async function refresh() {
    setLoading(true)
    try { setEntries(await listEvidence(caseId)) } catch { setAvailable(false) } finally { setLoading(false) }
  }

  useEffect(() => { vaultIsAvailable().then(setAvailable); refresh() }, [caseId])

  async function preserve() {
    if (!sourceText || saving) return
    setSaving(true)
    try {
      await saveEvidence({ caseId, kind: sourceKind, content: sourceText, note })
      setNote('')
      await refresh()
      toast.success('Evidence encrypted and saved only in this browser.')
    } catch (error) { toast.error(error.message) } finally { setSaving(false) }
  }

  async function remove(id) {
    try { await deleteEvidence(id); await refresh(); toast.success('Local evidence removed.') } catch (error) { toast.error(error.message) }
  }

  return <section className="card rounded-2xl p-5 sm:p-6"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-700 text-white"><FileLock2 size={21} /></span><div><h2 className="text-xl font-bold text-slate-950">Evidence Locker</h2><p className="mt-1 text-sm leading-6 text-slate-600">Save the analysed content to this browser only. It is encrypted with a device-bound key; SurakshAI’s server never receives it.</p></div></div>{!available ? <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Secure browser storage is unavailable here. You can still export a masked report without saving evidence.</p> : <><div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-sm font-semibold text-slate-900">Ready to preserve: {LABELS[sourceKind] || 'Analysed content'}</p><label className="mt-3 block text-xs font-medium text-slate-600">Optional local label<textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={280} className="mt-1 min-h-16 w-full rounded-lg border border-slate-200 bg-white p-2 text-sm" placeholder="For example: WhatsApp message received at 10:15 AM" /></label><button type="button" disabled={saving || !sourceText} onClick={preserve} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">{saving ? <><LoaderCircle size={16} className="animate-spin" /> Encrypting…</> : <><Save size={16} /> Save encrypted evidence</>}</button></div><div className="mt-5 border-t border-slate-100 pt-4"><h3 className="text-sm font-bold text-slate-900">Saved for this case</h3>{loading ? <p className="mt-3 text-sm text-slate-500">Loading local evidence…</p> : entries.length === 0 ? <p className="mt-3 text-sm text-slate-500">Nothing has been saved for this case yet.</p> : <ul className="mt-3 space-y-2">{entries.map((item) => <li key={item.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3 text-sm"><span><strong>{LABELS[item.kind] || item.kind}</strong><span className="block text-xs text-slate-500">{item.note || new Date(item.createdAt).toLocaleString()}</span></span><button type="button" onClick={() => remove(item.id)} className="rounded p-2 text-slate-500 hover:bg-red-50 hover:text-red-700" aria-label="Delete local evidence"><Trash2 size={16} /></button></li>)}</ul>}</div></>}</section>
}
