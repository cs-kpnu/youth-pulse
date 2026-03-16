import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import AutoScrollToTop from './components/AutoScrollToTop';
import { Container } from 'react-bootstrap';

function App() {
  return (
    <Router>
        <AutoScrollToTop /> 
        <div className="d-flex flex-column min-vh-100">
            <Header />
            <Container className="flex-grow-1 pb-5">
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/surveys" element={<HomePage />} />
                    <Route path="/dashboard/:id" element={<DashboardPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/admin" element={<AdminPage />} />
                </Routes>
            </Container>
            <Footer />
            <ScrollToTop />
        </div>
    </Router>
  );
}

export default App;