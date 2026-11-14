import { Link } from 'react-router-dom'
import { ArrowRight, FileLock2, ShieldAlert } from 'lucide-react'

export function EmptyAnalysisState({ type }) {
  const evidence = type === 'evidence'
  const Icon = evidence ? FileLock2 : ShieldAlert
  const title = evidence ? 'Analyse something first to create an Evidence Pack.' : 'Analyse something first to receive a personalised rescue plan.'
  const detail = evidence ? 'After an analysis, you can save selected content in encrypted browser-only storage and export a masked report.' : 'After an analysis, Rescue Mode asks what happened and gives the right reviewed steps for that exposure.'
  return <section className="mx-auto flex min-h-[58vh] max-w-3xl items-center px-4 py-10 lg:px-6"><div className="card w-full rounded-3xl p-7 text-center sm:p-10"><span className={`mx-auto grid h-14 w-14 place-items-center rounded-2xl ${evidence ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}><Icon size={27} /></span><p className="mt-5 text-sm font-bold uppercase tracking-wider text-blue-700">{evidence ? 'Browser-only evidence' : 'Rescue Mode'}</p><h1 className="mx-auto mt-2 max-w-xl text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{title}</h1><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600">{detail}</p><Link to="/check" className="mt-7 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">Start a safety check <ArrowRight size={17} /></Link></div></section>
}
