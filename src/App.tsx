import './App.css'
import Round from './components/round'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
function App() {
  return (  
    <Router>
      <Routes>
        <Route path='/*' element={<Round/>} />
      </Routes>
    </Router>
  )
}

export default App
