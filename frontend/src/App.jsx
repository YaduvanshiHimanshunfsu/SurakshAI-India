import AppShell from './AppShell'

/* Legacy monolith retained temporarily for source-history readability.
   It is intentionally excluded from the compiled application.
import { MessageForm as AnalysisMessageForm, LinkForm as AnalysisLinkForm, EmailForm as AnalysisEmailForm } from './analysisForms'
import { urlResultAsAnalysis as buildUrlResult } from './analysisUtils'
import { VerdictCard as AnalysisVerdictCard, WhyFlagged as AnalysisWhyFlagged, Tactics as AnalysisTactics, UrlChecks as AnalysisUrlChecks, EmailEvidence as AnalysisEmailEvidence, Actions as AnalysisActions } from './analysisResults'
import { FeatureCard } from './marketing'

const MODES = [
  { id: 'message', label: 'Message', icon: MessageSquareText },
  { id: 'link', label: 'Link', icon: Link2 },
  { id: 'email', label: 'Email', icon: Mail },
]

const TONES = {
  SCAM: { label: 'Likely scam detected', body: 'Proceed with extreme caution', icon: ShieldAlert, edge: 'bg-red-600', panel: 'bg-red-50', badge: 'bg-red-100 text-red-700', text: 'text-red-700', ring: '#dc2626' },
  SUSPICIOUS: { label: 'Suspicious — verify first', body: 'Independent verification is needed', icon: AlertTriangle, edge: 'bg-amber-500', panel: 'bg-amber-50', badge: 'bg-amber-100 text-amber-800', text: 'text-amber-800', ring: '#d97706' },
  SAFE: { label: 'No obvious scam signals', body: 'Stay careful with money or personal data', icon: ShieldCheck, edge: 'bg-emerald-600', panel: 'bg-emerald-50', badge: 'bg-emerald-100 text-emerald-700', text: 'text-emerald-700', ring: '#059669' },
}

const pretty = (value = '') => value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function urlResultAsAnalysis(url) {
  const risky = ['CRITICAL', 'HIGH'].includes(url.risk_level)
  const caution = url.risk_level === 'MEDIUM'
  return {
    kind: 'url',
    verdict: risky ? 'SCAM' : caution ? 'SUSPICIOUS' : 'SAFE',
    confidence: risky ? Math.max(76, url.risk_score) : caution ? Math.max(58, url.risk_score) : 60,
    severity: risky ? 'HIGH' : caution ? 'MEDIUM' : 'LOW',
    scam_category: 'PHISHING_LINK',
    psychological_tactics: [],
    red_flags: (url.signals || []).map((signal) => ({ phrase: signal.code.replaceAll('_', ' '), explanation: signal.explanation })),
    action_steps: risky
      ? ['Do not open this link or enter any information on it.', 'Use the organisation’s official app or type its known website address yourself.', 'If you already entered credentials or made a payment, contact your bank and call 1930 immediately.']
      : ['Verify the exact registered domain through an official source before using this link.', 'Do not enter passwords, OTPs, PINs, or payment details unless you independently trust the site.'],
    hindi_summary: risky
      ? 'इस लिंक में फ़िशिंग के मजबूत संकेत हैं। इसे न खोलें और अपनी जानकारी बिल्कुल साझा न करें।'
      : 'इस लिंक में कोई निश्चित खतरा नहीं मिला, लेकिन वेबसाइट की असली डोमेन पहचान स्वतंत्र रूप से जांचें।',
    url_analyses: [url],
    analysis_source: 'URL_INTELLIGENCE',
    model_used: null,
    limitations: [url.limitations],
  }
}

function HighlightedText({ text, flags }) {
  const phrases = [...new Set((flags || []).map((flag) => flag.phrase).filter((phrase) => phrase && phrase.length < 200))]
  if (!text || !phrases.length) return <>{text || 'No readable message content was provided.'}</>
  const expression = new RegExp(`(${phrases.map(escapeRegExp).join('|')})`, 'gi')
  const flagByPhrase = new Map(phrases.map((phrase) => [phrase.toLowerCase(), true]))
  return text.split(expression).map((segment, index) => (
    flagByPhrase.has(segment.toLowerCase())
      ? <mark key={`${segment}-${index}`} className="rounded bg-red-100 px-1 font-medium text-red-800">{segment}</mark>
      : <span key={`${segment}-${index}`}>{segment}</span>
  ))
}

function ConfidenceRing({ value, color }) {
  return <div className="relative h-16 w-16 shrink-0">
    <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36" aria-label={`${value}% confidence`}>
      <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="3" />
      <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={color} strokeDasharray={`${Math.min(100, value)}, 100`} strokeLinecap="round" strokeWidth="3" />
    </svg>
    <span className="absolute inset-0 grid place-items-center text-sm font-bold text-slate-900">{value}%</span>
  </div>
}

function AuthPill({ name, value }) {
  const good = value === 'PASS'
  const bad = ['FAIL', 'SOFTFAIL'].includes(value)
  return <div className={`rounded-lg px-3 py-2 text-sm ${good ? 'bg-emerald-50 text-emerald-800' : bad ? 'bg-red-50 text-red-800' : 'bg-slate-100 text-slate-700'}`}>
    <span className="font-semibold">{name}</span><span className="ml-2 text-xs">{pretty(value)}</span>
  </div>
}

function App() {
  return <AppShell />

  const [mode, setMode] = useState('message')
  const [message, setMessage] = useState('')
  const [url, setUrl] = useState('')
  const [language, setLanguage] = useState('auto')
  const [email, setEmail] = useState({ raw_eml: '', sender: '', subject: '', body: '' })
  const [result, setResult] = useState(null)
  const [resultText, setResultText] = useState('')
  const [loading, setLoading] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const resultRef = useRef(null)

  const currentReady = useMemo(() => {
    if (mode === 'message') return message.trim().length >= 3
    if (mode === 'link') return url.trim().length >= 4
    return Boolean(email.raw_eml.trim() || email.body.trim())
  }, [email, message, mode, url])

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const changeMode = (nextMode) => { setMode(nextMode); setResult(null); setMenuOpen(false) }

  async function runAnalysis() {
    if (!currentReady || loading) return
    setLoading(true)
    setResult(null)
    try {
      let nextResult
      let sourceText
      if (mode === 'message') {
        nextResult = await analyseMessage(message.trim(), language)
        sourceText = message.trim()
      } else if (mode === 'link') {
        const urlResult = await analyseUrl(url.trim())
        nextResult = buildUrlResult(urlResult)
        sourceText = url.trim()
      } else {
        nextResult = await analyseEmail({ ...email, language })
        sourceText = email.body.trim() || 'Raw .eml uploaded — message body was parsed safely by the server.'
      }
      setResult(nextResult)
      setResultText(sourceText)
      window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 40)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  function useExample(example) {
    setMode('message')
    setMessage(example.value)
    setResult(null)
  }

  function loadEmailExample() {
    setMode('email')
    setEmail({ raw_eml: '', ...emailExample })
    setResult(null)
  }

  async function readEml(file) {
    if (!file) return
    if (file.size > 950000) return toast.error('Use a .eml file smaller than 950 KB for this demo.')
    try {
      const raw_eml = await file.text()
      setEmail((current) => ({ ...current, raw_eml }))
      toast.success(`${file.name} is ready for safe header analysis.`)
    } catch {
      toast.error('The .eml file could not be read.')
    }
  }

  const tone = TONES[result?.verdict] || TONES.SUSPICIOUS
  const ToneIcon = tone.icon
  const emailResult = result?.kind !== 'url' && Boolean(result?.authentication)

  return <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e]">
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-[#f7f9fb]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-6">
        <button className="flex items-center gap-2 text-left" onClick={() => scrollTo('top')} aria-label="Go to homepage">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-900 text-white shadow-sm"><ShieldCheck size={21} /></span>
          <span><span className="block text-base font-bold tracking-tight text-slate-950">SurakshAI-India</span><span className="block text-[11px] font-medium text-slate-500">Think before you click.</span></span>
        </button>
        <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
          <button className="hover:text-blue-700" onClick={() => scrollTo('how-it-works')}>How it works</button>
          <button className="hover:text-blue-700" onClick={() => scrollTo('safety-tips')}>Safety tips</button>
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-white shadow-sm transition hover:bg-blue-700" onClick={() => scrollTo('analyser')}>Try analysis</button>
        </nav>
        <button className="rounded-lg p-2 text-slate-700 md:hidden" onClick={() => setMenuOpen((open) => !open)} aria-label="Open navigation">{menuOpen ? <X /> : <Menu />}</button>
      </div>
      {menuOpen && <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden"><div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm font-medium text-slate-700"><button className="text-left" onClick={() => { scrollTo('how-it-works'); setMenuOpen(false) }}>How it works</button><button className="text-left" onClick={() => { scrollTo('safety-tips'); setMenuOpen(false) }}>Safety tips</button><button className="text-left text-blue-700" onClick={() => { scrollTo('analyser'); setMenuOpen(false) }}>Try analysis</button></div></div>}
    </header>

    <main id="top">
      <section className="grid-glow overflow-hidden border-b border-slate-200/80 py-12 md:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 lg:grid-cols-12 lg:px-6">
          <div className="lg:col-span-7">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 shadow-sm"><Sparkles size={15} className="text-blue-600" /> AI-powered scam awareness for India</motion.div>
            <h1 className="max-w-2xl text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl md:text-6xl">Is this <span className="text-blue-600">a scam?</span></h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">Analyse suspicious SMS, WhatsApp chats, links, and emails. SurakshAI explains risks in English, Hindi, and Hinglish — then gives a safe next step.</p>
            <div className="mt-7 flex flex-wrap gap-3"><span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-medium text-amber-900"><Smartphone size={16} /> Lost money? Call 1930 immediately.</span><a className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-blue-300" href="https://cybercrime.gov.in" target="_blank" rel="noreferrer">Report at cybercrime.gov.in <ExternalLink size={15} /></a></div>
          </div>
          <motion.div initial={{ opacity: 0, scale: .92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .1 }} className="relative mx-auto hidden h-80 w-72 lg:block">
            <div className="absolute inset-0 rotate-6 rounded-[3rem] bg-blue-100 blur-2xl" />
            <div className="absolute inset-6 grid place-items-center rounded-[3rem] border border-slate-200 bg-white shadow-2xl"><ShieldCheck size={115} strokeWidth={1.2} className="text-blue-600" /></div>
            <div className="absolute -left-7 top-16 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold shadow-lg"><ShieldAlert size={17} className="text-red-600" /> Phishing link</div>
            <div className="absolute -right-7 bottom-16 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold shadow-lg"><CheckCircle2 size={17} className="text-emerald-600" /> Verify first</div>
          </motion.div>
        </div>
      </section>

      <section id="analyser" className="mx-auto -mt-1 max-w-7xl scroll-mt-20 px-4 py-10 lg:px-6">
        <div className="card overflow-hidden rounded-2xl">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 sm:px-7"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-slate-900">Analyse safely</h2><p className="mt-1 text-sm text-slate-500">Your Gemini key stays on the server. We never open links or execute attachments.</p></div><div className="flex rounded-xl bg-slate-200/70 p-1">{MODES.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => changeMode(id)} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${mode === id ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}><Icon size={16} />{label}</button>)}</div></div></div>
          <div className="p-5 sm:p-7">
            {mode === 'message' && <AnalysisMessageForm message={message} setMessage={setMessage} language={language} setLanguage={setLanguage} onExample={useExample} />}
            {mode === 'link' && <AnalysisLinkForm url={url} setUrl={setUrl} />}
            {mode === 'email' && <AnalysisEmailForm email={email} setEmail={setEmail} onFile={readEml} onExample={loadEmailExample} />}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5"><p className="flex items-center gap-2 text-sm text-slate-500"><LockKeyhole size={16} className="text-emerald-600" /> Privacy-first checks — no inbox connection required.</p><button disabled={!currentReady || loading} onClick={runAnalysis} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{loading ? <><LoaderCircle size={18} className="animate-spin" /> Analysing safely…</> : <>{mode === 'email' ? 'Analyse email' : mode === 'link' ? 'Inspect link' : 'Analyse message'} <ArrowRight size={18} /></>}</button></div>
          </div>
        </div>
      </section>

      <AnimatePresence>{loading && <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mx-auto max-w-7xl px-4 pb-8 lg:px-6"><div className="card flex items-center gap-4 rounded-2xl p-6"><div className="grid h-12 w-12 place-items-center rounded-full bg-blue-50 text-blue-600"><ScanSearch className="animate-pulse" /></div><div><p className="font-bold text-slate-900">Analysing for scam patterns</p><p className="text-sm text-slate-500">Checking message signals, URL structure, and available authentication evidence. No link is opened.</p></div></div></motion.section>}</AnimatePresence>

      <AnimatePresence>{result && <motion.section ref={resultRef} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-7xl scroll-mt-20 px-4 pb-12 lg:px-6"><div className="mb-4 flex items-center justify-between"><button className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-700" onClick={() => { setResult(null); scrollTo('analyser') }}><ChevronRight className="rotate-180" size={17} /> Analyse another item</button><span className="text-xs font-medium uppercase tracking-wider text-slate-400">SurakshAI analysis</span></div><div className="grid gap-6 lg:grid-cols-[410px_1fr]">
         <aside className="space-y-5"><AnalysisVerdictCard result={result} tone={tone} ToneIcon={ToneIcon} /><div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-amber-50 p-5"><div className="absolute inset-y-0 left-0 w-1 bg-orange-500" /><div className="flex items-center gap-2 text-amber-950"><Languages size={19} className="text-orange-600" /><h3 className="font-semibold">सरल हिंदी में समझें</h3></div><p className="hindi mt-3 text-[15px] text-slate-700">{result.hindi_summary}</p></div>{emailResult && <AnalysisEmailEvidence result={result} />}</aside>
        <div className="space-y-6"><AnalysisWhyFlagged result={result} resultText={resultText} /><AnalysisTactics result={result} /><AnalysisUrlChecks result={result} /><AnalysisActions result={result} /><RescueMode key={`${result.kind || 'analysis'}-${result.verdict}-${result.scam_category}-${resultText}`} result={result} /></div>
      </div></motion.section>}</AnimatePresence>

      <section id="how-it-works" className="scroll-mt-20 border-y border-slate-200 bg-white py-14"><div className="mx-auto max-w-7xl px-4 lg:px-6"><div className="max-w-2xl"><p className="text-sm font-bold uppercase tracking-wider text-blue-700">Built for clarity</p><h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">What SurakshAI checks</h2></div><div className="mt-8 grid gap-5 md:grid-cols-3"><FeatureCard icon={Languages} title="Understands Indian context" text="English, Hindi, Hinglish, UPI, KYC, government and job scams — plus global phishing patterns." color="blue" /><FeatureCard icon={Globe2} title="URL intelligence" text="Looks at link structure, TLS and optional known threat matches — without loading the website." color="amber" /><FeatureCard icon={Mail} title="Email evidence" text="Raw .eml parsing checks sender fields, authentication headers and attachment metadata safely." color="emerald" /></div></div></section>
      <section id="safety-tips" className="scroll-mt-20 py-14"><div className="mx-auto max-w-7xl px-4 lg:px-6"><div className="rounded-2xl bg-slate-900 p-7 text-white md:p-10"><div className="grid gap-8 lg:grid-cols-[1fr_.9fr]"><div><p className="text-sm font-bold uppercase tracking-wider text-blue-300">Safety checklist</p><h2 className="mt-2 text-3xl font-bold tracking-tight">Pause. Verify. Protect.</h2><p className="mt-4 max-w-xl leading-7 text-slate-300">A scam detector is guidance, not a guarantee. The safest response to unexpected money, login, OTP, or attachment requests is to verify through a separately known official channel.</p></div><ul className="space-y-3">{['Never share OTP, PIN, password, CVV or screen-sharing code.', 'Type the official website yourself; do not trust an unexpected link.', 'Use 1930 quickly if money was sent or banking details were shared.', 'Keep the original .eml if reporting a suspicious email.'].map((tip) => <li key={tip} className="flex gap-3 rounded-xl bg-white/10 p-3 text-sm text-slate-100"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-300" />{tip}</li>)}</ul></div></div></div></section>
    </main>
    <footer className="border-t border-slate-200 bg-white py-8 text-center text-sm text-slate-500"><div className="mx-auto max-w-7xl px-4"><p>SurakshAI provides safety guidance, not a guarantee. Verify important requests through official channels.</p><p className="mt-2">© 2026 SurakshAI-India · Built for a safer digital India.</p></div></footer>
  </div>
}

function MessageForm({ message, setMessage, language, setLanguage, onExample }) {
  return <div><label htmlFor="message" className="mb-2 block text-sm font-semibold text-slate-800">Paste a suspicious SMS, WhatsApp message, post, or chat</label><textarea id="message" value={message} onChange={(event) => setMessage(event.target.value)} className="min-h-35 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-4 leading-6 text-slate-800 placeholder:text-slate-400" placeholder="Paste the suspicious message here… e.g., आपका UPI account 24 hours में block हो जाएगा…" /><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap items-center gap-2"><span className="text-sm text-slate-500">Language:</span>{[['auto', 'Auto'], ['en', 'English'], ['hi', 'हिंदी'], ['hinglish', 'Hinglish']].map(([id, label]) => <button key={id} onClick={() => setLanguage(id)} className={`rounded-full px-3 py-1.5 text-sm font-medium ${language === id ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{label}</button>)}</div><button onClick={async () => { try { setMessage(await navigator.clipboard.readText()); toast.success('Pasted from clipboard.'); } catch { toast.error('Browser clipboard access was not available.'); } }} className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800"><Clipboard size={16} /> Paste</button></div><div className="mt-5"><p className="mb-2 text-sm font-medium text-slate-500">Try a demo example:</p><div className="flex flex-wrap gap-2">{messageExamples.map((example) => <button key={example.label} onClick={() => onExample(example)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 transition hover:border-blue-300 hover:text-blue-700">{example.label}</button>)}</div></div></div>
}

function LinkForm({ url, setUrl }) {
  return <div><label htmlFor="link" className="mb-2 block text-sm font-semibold text-slate-800">Paste a suspicious website link</label><div className="relative"><Link2 className="absolute left-4 top-4 text-blue-600" size={20} /><input id="link" value={url} onChange={(event) => setUrl(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-4 pr-4 pl-12 text-slate-800 placeholder:text-slate-400" placeholder="https://example.com/verify" /></div><p className="mt-3 flex gap-2 text-sm leading-6 text-slate-500"><CircleHelp size={16} className="mt-1 shrink-0" /> We check URL structure, HTTPS certificate status, and any configured reputation providers. The website is never opened.</p></div>
}

function EmailForm({ email, setEmail, onFile, onExample }) {
  const update = (field) => (event) => setEmail((current) => ({ ...current, [field]: event.target.value }))
  return <div className="space-y-4"><div className="rounded-xl border border-blue-100 bg-blue-50 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold text-slate-900">Best evidence: original <code className="rounded bg-white px-1.5 py-0.5 text-sm">.eml</code> file</p><p className="mt-1 text-sm leading-6 text-slate-600">It preserves From, Reply-To, Authentication-Results, DKIM signature and attachment metadata. The file is parsed; attachments are never opened.</p></div><label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100"><FileUp size={17} /> Import .eml<input type="file" accept=".eml,message/rfc822,text/plain" className="hidden" onChange={(event) => onFile(event.target.files?.[0])} /></label></div>{email.raw_eml && <p className="mt-3 text-sm font-medium text-emerald-700">✓ Raw .eml loaded — original email authentication evidence will be inspected.</p>}</div><div className="grid gap-4 md:grid-cols-2"><label className="text-sm font-semibold text-slate-700">From (optional)<input value={email.sender} onChange={update('sender')} className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 font-normal" placeholder="Name &lt;sender@example.com&gt;" /></label><label className="text-sm font-semibold text-slate-700">Subject (optional)<input value={email.subject} onChange={update('subject')} className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 font-normal" placeholder="Email subject" /></label></div><label className="block text-sm font-semibold text-slate-700">Email body <span className="font-normal text-slate-400">(required unless you imported .eml)</span><textarea value={email.body} onChange={update('body')} className="mt-2 min-h-32 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-3 font-normal leading-6" placeholder="Paste the email body here…" /></label><div className="flex flex-wrap items-center justify-between gap-3"><p className="flex gap-2 text-sm text-slate-500"><Paperclip size={16} className="shrink-0" /> We only inspect attachment names, MIME types and sizes from .eml files.</p><button onClick={onExample} className="text-sm font-semibold text-blue-700 hover:text-blue-800">Use email demo</button></div></div>
}

function VerdictCard({ result, tone, ToneIcon }) {
  return <div className={`relative overflow-hidden rounded-2xl ${tone.panel} p-5`}><div className={`absolute inset-y-0 left-0 w-1 ${tone.edge}`} /><div className="flex items-start gap-3"><span className={`grid h-11 w-11 place-items-center rounded-full ${tone.badge}`}><ToneIcon size={23} /></span><div><h2 className="text-xl font-bold text-slate-950">{tone.label}</h2><p className="mt-1 text-sm text-slate-600">{tone.body}</p></div></div><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-white/80 p-3"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Severity</p><p className={`mt-1 text-sm font-bold ${tone.text}`}>{pretty(result.severity)} risk</p></div><div className="rounded-xl bg-white/80 p-3"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Category</p><p className="mt-1 text-sm font-bold text-slate-800">{pretty(result.scam_category)}</p></div></div><div className="mt-4 flex items-center gap-3 rounded-xl bg-white/80 p-3"><ConfidenceRing value={result.confidence} color={tone.ring} /><div><p className="text-sm font-semibold text-slate-800">Confidence score</p><p className="mt-1 text-xs leading-5 text-slate-500">Based on the available evidence; it is not a guarantee of sender identity.</p></div></div><div className="mt-4 border-t border-slate-900/10 pt-3 text-right text-[11px] font-medium text-slate-500">{result.analysis_source === 'AI' ? 'Analysed with Gemini + safety checks' : result.analysis_source === 'RULE_FALLBACK' ? 'Limited offline safety analysis' : 'URL intelligence analysis'}</div></div>
}

function WhyFlagged({ result, resultText }) {
  return <section className="card rounded-2xl p-5 sm:p-6"><div className="flex items-center gap-2"><BadgeAlert size={20} className="text-blue-600" /><h2 className="text-lg font-bold text-slate-900">Why this was flagged</h2></div><div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 leading-7 text-slate-700"><HighlightedText text={resultText} flags={result.red_flags} /></div><div className="mt-4 space-y-3">{result.red_flags?.length ? result.red_flags.map((flag, index) => <div key={`${flag.phrase}-${index}`} className="flex gap-3 rounded-xl bg-slate-50 p-3"><AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-600" /><div><p className="font-semibold text-slate-800">{flag.phrase}</p><p className="mt-1 text-sm leading-6 text-slate-600">{flag.explanation}</p></div></div>) : <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">No specific phrase was extracted. Review the verdict and independently verify any sensitive request.</p>}</div></section>
}

function Tactics({ result }) {
  return <section className="card rounded-2xl p-5 sm:p-6"><div className="flex items-center gap-2"><Sparkles size={20} className="text-blue-600" /><h2 className="text-lg font-bold text-slate-900">Manipulation tactics</h2></div><p className="mt-2 text-sm leading-6 text-slate-600">Scammers often combine emotion and pressure to stop people from checking independently.</p><div className="mt-4 flex flex-wrap gap-2">{result.psychological_tactics?.length ? result.psychological_tactics.map((tactic) => <span key={tactic} className="rounded-full bg-blue-50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-blue-800">{pretty(tactic)}</span>) : <span className="rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-600">No specific social-engineering tactic was identified.</span>}</div></section>
}

function UrlChecks({ result }) {
  if (!result.url_analyses?.length) return null
  return <section className="card rounded-2xl p-5 sm:p-6"><div className="flex items-center gap-2"><Globe2 size={20} className="text-blue-600" /><h2 className="text-lg font-bold text-slate-900">Link intelligence</h2></div><div className="mt-4 space-y-3">{result.url_analyses.map((url) => <div key={url.original_url} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="break-all font-semibold text-slate-800">{url.host || url.original_url}</p><p className="mt-1 text-sm text-slate-500">Registered domain: {url.registered_domain || 'unavailable'} · TLS: {pretty(url.tls?.status || 'NOT_CHECKED')}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${['CRITICAL', 'HIGH'].includes(url.risk_level) ? 'bg-red-100 text-red-800' : url.risk_level === 'MEDIUM' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>{url.risk_score}/100 · {pretty(url.risk_level)}</span></div><p className="mt-3 text-sm leading-6 text-slate-600">{url.summary}</p>{url.reputation?.length > 0 && <p className="mt-2 text-xs text-slate-500">Reputation: {url.reputation.map((item) => `${item.provider}: ${pretty(item.status)}`).join(' · ')}</p>}</div>)}</div></section>
}

function EmailEvidence({ result }) {
  const sender = result.sender || {}
  const reply = result.reply_to || {}
  return <section className="card rounded-2xl p-5"><div className="flex items-center gap-2"><Mail size={19} className="text-blue-600" /><h3 className="font-bold text-slate-900">Email evidence</h3></div><dl className="mt-4 space-y-3 text-sm"><div><dt className="font-medium text-slate-500">From</dt><dd className="mt-1 break-all text-slate-800">{sender.display_name || sender.address || 'Not available'} {sender.address && sender.display_name ? <span className="text-slate-500">&lt;{sender.address}&gt;</span> : null}</dd></div>{reply.address && <div><dt className="font-medium text-slate-500">Reply-To</dt><dd className="mt-1 break-all text-slate-800">{reply.address}</dd></div>}<div><dt className="font-medium text-slate-500">Email type</dt><dd className="mt-1 font-semibold text-slate-800">{pretty(result.email_type)}</dd></div></dl><div className="mt-5 grid grid-cols-2 gap-2"><AuthPill name="SPF" value={result.authentication.spf} /><AuthPill name="DKIM" value={result.authentication.dkim} /><AuthPill name="DMARC" value={result.authentication.dmarc} /><AuthPill name="Alignment" value={result.authentication.alignment} /></div><p className="mt-3 text-xs leading-5 text-slate-500">Evidence source: {result.authentication.source}</p>{result.attachments?.length > 0 && <div className="mt-5 border-t border-slate-100 pt-4"><p className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800"><Paperclip size={16} /> Attachments</p>{result.attachments.map((file, index) => <p key={`${file.filename}-${index}`} className="mt-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-600"><strong>{file.filename || 'Unnamed attachment'}</strong> · {pretty(file.risk)} risk<br />{file.reason}</p>)}</div>}</section>
}

function Actions({ result }) {
  const copy = async () => { try { await navigator.clipboard.writeText(result.action_steps.map((action, index) => `${index + 1}. ${action}`).join('\n')); toast.success('Safety steps copied.'); } catch { toast.error('Could not copy the steps.'); } }
  return <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5 sm:p-6"><div className="flex items-center gap-2"><ShieldCheck size={22} className="text-blue-700" /><h2 className="text-xl font-bold text-slate-950">What you should do next</h2></div><ol className="mt-5 space-y-3">{result.action_steps.map((action, index) => <li key={action} className="flex gap-3 rounded-xl bg-white p-4 shadow-sm"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-100 text-sm font-bold text-blue-800">{index + 1}</span><p className="pt-0.5 text-sm leading-6 text-slate-700">{action}</p></li>)}</ol><div className="mt-5 flex flex-wrap gap-3"><a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"><Landmark size={17} /> Report to Cybercrime.gov.in</a><button onClick={copy} className="inline-flex items-center gap-2 rounded-lg border border-blue-600 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50"><Copy size={17} /> Copy steps</button></div>{result.limitations?.length > 0 && <div className="mt-5 border-t border-blue-200 pt-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Limits of this analysis</p><ul className="mt-2 space-y-1 text-xs leading-5 text-slate-600">{result.limitations.map((item) => <li key={item}>• {item}</li>)}</ul></div>}</section>
}

function Feature({ icon: Icon, title, text, color }) {
  const palette = { blue: 'bg-blue-100 text-blue-700', amber: 'bg-amber-100 text-amber-700', emerald: 'bg-emerald-100 text-emerald-700' }
  return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 transition hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-lg"><span className={`grid h-12 w-12 place-items-center rounded-xl ${palette[color]}`}><Icon size={24} /></span><h3 className="mt-5 text-lg font-bold text-slate-900">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></div>
}

*/
export default AppShell
