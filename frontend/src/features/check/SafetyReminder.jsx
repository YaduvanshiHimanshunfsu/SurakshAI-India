import { Check, ChevronRight, Landmark, LockKeyhole, QrCode, ScanSearch, ShieldCheck } from 'lucide-react'

const reminders = [
  [LockKeyhole, 'Never share OTP or PIN', 'No genuine bank or payment app needs your secret code.'],
  [QrCode, 'Receiving money needs no PIN', 'A QR code plus a UPI PIN can initiate a payment from you.'],
  [Landmark, 'Use official apps only', 'Do not use links or phone numbers from an unexpected message.'],
]
const MODE_SAFETY = {
  message: ['Paste the content', 'See scam signals and a safe next step'],
  link: ['Paste the URL', 'Inspect signals without opening the website'],
  email: ['Add the email or .eml', 'Review sender and authentication clues'],
  screenshot: ['Choose a screenshot with consent', 'Correct extracted text before analysis'],
  voice: ['Upload or record a short note', 'Correct the transcript before analysis'],
  qr: ['Decode the QR locally', 'Inspect UPI or URL payload before paying'],
}

export function SafetyReminder({ mode, compact = false }) {
  const workflow = MODE_SAFETY[mode] || MODE_SAFETY.message
  return <aside className={`${compact ? 'mt-5' : 'sticky top-32'} rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5 shadow-sm`}>
    <div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-emerald-700 shadow-sm"><ShieldCheck size={18} /></span><div><p className="text-xs font-bold uppercase tracking-wider text-emerald-800">Before you act</p><h2 className="text-lg font-bold text-slate-950">Three calm safety rules</h2></div></div>
    <ul className="mt-5 space-y-4">{reminders.map(([Icon, title, copy]) => <li key={title} className="flex gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-emerald-700 shadow-sm"><Icon size={18} /></span><div><p className="text-sm font-bold text-slate-900">{title}</p><p className="mt-1 text-xs leading-5 text-slate-600">{copy}</p></div></li>)}</ul>
    <div className="mt-5 border-t border-emerald-200 pt-4"><p className="text-xs font-bold uppercase tracking-wider text-emerald-800">This check will</p><ol className="mt-3 space-y-2">{workflow.map((item, index) => <li key={item} className="flex items-center gap-2 text-sm text-slate-700"><span className="grid h-5 w-5 place-items-center rounded-full bg-white text-xs font-bold text-emerald-700">{index === workflow.length - 1 ? <Check size={13} /> : index + 1}</span>{item}{index < workflow.length - 1 && <ChevronRight size={14} className="ml-auto text-emerald-500" />}</li>)}</ol><p className="mt-3 flex items-center gap-2 text-xs leading-5 text-emerald-900"><ScanSearch size={14} /> You decide what to do; SurakshAI never makes a payment or contact for you.</p></div>
  </aside>
}
