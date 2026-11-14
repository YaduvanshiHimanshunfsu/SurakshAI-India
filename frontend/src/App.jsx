import { BrowserRouter } from 'react-router-dom'

import { AnalysisSessionProvider } from './app/AnalysisSessionContext'
import { AppRouter } from './app/AppRouter'

export default function App() {
  return <BrowserRouter><AnalysisSessionProvider><AppRouter /></AnalysisSessionProvider></BrowserRouter>
}
