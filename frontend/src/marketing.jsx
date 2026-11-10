export function FeatureCard({ icon: Icon, title, text, color }) {
  const palette = { blue: 'bg-blue-100 text-blue-700', amber: 'bg-amber-100 text-amber-700', emerald: 'bg-emerald-100 text-emerald-700' }
  return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 transition hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-lg"><span className={`grid h-12 w-12 place-items-center rounded-xl ${palette[color]}`}><Icon size={24} /></span><h3 className="mt-5 text-lg font-bold text-slate-900">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></div>
}
