import { useEffect, useState } from 'react';
import { getSurveys } from '../api';
import { Survey } from '../types';
import { Card, Button, Row, Col, Form, Badge, Spinner, Alert, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Filter, Calendar, Building2, Search, ChevronRight, MessageSquare, Sparkles, SortDesc } from 'lucide-react';

const HomePage = () => {
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Всі');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'participants_desc', 'participants_asc', 'title'
    const navigate = useNavigate();

    useEffect(() => {
        getSurveys()
            .then(data => setSurveys(data))
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const categories = ['Всі', ...new Set(surveys.map(s => s.category || 'Інше'))];
    
    const processedSurveys = surveys
        .filter(s => {
            const matchesCategory = selectedCategory === 'Всі' || s.category === selectedCategory;
            const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                 (s.organization || '').toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch;
        })
        .sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
            if (sortBy === 'oldest') return new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime();
            if (sortBy === 'participants_desc') return (b.participants || 0) - (a.participants || 0);
            if (sortBy === 'participants_asc') return (a.participants || 0) - (b.participants || 0);
            if (sortBy === 'title') return a.title.localeCompare(b.title);
            return 0;
        });

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
            <Spinner animation="border" variant="primary" />
        </div>
    );
    
    if (error) return (
        <Container className="mt-5">
            <Alert variant="danger" className="rounded-4 border-0 shadow-sm">
                <h4 className="fw-bold">Помилка з'єднання</h4>
                <p className="mb-0">{error}</p>
            </Alert>
        </Container>
    );

    return (
        <div className="fade-in-up mt-4 mt-lg-5 pb-5">
            {/* Elegant Search & Title Bar */}
            <div className="mb-5 p-4 p-lg-5 rounded-5 shadow-sm border section-header-premium">
                <Row className="align-items-center g-4">
                    <Col lg={7}>
                        <div className="d-flex align-items-center gap-3 mb-2">
                            <Badge bg="primary" className="bg-opacity-10 text-primary px-3 py-1 rounded-pill extra-small fw-bold text-uppercase tracking-wider">
                                Стрічка
                            </Badge>
                            <div className="text-muted extra-small fw-medium d-flex align-items-center gap-1">
                                <Sparkles size={14} className="text-primary opacity-50" />
                                Оновлено щойно
                            </div>
                        </div>
                        <h1 className="display-6 fw-bold mb-0 text-dark">
                            Дослідження <span className="text-primary">молоді</span>
                        </h1>
                        <p className="text-secondary mt-2 mb-0 pe-lg-5">
                            Відкрийте для себе актуальну аналітику та результати опитувань нашої спільноти.
                        </p>
                    </Col>
                    <Col lg={5}>
                        <div className="search-box-wrapper position-relative p-1 rounded-pill bg-light border shadow-inner">
                            <div className="d-flex align-items-center">
                                <Search className="ms-3 text-muted opacity-50" size={20} />
                                <Form.Control 
                                    type="text" 
                                    placeholder="Пошук дослідження..." 
                                    className="rounded-pill border-0 bg-transparent shadow-none py-2 px-3"
                                    style={{ fontSize: '1rem', fontWeight: '500' }}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </Col>
                </Row>
            </div>

            <Row className="g-4">
                {/* Sidebar - Sticky on Desktop */}
                <Col lg={3}>
                    <div className="sidebar-sticky">
                        <Card className="material-card border-0 p-3 mb-4 shadow-sm">
                            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2 text-primary">
                                <Filter size={18} />
                                Фільтрація
                            </h6>
                            
                            <div className="mb-4">
                                <Form.Label className="small text-muted fw-bold text-uppercase mb-2" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                                    Категорія
                                </Form.Label>
                                <Form.Select 
                                    value={selectedCategory} 
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="rounded-3 border-0 bg-light shadow-none fw-medium py-2"
                                    style={{ cursor: 'pointer', fontSize: '0.9rem' }}
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>
                                            {cat === 'Всі' ? '📁 Всі категорії' : cat}
                                        </option>
                                    ))}
                                </Form.Select>
                            </div>

                            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2 text-primary">
                                <SortDesc size={18} />
                                Сортування
                            </h6>

                            <div className="mb-2">
                                <Form.Label className="small text-muted fw-bold text-uppercase mb-2" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                                    Порядок відображення
                                </Form.Label>
                                <Form.Select 
                                    value={sortBy} 
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="rounded-3 border-0 bg-light shadow-none fw-medium py-2"
                                    style={{ cursor: 'pointer', fontSize: '0.9rem' }}
                                >
                                    <option value="newest">🕒 Спочатку нові</option>
                                    <option value="oldest">⏳ Спочатку старі</option>
                                    <option value="participants_desc">👥 Багато учасників</option>
                                    <option value="participants_asc">👤 Мало учасників</option>
                                    <option value="title">🔤 За назвою (А-Я)</option>
                                </Form.Select>
                            </div>
                        </Card>

                        <Card className="material-card border-0 bg-primary text-white p-3 shadow-sm">
                            <div className="d-flex align-items-center gap-2 mb-2">
                                <MessageSquare size={20} />
                                <span className="fw-bold">Статистика</span>
                            </div>
                            <small className="opacity-75">Всього опитувань проаналізовано: <strong>{surveys.length}</strong></small>
                        </Card>
                    </div>
                </Col>

                {/* Main Feed */}
                <Col lg={9}>
                    {processedSurveys.length === 0 ? (
                        <Card className="material-card border-0 p-5 text-center">
                            <h5 className="text-muted mb-0">За вашим запитом нічого не знайдено 🔍</h5>
                        </Card>
                    ) : (
                        <div className="d-flex flex-column gap-3">
                            {processedSurveys.map((survey, index) => (
                                <Card 
                                    key={survey.id || index} 
                                    className="material-card border-0 overflow-hidden feed-card position-relative"
                                    onClick={() => navigate(`/dashboard/${survey.id}`)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="accent-line"></div>
                                    <Card.Body className="p-3 p-lg-4">
                                        {/* Header Row: Title & Stats */}
                                        <Row className="align-items-start g-3 mb-3">
                                            <Col sm={9}>
                                                <div className="d-flex flex-wrap gap-2 mb-2">
                                                    <Badge bg="primary" className="bg-opacity-10 text-primary px-2 py-1 rounded-pill fw-semibold border border-primary border-opacity-10 small">
                                                        {survey.category || 'Загальне'}
                                                    </Badge>
                                                    <div className="d-flex align-items-center gap-1 px-2 py-1 bg-light rounded-pill text-muted extra-small">
                                                        <Calendar size={12} />
                                                        {survey.date || 'Нещодавно'}
                                                    </div>
                                                </div>
                                                <h4 className="fw-bold mb-0 survey-title transition-all" style={{ fontSize: '1.2rem' }}>
                                                    {survey.title}
                                                </h4>
                                            </Col>
                                            
                                            <Col sm={3} className="text-sm-end mt-2 mt-sm-0">
                                                <div className="h3 fw-bold text-primary mb-0">{survey.participants}</div>
                                                <div className="text-muted extra-small fw-bold text-uppercase tracking-wider">Респондентів</div>
                                            </Col>
                                        </Row>

                                        {/* Compact Description */}
                                        {survey.ai_description && (
                                            <div className="ai-desc-box p-3 rounded-3 bg-light border-start border-primary border-4 mb-3">
                                                <p className="text-secondary mb-0 text-feed-truncate" style={{ fontSize: '0.9rem', maxWidth: '100%' }}>
                                                    <Sparkles size={14} className="text-primary me-2 mb-1" />
                                                    {survey.ai_description}
                                                </p>
                                            </div>
                                        )}

                                        {/* Footer Row: Organization & Button */}
                                        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mt-auto pt-3 border-top gap-2">
                                            <div className="d-inline-flex align-items-center gap-2 px-2 py-1 bg-light rounded-2 text-secondary small border" style={{ fontSize: '0.85rem' }}>
                                                <Building2 size={14} className="text-primary" />
                                                {survey.organization || 'Приватна ініціатива'}
                                            </div>
                                            
                                            <Button 
                                                variant="primary" 
                                                size="sm"
                                                className="rounded-pill px-4 py-2 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2 results-btn"
                                            >
                                                Результати
                                                <ChevronRight size={16} className="btn-icon" />
                                            </Button>
                                        </div>
                                    </Card.Body>
                                </Card>
                            ))}
                        </div>
                    )}
                </Col>
            </Row>

            <style>{`
                .sidebar-sticky {
                    position: sticky;
                    top: 100px;
                    z-index: 10;
                }
                .section-header-premium {
                    background: var(--surface-color);
                    border-color: var(--border-color) !important;
                }
                .search-box-wrapper {
                    background: var(--bg-color) !important;
                    border-color: var(--border-color) !important;
                }
                .extra-small { font-size: 0.75rem; }
                .text-feed-truncate {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    line-height: 1.5;
                    font-size: 0.9rem;
                }
                .feed-card {
                    background: var(--surface-color) !important;
                    transition: all 0.3s ease !important;
                    border: 1px solid var(--border-color) !important;
                    border-radius: 24px !important;
                }
                .accent-line {
                    position: absolute;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    width: 4px;
                    background: var(--border-color);
                    transition: all 0.3s ease;
                }
                .feed-card:hover {
                    box-shadow: 0 15px 35px rgba(0,0,0,0.05) !important;
                    border-color: var(--primary-light) !important;
                    transform: translateX(5px);
                }
                .feed-card:hover .accent-line {
                    background: var(--primary-color);
                    width: 6px;
                }
                .feed-card:hover .survey-title {
                    color: var(--primary-color);
                }
                .ai-desc-box {
                    background-color: rgba(98, 0, 234, 0.03) !important;
                }
                [data-theme='dark'] .ai-desc-box {
                    background-color: rgba(187, 134, 252, 0.05) !important;
                }
                .results-btn {
                    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
                }
                .btn-icon {
                    transition: transform 0.3s ease;
                }
                .feed-card:hover .btn-icon {
                    transform: translateX(4px);
                }
                .shadow-inner {
                    box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
                }
            `}</style>
        </div>
    );
};

export default HomePage;
