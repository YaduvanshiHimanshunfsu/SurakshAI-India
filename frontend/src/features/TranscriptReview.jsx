import { useEffect, useState } from 'react'
import { ArrowRight, FileText, RotateCcw } from 'lucide-react'

export function TranscriptReview({ extraction, onAnalyse, onStartOver }) {
  const [text, setText] = useState(extraction.extracted_text)
  const [language, setLanguage] = useState(extraction.detected_language || 'auto')

  useEffect(() => {
    setText(extraction.extracted_text)
    setLanguage(extraction.detected_language || 'auto')
  }, [extraction])

  return <div className="space-y-5"><div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4"><FileText size={21} className="mt-0.5 shrink-0 text-blue-700" /><div><h3 className="font-bold text-slate-900">Review extracted text before analysis</h3><p className="mt-1 text-sm leading-6 text-slate-600">Correct OCR or transcription mistakes—especially names, URLs, amounts, UPI IDs, and phone numbers. The edited text is what SurakshAI will analyse.</p></div></div><label className="block text-sm font-semibold text-slate-800">Extracted text<textarea value={text} onChange={(event) => setText(event.target.value)} className="mt-2 min-h-48 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-4 font-normal leading-6 text-slate-800" /></label><label className="block max-w-xs text-sm font-semibold text-slate-800">Language<select value={language} onChange={(event) => setLanguage(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 font-normal"><option value="auto">Auto detect</option><option value="en">English</option><option value="hi">हिंदी</option><option value="hinglish">Hinglish</option><option value="other">Other</option></select></label>{extraction.limitations?.length > 0 && <ul className="rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-600">{extraction.limitations.map((item) => <li key={item}>• {item}</li>)}</ul>}<div className="flex flex-wrap justify-between gap-3 border-t border-slate-100 pt-5"><button type="button" onClick={onStartOver} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><RotateCcw size={16} /> Choose another file</button><button type="button" disabled={text.trim().length < 3} onClick={() => onAnalyse(text.trim(), language)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">Analyse corrected text <ArrowRight size={17} /></button></div></div>
}
