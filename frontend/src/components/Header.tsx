import { Navbar, Container, Nav, Button, NavDropdown } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, ShieldCheck, Sun, Moon, Settings, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdmin') === 'true');
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.setAttribute('data-bs-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        setIsAdmin(localStorage.getItem('isAdmin') === 'true');
    }, [location.pathname]);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    const handleLogout = () => {
        localStorage.removeItem('isAdmin');
        setIsAdmin(false);
        navigate('/');
    };

    return (
        <Navbar 
            expand="lg" 
            sticky="top" 
            className={`header-premium transition-all ${scrolled ? 'py-2 shadow-sm' : 'py-3'}`}
        >
            <Container>
                <Navbar.Brand 
                    onClick={() => navigate('/')} 
                    className="d-flex align-items-center gap-2 border-0 p-0"
                    style={{ cursor: 'pointer' }}
                >
                    <div className="brand-icon-wrapper shadow-sm">
                        <BarChart3 size={22} className="text-white" />
                    </div>
                    <span className="fw-bold h4 mb-0 brand-text" style={{ letterSpacing: '-1px' }}>
                        YouthPulse
                    </span>
                </Navbar.Brand>

                <Navbar.Toggle aria-controls="main-navbar-nav" className="border-0 shadow-none" />
                
                <Navbar.Collapse id="main-navbar-nav">
                    <Nav className="mx-auto gap-1 gap-lg-4 mt-3 mt-lg-0">
                        <Nav.Link 
                            onClick={() => navigate('/')}
                            className={`nav-link-premium ${location.pathname === '/' ? 'active' : ''}`}
                        >
                            Головна
                        </Nav.Link>
                        <Nav.Link 
                            onClick={() => navigate('/surveys')}
                            className={`nav-link-premium ${location.pathname === '/surveys' ? 'active' : ''}`}
                        >
                            Дослідження
                        </Nav.Link>
                    </Nav>

                    <Nav className="align-items-center gap-2 mt-3 mt-lg-0">
                        <Button 
                            variant="link" 
                            className="theme-toggle-btn border-0 p-2 text-secondary"
                            onClick={toggleTheme}
                            title={theme === 'light' ? 'Темна тема' : 'Світла тема'}
                        >
                            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        </Button>

                        {isAdmin ? (
                            <NavDropdown 
                                title={
                                    <div className="admin-pill-badge d-flex align-items-center gap-2">
                                        <ShieldCheck size={16} />
                                        <span>Адмін</span>
                                    </div>
                                } 
                                id="admin-dropdown"
                                align="end"
                                className="nav-dropdown-premium"
                            >
                                <NavDropdown.Item onClick={() => navigate('/admin')} className="d-flex align-items-center gap-2 py-2">
                                    <Settings size={16} className="text-muted" /> 
                                    <span>Панель керування</span>
                                </NavDropdown.Item>
                                <NavDropdown.Divider />
                                <NavDropdown.Item onClick={handleLogout} className="d-flex align-items-center gap-2 py-2 text-danger">
                                    <LogOut size={16} /> 
                                    <span>Вийти</span>
                                </NavDropdown.Item>
                            </NavDropdown>
                        ) : null}
                    </Nav>
                </Navbar.Collapse>
            </Container>

            <style>{`
                .header-premium {
                    background: var(--nav-bg);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    border-bottom: 1px solid var(--border-color);
                    z-index: 1000;
                }
                .brand-icon-wrapper {
                    background: var(--primary-color);
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 10px;
                    transition: transform 0.3s ease;
                }
                .navbar-brand:hover .brand-icon-wrapper {
                    transform: rotate(-10deg) scale(1.1);
                }
                .brand-text {
                    color: var(--text-primary);
                    transition: color 0.3s ease;
                }
                .nav-link-premium {
                    color: var(--text-secondary) !important;
                    font-weight: 500;
                    padding: 8px 16px !important;
                    border-radius: 12px;
                    transition: all 0.2s ease;
                    font-size: 0.95rem;
                }
                .nav-link-premium:hover {
                    color: var(--primary-color) !important;
                    background: rgba(98, 0, 234, 0.05);
                }
                .nav-link-premium.active {
                    color: var(--primary-color) !important;
                    background: rgba(98, 0, 234, 0.08);
                    font-weight: 600;
                }
                .theme-toggle-btn {
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 12px;
                    transition: background 0.2s ease;
                }
                .theme-toggle-btn:hover {
                    background: var(--bg-color);
                    color: var(--primary-color) !important;
                }
                .admin-pill-badge {
                    background: rgba(98, 0, 234, 0.1);
                    color: var(--primary-color);
                    padding: 6px 16px;
                    border-radius: 20px;
                    font-weight: 600;
                    font-size: 0.85rem;
                    border: 1px solid rgba(98, 0, 234, 0.1);
                    transition: all 0.2s ease;
                }
                .admin-dropdown:hover .admin-pill-badge {
                    background: var(--primary-color);
                    color: white;
                }
                .dropdown-toggle::after {
                    display: none;
                }
                .nav-dropdown-premium .dropdown-menu {
                    border-radius: 16px;
                    padding: 8px;
                    border: 1px solid var(--border-color);
                    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                    margin-top: 10px;
                }
                .nav-dropdown-premium .dropdown-item {
                    border-radius: 10px;
                    font-weight: 500;
                    font-size: 0.9rem;
                    transition: all 0.2s ease;
                }
                .nav-dropdown-premium .dropdown-item:hover {
                    background: var(--bg-color);
                    padding-left: 20px;
                }
            `}</style>
        </Navbar>
    );
};

export default Header;


