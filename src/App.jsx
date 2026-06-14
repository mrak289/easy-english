import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ReadingRecallPage from './exercises/reading-recall/ReadingRecallPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/reading-recall" element={<ReadingRecallPage />} />
      </Routes>
    </BrowserRouter>
  );
}
