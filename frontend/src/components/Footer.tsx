import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { 
    Github, 
    Mail, 
    Globe, 
    ShieldCheck, 
    BarChart3,
    Heart
} from 'lucide-react';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer-new mt-auto pt-5 pb-4 border-top">
            <Container>
                <Row className="gy-5">
                    <Col lg={5} md={12}>
                        <div className="footer-brand mb-4">
                            <div className="d-flex align-items-center gap-2 text-primary mb-3">
                                <BarChart3 size={28} />
                                <span className="h4 fw-bold mb-0" style={{ letterSpacing: '-1px' }}>YouthPulse</span>
                            </div>
                            <p className="text-secondary pe-lg-5" style={{ lineHeight: '1.7', maxWidth: '400px' }}>
                                Платформа інтелектуального аналізу соціальних трендів. Ми перетворюємо результати опитувань у змістовні інсайти для глибокого розуміння даних.
                            </p>
                            <div className="d-flex gap-3 mt-4">
                                <a href="#" className="social-link shadow-sm"><Github size={18} /></a>
                                <a href="mailto:support@youthpulse.ua" className="social-link shadow-sm"><Mail size={18} /></a>
                                <a href="#" className="social-link shadow-sm"><Globe size={18} /></a>
                            </div>
                        </div>
                    </Col>

                    <Col lg={2} md={4} sm={6}>
                        <h6 className="fw-bold text-uppercase mb-4 small tracking-wider">Навігація</h6>
                        <ul className="list-unstyled footer-links">
                            <li><Link to="/">Головна</Link></li>
                            <li><Link to="/surveys">Всі опитування</Link></li>
                            <li><Link to="/login">Панель управління</Link></li>
                        </ul>
                    </Col>

                    <Col lg={2} md={4} sm={6}>
                        <h6 className="fw-bold text-uppercase mb-4 small tracking-wider">Платформа</h6>
                        <ul className="list-unstyled footer-links">
                            <li><a href="#workflow">Як це працює</a></li>
                            <li><a href="#">Документація</a></li>
                            <li><a href="#">Конфіденційність</a></li>
                        </ul>
                    </Col>

                    <Col lg={3} md={4}>
                        <h6 className="fw-bold text-uppercase mb-4 small tracking-wider">Статус системи</h6>
                        <div className="status-card p-3 rounded-4 bg-opacity-10 bg-success border border-success border-opacity-10 d-flex align-items-center gap-3">
                            <div className="status-dot animate-pulse"></div>
                            <div className="small">
                                <div className="fw-bold text-success">Системи активні</div>
                                <div className="text-secondary extra-small">AI Модулі працюють в штатному режимі</div>
                            </div>
                        </div>
                    </Col>
                </Row>

                <div className="border-top mt-5 pt-4 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 text-muted extra-small fw-medium">
                    <div className="d-flex align-items-center gap-2">
                        <ShieldCheck size={14} className="text-success" />
                        <span>© {currentYear} YouthPulse Analytics. Усі права захищено.</span>
                    </div>
                    <div className="d-flex align-items-center gap-1">
                        <span>Зроблено з</span>
                        <Heart size={12} className="text-danger fill-current" />
                        <span>для ефективної аналітики</span>
                    </div>
                </div>
            </Container>

            <style>{`
                .footer-new {
                    background: var(--surface-color);
                    transition: all 0.3s ease;
                }
                .tracking-wider { letter-spacing: 0.1em; }
                .extra-small { font-size: 0.75rem; }
                .fill-current { fill: currentColor; }

                .social-link {
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 12px;
                    background: var(--bg-color);
                    color: var(--text-secondary);
                    text-decoration: none;
                    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    border: 1px solid var(--border-color);
                }
                .social-link:hover {
                    background: var(--primary-color);
                    color: white;
                    transform: translateY(-5px);
                    box-shadow: 0 10px 20px rgba(98, 0, 234, 0.2) !important;
                }

                .footer-links li {
                    margin-bottom: 12px;
                }
                .footer-links a {
                    color: var(--text-secondary);
                    text-decoration: none;
                    transition: all 0.2s ease;
                    font-size: 0.95rem;
                }
                .footer-links a:hover {
                    color: var(--primary-color);
                    padding-left: 5px;
                }

                .status-dot {
                    width: 10px;
                    height: 10px;
                    background: #28a745;
                    border-radius: 50%;
                    box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.4);
                }
                
                @keyframes pulse-dot {
                    0% { box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.4); }
                    70% { box-shadow: 0 0 0 8px rgba(40, 167, 69, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(40, 167, 69, 0); }
                }
                .status-dot.animate-pulse {
                    animation: pulse-dot 2s infinite;
                }
            `}</style>
        </footer>
    );
};

export default Footer;
