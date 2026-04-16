import { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Button, Card, Badge, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { getSurveys } from '../api';
import { Survey } from '../types';
import { 
    BarChart3, 
    Sparkles, 
    ShieldCheck, 
    ArrowRight, 
    Zap, 
    PieChart, 
    MousePointer2,
    Users,
    Calendar,
    Building2,
    ChevronRight,
    FileUp,
    BrainCircuit,
    LineChart
} from 'lucide-react';

const LandingPage = () => {
    const navigate = useNavigate();
    const [latestSurveys, setLatestSurveys] = useState<Survey[]>([]);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        getSurveys()
            .then(data => {
                const sorted = [...data].sort((a, b) => 
                    new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
                );
                setLatestSurveys(sorted.slice(0, 6));
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    // Auto-scroll logic
    useEffect(() => {
        if (loading || latestSurveys.length === 0 || isHovered) return;

        const interval = setInterval(() => {
            if (scrollRef.current) {
                const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
                const maxScroll = scrollWidth - clientWidth;
                
                if (scrollLeft >= maxScroll - 10) {
                    scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    scrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
                }
            }
        }, 4000);

        return () => clearInterval(interval);
    }, [loading, latestSurveys, isHovered]);

    return (
        <div className="landing-page">
            {/* Hero Section */}
            <section className="py-5 py-lg-10 position-relative overflow-hidden mb-5">
                <div className="position-absolute top-0 end-0 w-50 h-100 d-none d-lg-block" style={{ 
                    background: 'radial-gradient(circle at 70% 30%, var(--primary-light) 0%, transparent 60%)', 
                    opacity: 0.1,
                    zIndex: -1
                }}></div>
                
                <Container>
                    <Row className="align-items-center min-vh-75">
                        <Col lg={6} className="text-start fade-in-up">
                            <h1 className="display-3 fw-bold mb-4 text-dark" style={{ letterSpacing: '-2px', lineHeight: '1.1' }}>
                                Глибока аналітика <span className="text-primary">результатів моніторингів</span>
                            </h1>
                            <p className="lead text-secondary mb-5 fs-4" style={{ maxWidth: '500px' }}>
                                YouthPulse поєднує реальні дані та потужність штучного інтелекту для глибокого аналізу різних досліджень.
                            </p>
                            <div className="d-flex flex-column flex-sm-row gap-3">
                                <Button 
                                    variant="primary" 
                                    className="px-4 py-2 rounded-pill fw-semibold shadow-sm d-flex align-items-center justify-content-center gap-2"
                                    style={{ fontSize: '0.95rem' }}
                                    onClick={() => navigate('/surveys')}
                                >
                                    Переглянути опитування
                                    <ArrowRight size={18} />
                                </Button>
                                <Button 
                                    variant="outline-primary" 
                                    className="px-4 py-2 rounded-pill fw-semibold d-flex align-items-center justify-content-center gap-2"
                                    style={{ fontSize: '0.95rem' }}
                                    onClick={() => document.getElementById('workflow')?.scrollIntoView({ behavior: 'smooth' })}
                                >
                                    Як це працює?
                                </Button>
                            </div>
                        </Col>
                        <Col lg={6} className="d-none d-lg-block position-relative">
                            <div className="position-relative p-5">
                                <div className="bg-primary bg-opacity-10 rounded-5 p-5 animate-pulse">
                                    <BarChart3 size={260} className="text-primary opacity-25" />
                                </div>
                                <Card className="material-card border-0 shadow-lg position-absolute top-0 start-0 p-3 translate-middle-y mt-5">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="bg-success bg-opacity-10 p-2 rounded-circle">
                                            <Zap size={24} className="text-success" />
                                        </div>
                                        <div>
                                            <div className="fw-bold small">AI Аналіз</div>
                                            <div className="text-muted" style={{ fontSize: '10px' }}>Миттєві інсайти</div>
                                        </div>
                                    </div>
                                </Card>
                                <Card className="material-card border-0 shadow-lg position-absolute bottom-0 end-0 p-3 translate-middle-y mb-5">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="bg-primary bg-opacity-10 p-2 rounded-circle">
                                            <Users size={24} className="text-primary" />
                                        </div>
                                        <div>
                                            <div className="fw-bold small">Актуальні дані</div>
                                            <div className="text-muted" style={{ fontSize: '10px' }}>Реальний час</div>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* Latest Surveys Section - REDESIGNED */}
            <section className="py-5 mb-5 overflow-hidden position-relative section-surveys-new">
                <div className="surveys-bg-blob"></div>
                <Container>
                    <div className="text-center mb-5 position-relative z-index-1">
                        <Badge bg="primary" className="mb-3 px-4 py-2 rounded-pill bg-opacity-10 text-primary fw-bold text-uppercase tracking-wider" style={{ fontSize: '0.75rem' }}>
                            Свіжа аналітика
                        </Badge>
                        <h2 className="display-5 fw-bold mb-3">Останні дослідження</h2>
                        <div className="d-flex justify-content-center">
                            <Button 
                                variant="link" 
                                className="text-primary fw-bold text-decoration-none d-flex align-items-center gap-1 hover-translate-x"
                                onClick={() => navigate('/surveys')}
                            >
                                Переглянути всі опитування <ChevronRight size={18} />
                            </Button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                        </div>
                    ) : (
                        <div 
                            className="survey-gallery-container position-relative z-index-1"
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                        >
                            <div className="survey-gallery-viewport" ref={scrollRef}>
                                {latestSurveys.map((survey) => (
                                    <div className="survey-gallery-item" key={survey.id}>
                                        <Card 
                                            className="survey-premium-card border-0 cursor-pointer"
                                            onClick={() => navigate(`/dashboard/${survey.id}`)}
                                        >
                                            <div className="card-top-line"></div>
                                            <Card.Body className="p-4 p-xl-5 d-flex flex-column">
                                                <div className="d-flex justify-content-between align-items-center mb-4">
                                                    <Badge bg="primary" className="bg-opacity-10 text-primary px-3 py-2 rounded-pill small border border-primary border-opacity-10">
                                                        {survey.category || 'Загальне'}
                                                    </Badge>
                                                    <div className="text-muted extra-small d-flex align-items-center gap-2">
                                                        <Calendar size={14} className="text-primary opacity-50" />
                                                        {survey.date}
                                                    </div>
                                                </div>
                                                
                                                <h4 className="fw-bold mb-3 survey-card-title">
                                                    {survey.title}
                                                </h4>
                                                
                                                <div className="flex-grow-1 mb-4">
                                                    <div className="description-expand-container">
                                                        <p className="text-secondary small mb-0" style={{ lineHeight: '1.6' }}>
                                                            {survey.ai_description || 'Детальний аналіз та візуалізація результатів моніторингів та опитувань щодо актуальних соціальних тем.'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="pt-4 border-top d-flex justify-content-between align-items-center mt-auto">
                                                    <div className="d-flex align-items-center gap-2 text-muted small fw-medium">
                                                        <Building2 size={16} className="text-primary" />
                                                        <span className="text-truncate" style={{maxWidth: '140px'}}>{survey.organization}</span>
                                                    </div>
                                                    <div className="d-flex align-items-center gap-2 text-primary fw-bold">
                                                        <Users size={18} />
                                                        <span>{survey.participants}</span>
                                                    </div>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </Container>
            </section>

            {/* Workflow Section */}
            <section id="workflow" className="py-5 mb-5 position-relative overflow-hidden">
                <Container>
                    <div className="text-center mb-10">
                        <Badge bg="primary" className="mb-3 px-4 py-2 rounded-pill bg-opacity-10 text-primary fw-bold text-uppercase tracking-wider" style={{ fontSize: '0.75rem' }}>
                            Процес аналітики
                        </Badge>
                        <h2 className="display-5 fw-bold mb-3">Три кроки до інсайтів</h2>
                        <p className="text-muted mx-auto" style={{ maxWidth: '500px' }}>Від сирих даних до готових управлінських рішень за лічені хвилини</p>
                    </div>

                    <div className="workflow-steps-path mt-5 py-4">
                        <Row className="g-4 justify-content-center">
                            {[
                                { 
                                    step: "01", 
                                    icon: <FileUp size={36} />, 
                                    title: "Завантаження", 
                                    desc: "Імпортуйте Excel або CSV файли з результатами опитувань у форматах CSV або Excel." 
                                },
                                { 
                                    step: "02", 
                                    icon: <BrainCircuit size={36} />, 
                                    title: "AI Обробка", 
                                    desc: "Алгоритми YouthPulse аналізують кожну відповідь та формують логічні висновки." 
                                },
                                { 
                                    step: "03", 
                                    icon: <LineChart size={36} />, 
                                    title: "Результат", 
                                    desc: "Отримуйте інтерактивні дашборди та професійні PDF-звіти для презентацій." 
                                }
                            ].map((item, i) => (
                                <Col lg={4} key={i}>
                                    <div className="workflow-step-new">
                                        <div className="step-badge-new">{item.step}</div>
                                        <div className="step-content-new shadow-sm">
                                            <div className="step-icon-new">
                                                {item.icon}
                                            </div>
                                            <h4 className="fw-bold mb-3">{item.title}</h4>
                                            <p className="text-secondary mb-0 small">{item.desc}</p>
                                        </div>
                                        {i < 2 && <div className="step-arrow-new d-none d-lg-block"><ChevronRight size={32} /></div>}
                                    </div>
                                </Col>
                            ))}
                        </Row>
                    </div>
                </Container>
            </section>

            {/* Features Section */}
            <section className="py-5 mb-5 position-relative">
                <div className="features-bg-blob"></div>
                <Container className="py-5">
                    <div className="text-center mb-5 position-relative z-index-1">
                        <Badge bg="primary" className="mb-3 px-4 py-2 rounded-pill bg-opacity-10 text-primary fw-bold text-uppercase tracking-wider" style={{ fontSize: '0.75rem' }}>
                            Чому ми?
                        </Badge>
                        <h2 className="display-5 fw-bold mb-3">Можливості платформи</h2>
                        <p className="text-muted mx-auto" style={{ maxWidth: '600px' }}>
                            Поєднання глибокої соціологічної експертизи та передових технологій штучного інтелекту.
                        </p>
                    </div>
                    
                    <Row className="g-4 position-relative z-index-1">
                        {[
                            {
                                icon: <PieChart size={36} />,
                                title: "Наочна візуалізація",
                                text: "Автоматична генерація інтерактивних графіків для кожного питання. Більше не потрібно будувати діаграми вручну."
                            },
                            {
                                icon: <Sparkles size={36} />,
                                title: "Інтелектуальні висновки",
                                text: "AI аналізує масиви даних та формує лаконічні резюме, підсвічуючи найважливіші тренди та аномалії."
                            },
                            {
                                icon: <ShieldCheck size={36} />,
                                title: "Професійні звіти",
                                text: "Експортуйте результати у форматі PDF одним кліком. Готові документи для презентацій та офіційних звітів."
                            },
                            {
                                icon: <MousePointer2 size={36} />,
                                title: "Простота використання",
                                text: "Інтуїтивно зрозумілий інтерфейс, що не потребує спеціальних технічних навичок для роботи з даними."
                            }
                        ].map((item, i) => (
                            <Col md={6} key={i}>
                                <div className="feature-card-new h-100 p-4 p-lg-5">
                                    <div className="feature-icon-box-new mb-4">
                                        {item.icon}
                                    </div>
                                    <h4 className="fw-bold mb-3">{item.title}</h4>
                                    <p className="text-secondary mb-0" style={{ lineHeight: '1.7', fontSize: '1.05rem' }}>
                                        {item.text}
                                    </p>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </Container>
            </section>


            <style>{`
                .min-vh-75 { min-height: 75vh; }
                .z-index-1 { z-index: 1; }
                .extra-small { font-size: 0.75rem; }
                
                .animate-pulse {
                    animation: pulse 3s infinite ease-in-out;
                }
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 0.8; }
                    50% { transform: scale(1.05); opacity: 1; }
                    100% { transform: scale(1); opacity: 0.8; }
                }

                .hover-translate-x {
                    transition: transform 0.3s ease;
                }
                .hover-translate-x:hover {
                    transform: translateX(5px);
                }

                /* Gallery Styles */
                .survey-gallery-container {
                    position: relative;
                    margin: 0 -10px;
                }
                .survey-gallery-viewport {
                    display: flex;
                    overflow-x: auto;
                    scroll-snap-type: x mandatory;
                    gap: 20px;
                    padding: 20px 10px 100px 10px; 
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                    scroll-behavior: smooth;
                    align-items: flex-start;
                }
                .survey-gallery-viewport::-webkit-scrollbar {
                    display: none;
                }
                .survey-gallery-item {
                    flex: 0 0 calc(33.333% - 14px);
                    min-width: 300px;
                    scroll-snap-align: center;
                    display: block;
                }
                @media (max-width: 992px) {
                    .survey-gallery-item { flex: 0 0 70%; }
                }
                @media (max-width: 576px) {
                    .survey-gallery-item { flex: 0 0 85%; }
                }

                /* Premium Card Styles Redesign */
                .survey-premium-card {
                    background: var(--surface-color);
                    border-radius: 40px !important;
                    overflow: hidden;
                    position: relative;
                    transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
                    z-index: 1;
                    height: auto !important;
                    align-self: flex-start;
                    border: 1px solid var(--border-color) !important;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.02) !important;
                }
                .card-top-line {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 6px;
                    background: linear-gradient(90deg, var(--primary-color), var(--primary-light));
                    opacity: 0.4;
                    transition: all 0.3s ease;
                }
                .survey-premium-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 25px 50px rgba(98, 0, 234, 0.1) !important;
                    border-color: var(--primary-light) !important;
                    z-index: 10;
                }
                .survey-premium-card:hover .card-top-line {
                    opacity: 1;
                    height: 8px;
                }
                .survey-card-title {
                    transition: color 0.3s ease;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    min-height: 3.2rem;
                    line-height: 1.4;
                }
                .survey-premium-card:hover .survey-card-title {
                    color: var(--primary-color);
                }
                
                /* Description Expansion Logic */
                .description-expand-container {
                    max-height: 4.8rem; 
                    overflow: hidden;
                    transition: max-height 0.8s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .survey-premium-card:hover .description-expand-container {
                    max-height: 1000px;
                }

                .surveys-bg-blob {
                    position: absolute;
                    top: 10%;
                    right: -5%;
                    width: 35%;
                    height: 50%;
                    background: radial-gradient(circle, var(--primary-light) 0%, transparent 70%);
                    opacity: 0.04;
                    filter: blur(60px);
                    pointer-events: none;
                }
                .section-surveys-new {
                    background: rgba(98, 0, 234, 0.01);
                }

                /* WORKFLOW NEW STYLES */
                .workflow-step-new {
                    position: relative;
                    padding-top: 20px;
                    text-align: center;
                }
                .step-badge-new {
                    position: absolute;
                    top: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    background: var(--primary-color);
                    color: white;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    z-index: 3;
                    box-shadow: 0 4px 10px rgba(98, 0, 234, 0.3);
                }
                .step-content-new {
                    background: var(--surface-color);
                    padding: 50px 30px 30px;
                    border-radius: 30px;
                    border: 1px solid var(--border-color);
                    transition: all 0.3s ease;
                    height: 100%;
                }
                .step-icon-new {
                    color: var(--primary-color);
                    margin-bottom: 20px;
                    background: rgba(98, 0, 234, 0.05);
                    width: 80px;
                    height: 80px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 20px;
                    margin-left: auto;
                    margin-right: auto;
                    transition: all 0.3s ease;
                }
                .workflow-step-new:hover .step-content-new {
                    transform: translateY(-10px);
                    box-shadow: 0 15px 35px rgba(0,0,0,0.08) !important;
                    border-color: var(--primary-light);
                }
                .workflow-step-new:hover .step-icon-new {
                    background: var(--primary-color);
                    color: white;
                    transform: rotate(10deg);
                }
                .step-arrow-new {
                    position: absolute;
                    top: 50%;
                    right: -20px;
                    transform: translateY(-50%);
                    color: var(--primary-light);
                    opacity: 0.5;
                    z-index: 1;
                }

                /* FEATURES NEW STYLES */
                .feature-card-new {
                    background: var(--surface-color);
                    border-radius: 40px;
                    border: 1px solid var(--border-color);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.02);
                    transition: all 0.4s ease;
                    position: relative;
                    overflow: hidden;
                }
                .feature-card-new:hover {
                    transform: translateY(-10px);
                    box-shadow: 0 20px 50px rgba(0,0,0,0.06);
                    border-color: var(--primary-light);
                }
                .feature-icon-box-new {
                    width: 70px;
                    height: 70px;
                    background: var(--primary-color);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 22px;
                    box-shadow: 0 10px 20px rgba(98, 0, 234, 0.2);
                    transition: all 0.3s ease;
                }
                .feature-card-new:hover .feature-icon-box-new {
                    transform: scale(1.1) rotate(-5deg);
                    background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
                }
                .features-bg-blob {
                    position: absolute;
                    top: 20%;
                    left: -10%;
                    width: 40%;
                    height: 60%;
                    background: radial-gradient(circle, var(--primary-light) 0%, transparent 70%);
                    opacity: 0.05;
                    filter: blur(80px);
                    pointer-events: none;
                }
            `}</style>
        </div>
    );
};

export default LandingPage;
