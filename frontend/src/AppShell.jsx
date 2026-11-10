import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  AlertTriangle, ArrowRight, CheckCircle2, ChevronRight, ExternalLink, Globe2,
  Languages, Link2, LoaderCircle, LockKeyhole, Mail, Menu, MessageSquareText,
  Image, Mic, ScanSearch, ShieldAlert, ShieldCheck, Smartphone, Sparkles, X,
} from 'lucide-react'

import { emailExample } from './data/demo'
import { AnalysisActions, AnalysisEmailEvidence, AnalysisTactics, AnalysisUrlChecks, AnalysisVerdictCard, AnalysisWhyFlagged } from './analysisView'
import { EmailForm, LinkForm, MessageForm } from './analysisForms'
import { urlResultAsAnalysis } from './analysisUtils'
import { RescueMode } from './features/rescue/RescueMode'
import { MediaScanner } from './features/MediaScanner'
import { TranscriptReview } from './features/TranscriptReview'
import { EvidenceLocker } from './features/evidence/EvidenceLocker'
import { ReportPack } from './features/evidence/ReportPack'
import { analyseEmail, analyseMessage, analyseUrl } from './lib/api'
import { createCaseId } from './lib/report'
import { FeatureCard } from './marketing'

const MODES = [
  { id: 'message', label: 'Message', icon: MessageSquareText },
  { id: 'link', label: 'Link', icon: Link2 },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'screenshot', label: 'Screenshot', icon: Image },
  { id: 'voice', label: 'Voice note', icon: Mic },
]

const TONES = {
  SCAM: { label: 'Likely scam detected', body: 'Proceed with extreme caution', icon: ShieldAlert, edge: 'bg-red-600', panel: 'bg-red-50', badge: 'bg-red-100 text-red-700', text: 'text-red-700', ring: '#dc2626' },
  SUSPICIOUS: { label: 'Suspicious — verify first', body: 'Independent verification is needed', icon: AlertTriangle, edge: 'bg-amber-500', panel: 'bg-amber-50', badge: 'bg-amber-100 text-amber-800', text: 'text-amber-800', ring: '#d97706' },
  SAFE: { label: 'No obvious scam signals', body: 'Stay careful with money or personal data', icon: ShieldCheck, edge: 'bg-emerald-600', panel: 'bg-emerald-50', badge: 'bg-emerald-100 text-emerald-700', text: 'text-emerald-700', ring: '#059669' },
}

