import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import './styles.css'
import TeacherHome from './pages/TeacherHome.jsx'
import CreateClass from './pages/CreateClass.jsx'
import ClassRoom from './pages/ClassRoom.jsx'
import SeatChart from './pages/SeatChart.jsx'
import Student from './pages/Student.jsx'
import StudentRoom from './pages/StudentRoom.jsx'
import { applyTheme, currentTheme } from './lib/theme.js'

applyTheme(currentTheme())

// 홈 화면 바로가기(PWA) — 서비스 워커가 있어야 크롬이 설치를 허용한다.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* 설치 안내만 못 뜰 뿐 앱 동작에는 지장이 없다 */
    })
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<TeacherHome />} />
        <Route path="/class/new" element={<CreateClass />} />
        <Route path="/class/:code" element={<ClassRoom />} />
        <Route path="/class/:code/seats" element={<SeatChart />} />
        <Route path="/s/:code" element={<Student />} />
        <Route path="/s/:code/room" element={<StudentRoom />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  </StrictMode>,
)
