import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './AppLayout'
import { HomePage } from '../pages/HomePage'
import { CheckPage } from '../pages/CheckPage'
import { ResultPage } from '../pages/ResultPage'
import { RescuePage } from '../pages/RescuePage'
import { EvidencePage } from '../pages/EvidencePage'
import { HelpPage } from '../pages/HelpPage'
import { LearnPage } from '../pages/LearnPage'

export function AppRouter() { return <Routes><Route element={<AppLayout />}><Route path="/" element={<HomePage />} /><Route path="/check" element={<CheckPage />} /><Route path="/result" element={<ResultPage />} /><Route path="/rescue" element={<RescuePage />} /><Route path="/evidence" element={<EvidencePage />} /><Route path="/help" element={<HelpPage />} /><Route path="/learn" element={<LearnPage />} /><Route path="*" element={<Navigate to="/" replace />} /></Route></Routes> }
