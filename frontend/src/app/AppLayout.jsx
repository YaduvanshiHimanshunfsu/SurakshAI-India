import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Landmark, ShieldCheck } from 'lucide-react'
import { SafetyWorkflow } from '../features/navigation/SafetyWorkflow'

const links = [['/check', 'Check'], ['/rescue', 'Rescue'], ['/evidence', 'Evidence'], ['/help', 'Official help'], ['/learn', 'Learn']]

export function AppLayout() {
  const reducedMotion = useReducedMotion()
  const { pathname } = useLocation()
  const compactFooter = ['/check', '/rescue', '/evidence'].includes(pathname)
  return <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e]"><header className="sticky top-0 z-50 border-b border-slate-200/70 bg-[#f7f9fb]/90 shadow-sm backdrop-blur-xl"><div className="mx-auto flex min-h-18 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 lg:px-6"><NavLink to="/" className="group flex items-center gap-2"><span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-white shadow-sm transition group-hover:-rotate-3 group-hover:bg-blue-700"><ShieldCheck size={21} /></span><span><span className="block text-base font-bold tracking-tight text-slate-950">SurakshAI-India</span><span className="block text-xs font-medium text-slate-500">Think before you click.</span></span></NavLink><div className="flex items-center gap-2"><nav aria-label="Main navigation" className="flex flex-wrap items-center gap-1 text-[13px] font-semibold text-slate-600">{links.map(([to, label]) => <NavLink key={to} to={to} className={({ isActive }) => `rounded-lg px-3 py-2 transition ${isActive ? 'bg-blue-100 text-blue-800 shadow-sm' : 'hover:bg-white hover:text-blue-700'}`}>{label}</NavLink>)}</nav><a href="tel:1930" className="hidden items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-800 transition hover:bg-red-100 xl:inline-flex"><Landmark size={14} /> 1930</a></div></div></header><SafetyWorkflow /><motion.main initial={reducedMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? 0 : 0.22 }}><Outlet /></motion.main><footer className={`border-t border-slate-200 bg-white text-center text-[13px] text-slate-500 ${compactFooter ? 'py-4' : 'py-8'}`}><p>SurakshAI provides safety guidance, not a guarantee. Verify important requests through official channels.</p><p className="mt-1">© 2026 SurakshAI-India · Built for a safer digital India.</p></footer></div>
}
