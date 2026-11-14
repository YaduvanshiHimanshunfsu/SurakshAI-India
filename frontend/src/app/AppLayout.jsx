import { NavLink, Outlet } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'

const links = [['/check', 'Check'], ['/rescue', 'Rescue'], ['/evidence', 'Evidence'], ['/help', 'Official help'], ['/learn', 'Learn']]

export function AppLayout() {
  const reducedMotion = useReducedMotion()
  return <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e]"><header className="sticky top-0 z-50 border-b border-slate-200/70 bg-[#f7f9fb]/90 backdrop-blur-xl"><div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2 lg:px-6"><NavLink to="/" className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-900 text-white shadow-sm"><ShieldCheck size={21} /></span><span><span className="block text-base font-bold tracking-tight text-slate-950">SurakshAI-India</span><span className="block text-[11px] font-medium text-slate-500">Think before you click.</span></span></NavLink><nav className="flex flex-wrap items-center gap-1 text-sm font-semibold text-slate-600">{links.map(([to, label]) => <NavLink key={to} to={to} className={({ isActive }) => `rounded-lg px-3 py-2 transition ${isActive ? 'bg-blue-100 text-blue-800' : 'hover:bg-white hover:text-blue-700'}`}>{label}</NavLink>)}</nav></div></header><motion.main initial={reducedMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? 0 : 0.22 }}><Outlet /></motion.main><footer className="border-t border-slate-200 bg-white py-8 text-center text-sm text-slate-500"><p>SurakshAI provides safety guidance, not a guarantee. Verify important requests through official channels.</p><p className="mt-2">© 2026 SurakshAI-India · Built for a safer digital India.</p></footer></div>
}
