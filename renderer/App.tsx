import { MemoryRouter as Router, Routes, Route } from "react-router-dom"
import "./App.css"
import SlimeGame from "../components/SlimeGame/SlimeGame"
import { DayPhaseProvider } from "../context/dayCycleContext"

export default function App() {
  return (
    <DayPhaseProvider>
      <Router>
        <Routes>
          <Route path="/" element={<SlimeGame />} />
        </Routes>
      </Router>
    </DayPhaseProvider>
  )
}