export default function AppShell() {
  const [mode, setMode] = useState('message')
  const [message, setMessage] = useState('')
  const [url, setUrl] = useState('')
  const [language, setLanguage] = useState('auto')
  const [email, setEmail] = useState({ raw_eml: '', sender: '', subject: '', body: '' })
  const [result, setResult] = useState(null)
  const [resultText, setResultText] = useState('')
  const [mediaExtraction, setMediaExtraction] = useState(null)
  const [caseId, setCaseId] = useState('')
  const [sourceKind, setSourceKind] = useState('MESSAGE')
  const [rescuePlan, setRescuePlan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const resultRef = useRef(null)

  const currentReady = useMemo(() => {
    if (mode === 'message') return message.trim().length >= 3
    if (mode === 'link') return url.trim().length >= 4
    if (mode === 'email') return Boolean(email.raw_eml.trim() || email.body.trim())
    return false
  }, [email, message, mode, url])

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const changeMode = (nextMode) => { setMode(nextMode); setResult(null); setMediaExtraction(null); setRescuePlan(null); setMenuOpen(false) }

  function setAnalysisResult(nextResult, sourceText, kind) {
    setResult(nextResult)
    setResultText(sourceText)
    setSourceKind(kind)
    setCaseId(createCaseId())
    setRescuePlan(null)
    window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 40)
  }

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
        nextResult = urlResultAsAnalysis(urlResult)
        sourceText = url.trim()
      } else {
        nextResult = await analyseEmail({ ...email, language })
        sourceText = email.body.trim() || 'Raw .eml uploaded — message body was parsed safely by the server.'
      }
      setAnalysisResult(nextResult, sourceText, mode === 'message' ? 'MESSAGE' : mode === 'link' ? 'URL' : 'EMAIL')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function analyseExtractedText(text, extractedLanguage = 'auto') {
    if (loading || text.trim().length < 3) return
    setLoading(true)
    setResult(null)
    try {
      const sourceText = text.trim()
      const nextResult = await analyseMessage(sourceText, extractedLanguage)
      setAnalysisResult(nextResult, sourceText, mode === 'voice' ? 'VOICE_TRANSCRIPT' : 'SCREENSHOT')
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
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-[#f7f9fb]/90 backdrop-blur-xl"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-6"><button className="flex items-center gap-2 text-left" onClick={() => scrollTo('top')} aria-label="Go to homepage"><span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-900 text-white shadow-sm"><ShieldCheck size={21} /></span><span><span className="block text-base font-bold tracking-tight text-slate-950">SurakshAI-India</span><span className="block text-[11px] font-medium text-slate-500">Think before you click.</span></span></button><nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex"><button className="hover:text-blue-700" onClick={() => scrollTo('how-it-works')}>How it works</button><button className="hover:text-blue-700" onClick={() => scrollTo('safety-tips')}>Safety tips</button><button className="rounded-lg bg-blue-600 px-4 py-2 text-white shadow-sm transition hover:bg-blue-700" onClick={() => scrollTo('analyser')}>Try analysis</button></nav><button className="rounded-lg p-2 text-slate-700 md:hidden" onClick={() => setMenuOpen((open) => !open)} aria-label="Open navigation">{menuOpen ? <X /> : <Menu />}</button></div>{menuOpen && <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden"><div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm font-medium text-slate-700"><button className="text-left" onClick={() => { scrollTo('how-it-works'); setMenuOpen(false) }}>How it works</button><button className="text-left" onClick={() => { scrollTo('safety-tips'); setMenuOpen(false) }}>Safety tips</button><button className="text-left text-blue-700" onClick={() => { scrollTo('analyser'); setMenuOpen(false) }}>Try analysis</button></div></div>}</header>
    <main id="top">
      <section className="grid-glow overflow-hidden border-b border-slate-200/80 py-12 md:py-20"><div className="mx-auto grid max-w-7xl items-center gap-10 px-4 lg:grid-cols-12 lg:px-6"><div className="lg:col-span-7"><motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 shadow-sm"><Sparkles size={15} className="text-blue-600" /> AI-powered scam awareness for India</motion.div><h1 className="max-w-2xl text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl md:text-6xl">Is this <span className="text-blue-600">a scam?</span></h1><p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">Analyse suspicious messages, screenshots, voice notes, links, and emails. SurakshAI explains risks in English, Hindi, and Hinglish — then gives a safe next step.</p><div className="mt-7 flex flex-wrap gap-3"><span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-medium text-amber-900"><Smartphone size={16} /> Lost money? Call 1930 immediately.</span><a className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-blue-300" href="https://cybercrime.gov.in" target="_blank" rel="noreferrer">Report at cybercrime.gov.in <ExternalLink size={15} /></a></div></div><motion.div initial={{ opacity: 0, scale: .92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .1 }} className="relative mx-auto hidden h-80 w-72 lg:block"><div className="absolute inset-0 rotate-6 rounded-[3rem] bg-blue-100 blur-2xl" /><div className="absolute inset-6 grid place-items-center rounded-[3rem] border border-slate-200 bg-white shadow-2xl"><ShieldCheck size={115} strokeWidth={1.2} className="text-blue-600" /></div><div className="absolute -left-7 top-16 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold shadow-lg"><ShieldAlert size={17} className="text-red-600" /> Phishing link</div><div className="absolute -right-7 bottom-16 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold shadow-lg"><CheckCircle2 size={17} className="text-emerald-600" /> Verify first</div></motion.div></div></section>
      <section id="analyser" className="mx-auto -mt-1 max-w-7xl scroll-mt-20 px-4 py-10 lg:px-6"><div className="card overflow-hidden rounded-2xl"><div className="border-b border-slate-200 bg-slate-50 px-5 py-4 sm:px-7"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-slate-900">Analyse safely</h2><p className="mt-1 text-sm text-slate-500">Your Gemini key stays on the server. Media is processed in memory and is never saved.</p></div><div className="flex flex-wrap rounded-xl bg-slate-200/70 p-1">{MODES.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => changeMode(id)} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${mode === id ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}><Icon size={16} />{label}</button>)}</div></div></div><div className="p-5 sm:p-7">{mode === 'message' && <MessageForm message={message} setMessage={setMessage} language={language} setLanguage={setLanguage} onExample={useExample} />}{mode === 'link' && <LinkForm url={url} setUrl={setUrl} />}{mode === 'email' && <EmailForm email={email} setEmail={setEmail} onFile={readEml} onExample={loadEmailExample} />}{mode === 'screenshot' && (mediaExtraction ? <TranscriptReview extraction={mediaExtraction} onAnalyse={analyseExtractedText} onStartOver={() => setMediaExtraction(null)} /> : <MediaScanner mediaKind="SCREENSHOT" onExtracted={setMediaExtraction} />)}{mode === 'voice' && (mediaExtraction ? <TranscriptReview extraction={mediaExtraction} onAnalyse={analyseExtractedText} onStartOver={() => setMediaExtraction(null)} /> : <MediaScanner mediaKind="VOICE_NOTE" onExtracted={setMediaExtraction} />)}{!['screenshot', 'voice'].includes(mode) && <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5"><p className="flex items-center gap-2 text-sm text-slate-500"><LockKeyhole size={16} className="text-emerald-600" /> Privacy-first checks — no inbox connection required.</p><button type="button" disabled={!currentReady || loading} onClick={runAnalysis} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{loading ? <><LoaderCircle size={18} className="animate-spin" /> Analysing safely…</> : <>{mode === 'email' ? 'Analyse email' : mode === 'link' ? 'Inspect link' : 'Analyse message'} <ArrowRight size={18} /></>}</button></div>}</div></div></section>
      <AnimatePresence>{loading && <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mx-auto max-w-7xl px-4 pb-8 lg:px-6"><div className="card flex items-center gap-4 rounded-2xl p-6"><div className="grid h-12 w-12 place-items-center rounded-full bg-blue-50 text-blue-600"><ScanSearch className="animate-pulse" /></div><div><p className="font-bold text-slate-900">Analysing for scam patterns</p><p className="text-sm text-slate-500">Checking message signals, URL structure, and available authentication evidence. No link is opened.</p></div></div></motion.section>}</AnimatePresence>
      <AnimatePresence>{result && <motion.section ref={resultRef} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-7xl scroll-mt-20 px-4 pb-12 lg:px-6"><div className="mb-4 flex items-center justify-between"><button type="button" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-700" onClick={() => { setResult(null); setRescuePlan(null); scrollTo('analyser') }}><ChevronRight className="rotate-180" size={17} /> Analyse another item</button><span className="text-xs font-medium uppercase tracking-wider text-slate-400">SurakshAI analysis</span></div><div className="grid gap-6 lg:grid-cols-[410px_1fr]"><aside className="space-y-5"><AnalysisVerdictCard result={result} tone={tone} ToneIcon={ToneIcon} /><div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-amber-50 p-5"><div className="absolute inset-y-0 left-0 w-1 bg-orange-500" /><div className="flex items-center gap-2 text-amber-950"><Languages size={19} className="text-orange-600" /><h3 className="font-semibold">सरल हिंदी में समझें</h3></div><p className="hindi mt-3 text-[15px] text-slate-700">{result.hindi_summary}</p></div>{emailResult && <AnalysisEmailEvidence result={result} />}</aside><div className="space-y-6"><AnalysisWhyFlagged result={result} resultText={resultText} /><AnalysisTactics result={result} /><AnalysisUrlChecks result={result} /><AnalysisActions result={result} /><RescueMode key={`${result.kind || 'analysis'}-${result.verdict}-${result.scam_category}-${resultText}`} result={result} onPlanReady={setRescuePlan} /><EvidenceLocker caseId={caseId} sourceText={resultText} sourceKind={sourceKind} /><ReportPack caseId={caseId} analysis={result} sourceText={resultText} sourceKind={sourceKind} rescuePlan={rescuePlan} /></div></div></motion.section>}</AnimatePresence>
      <section id="how-it-works" className="scroll-mt-20 border-y border-slate-200 bg-white py-14"><div className="mx-auto max-w-7xl px-4 lg:px-6"><div className="max-w-2xl"><p className="text-sm font-bold uppercase tracking-wider text-blue-700">Built for clarity</p><h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">What SurakshAI checks</h2></div><div className="mt-8 grid gap-5 md:grid-cols-4"><FeatureCard icon={Languages} title="Understands Indian context" text="English, Hindi, Hinglish, UPI, KYC, government and job scams — plus global phishing patterns." color="blue" /><FeatureCard icon={Image} title="Media, with review" text="Screenshot OCR and short voice-note transcription remain editable before scam analysis." color="emerald" /><FeatureCard icon={Globe2} title="URL intelligence" text="Looks at link structure, TLS and optional known threat matches — without loading the website." color="amber" /><FeatureCard icon={Mail} title="Email evidence" text="Raw .eml parsing checks sender fields, authentication headers and attachment metadata safely." color="emerald" /></div></div></section>
      <section id="safety-tips" className="scroll-mt-20 py-14"><div className="mx-auto max-w-7xl px-4 lg:px-6"><div className="rounded-2xl bg-slate-900 p-7 text-white md:p-10"><div className="grid gap-8 lg:grid-cols-[1fr_.9fr]"><div><p className="text-sm font-bold uppercase tracking-wider text-blue-300">Safety checklist</p><h2 className="mt-2 text-3xl font-bold tracking-tight">Pause. Verify. Protect.</h2><p className="mt-4 max-w-xl leading-7 text-slate-300">A scam detector is guidance, not a guarantee. The safest response to unexpected money, login, OTP, or attachment requests is to verify through a separately known official channel.</p></div><ul className="space-y-3">{['Never share OTP, PIN, password, CVV or screen-sharing code.', 'Type the official website yourself; do not trust an unexpected link.', 'Use 1930 quickly if money was sent or banking details were shared.', 'Keep the original .eml if reporting a suspicious email.'].map((tip) => <li key={tip} className="flex gap-3 rounded-xl bg-white/10 p-3 text-sm text-slate-100"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-300" />{tip}</li>)}</ul></div></div></div></section>
    </main>
    <footer className="border-t border-slate-200 bg-white py-8 text-center text-sm text-slate-500"><div className="mx-auto max-w-7xl px-4"><p>SurakshAI provides safety guidance, not a guarantee. Verify important requests through official channels.</p><p className="mt-2">© 2026 SurakshAI-India · Built for a safer digital India.</p></div></footer>
  </div>
}
