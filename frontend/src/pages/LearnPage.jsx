import { Link } from 'react-router-dom'
import { CheckCircle2, QrCode, ShieldAlert } from 'lucide-react'

import { SafetyScenario } from '../features/learn/SafetyScenario'
import { ScamTypeExplorer } from '../features/learn/ScamTypeExplorer'
import { HowToUseDiagram } from '../features/learn/HowToUseDiagram'

const lessons = [
  { title: 'OTP safety', points: ['An OTP can approve access or payment.', 'A bank or payment app will not ask you to reveal it.', 'End the conversation and use the official app yourself.'] },
  { title: 'QR payment safety', points: ['Receiving money does not require a UPI PIN.', 'Scanning a payment QR and entering a PIN can send money.', 'Do not approve a collect request just to receive money.'] },
  { title: 'Link and caller safety', points: ['Do not use the link or number inside an unexpected message.', 'Type the official website or use the official app yourself.', 'Pressure and urgency are reasons to pause, not to hurry.'] },
]

export function LearnPage() {
  return <section className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
    <div className="grid gap-6 lg:grid-cols-[1fr_330px]">
      <div>
        <p className="text-sm font-bold uppercase tracking-wider text-blue-700">Learn safely</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">Know the trick. Choose the safe next step.</h1>
        <p className="mt-3 max-w-2xl text-slate-600">A practical guide for suspicious text, links, email, screenshots, voice calls, and QR codes. It teaches prevention, not fear.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="#scam-types" className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700">Explore scam types</a>
          <Link to="/check" className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">Start a safety check</Link>
        </div>
      </div>
      <aside className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">Remember first</p>
        <p className="mt-2 text-lg font-bold text-slate-950">No OTP. No PIN. No rushed decision.</p>
        <p className="mt-2 text-sm leading-6 text-slate-700">If someone pressures you, stop and verify through an official app, website, or independently known number.</p>
      </aside>
    </div>

    <div className="mt-10"><HowToUseDiagram /></div>
    <div className="mt-12"><ScamTypeExplorer /></div>

    <section className="mt-12">
      <p className="text-sm font-bold uppercase tracking-wider text-blue-700">Always follow these rules</p>
      <h2 className="mt-2 text-3xl font-bold text-slate-950">Core habits that stop most scams</h2>
      <div className="mt-6 grid gap-5 md:grid-cols-3">
        {lessons.map((lesson, index) => <article key={lesson.title} className="card rounded-2xl p-6">
          <span className={`grid h-11 w-11 place-items-center rounded-xl ${index === 1 ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'}`}>{index === 1 ? <QrCode size={22} /> : <ShieldAlert size={22} />}</span>
          <h3 className="mt-4 text-xl font-bold text-slate-950">{lesson.title}</h3>
          <ul className="mt-4 space-y-3">{lesson.points.map((point) => <li key={point} className="flex gap-2 text-sm leading-6 text-slate-700"><CheckCircle2 size={16} className="mt-1 shrink-0 text-emerald-600" />{point}</li>)}</ul>
        </article>)}
      </div>
      <section className="mt-6 overflow-hidden rounded-2xl border border-violet-200 bg-violet-50 p-6">
        <div className="grid gap-5 md:grid-cols-[1fr_auto_1fr]">
          <div><p className="font-bold text-slate-950">Receive money</p><p className="mt-2 text-sm text-slate-700">No QR scan or UPI PIN is needed.</p></div>
          <div className="hidden place-items-center text-xl font-bold text-violet-600 md:grid">≠</div>
          <div><p className="font-bold text-slate-950">Scan a QR + enter PIN</p><p className="mt-2 text-sm text-slate-700">This can initiate a payment from you.</p></div>
        </div>
        <Link to="/check" className="mt-5 inline-flex rounded-lg bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white">Scan a QR safely</Link>
      </section>
    </section>

    <section className="mt-12">
      <p className="text-sm font-bold uppercase tracking-wider text-violet-700">Practice safely</p>
      <h2 className="mt-2 text-3xl font-bold text-slate-950">What would you do next?</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Try these short scenarios. They teach the same safe actions the app recommends; no answer is saved.</p>
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <SafetyScenario title="Someone asks for an OTP" prompt="A caller says they are from your bank and need the OTP you just received to stop a block." choices={['Share the OTP to stop the block', 'End the call and open the official bank app yourself', 'Send a screenshot of the OTP']} answer={1} explanation="Correct. Never reveal an OTP. End the conversation and verify through your official app or a number you already know." />
        <SafetyScenario title="A QR says “receive ₹500”" prompt="A shop message asks you to scan its QR code and enter your UPI PIN to receive a refund." choices={['Scan it and enter the PIN', 'Ask them to send a collect request', 'Do not scan; receiving money never needs your UPI PIN']} answer={2} explanation="Correct. A QR plus PIN generally starts a payment from you. Receiving money does not require a UPI PIN." />
        <SafetyScenario title="Bank account blocked in 2 hours" prompt="An SMS claims your account will close unless you click its KYC link immediately." choices={['Click because it is urgent', 'Open the official bank app or type the official website yourself', 'Reply with your account number']} answer={1} explanation="Correct. Urgency is a pressure tactic. Independently open the official bank app or website instead of using the message link." />
      </div>
    </section>
  </section>
}
