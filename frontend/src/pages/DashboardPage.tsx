import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSurvey, exportSurveyPdf } from '../api';
import { Survey, Question } from '../types';
import { Button, Card, Row, Col, Spinner, Alert, Badge } from 'react-bootstrap';
import Plot from 'react-plotly.js';
import { ArrowLeft, Sparkles, PieChart, BarChart2, AlignLeft, Calendar, Building2, Users, Hash, CheckCircle2, ArrowUp, Download } from 'lucide-react';


const DashboardPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [survey, setSurvey] = useState<Survey | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeQuestion, setActiveQuestion] = useState<number>(0);
    const [exportingPdf, setExportingPdf] = useState(false);

    const observer = useRef<IntersectionObserver | null>(null);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    useEffect(() => {
        if (id) {
            loadSurvey(id);
        }
    }, [id]);

    useEffect(() => {
        const options = {
            root: null,
            rootMargin: '-20% 0px -60% 0px',
            threshold: 0
        };

        observer.current = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const idx = Number(entry.target.getAttribute('data-index'));
                    if (!isNaN(idx)) {
                        setActiveQuestion(idx);
                    }
                }
            });
        }, options);
    }, []);

    useEffect(() => {
        if (survey && survey.questions && observer.current) {
            setTimeout(() => {
                const elements = document.querySelectorAll('.question-card');
                elements.forEach(el => observer.current?.observe(el));
            }, 500);
        }
        return () => observer.current?.disconnect();
    }, [survey]);

    useEffect(() => {
        const activeBtn = document.getElementById(`nav-item-${activeQuestion}`);
        const navContainer = document.getElementById('nav-container');
        if (activeBtn && navContainer) {
            const containerRect = navContainer.getBoundingClientRect();
            const btnRect = activeBtn.getBoundingClientRect();
            if (btnRect.top < containerRect.top || btnRect.bottom > containerRect.bottom) {
                activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }, [activeQuestion]);

    const loadSurvey = (surveyId: string) => {
        setLoading(true);
        getSurvey(surveyId)
            .then(data => setSurvey(data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    const handleExportPdf = async () => {
        if (!id) return;
        setExportingPdf(true);
        try {
            const blob = await exportSurveyPdf(id);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `survey_${id}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (e) {
            console.error(e);
            alert('Помилка при експорті PDF');
        } finally {
            setExportingPdf(false);
        }
    };

    const scrollToQuestion = (idx: number) => {
        const element = document.getElementById(`question-${idx}`);
        if (element) {
            const headerOffset = 100;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.scrollY - headerOffset;
            window.scrollTo({ top: offsetPosition, behavior: "smooth" });
            setActiveQuestion(idx);
        }
    };

    const [isDarkMode, setIsDarkMode] = useState(document.documentElement.getAttribute('data-theme') === 'dark');

    useEffect(() => {
        const obs = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'data-theme') {
                    setIsDarkMode(document.documentElement.getAttribute('data-theme') === 'dark');
                }
            });
        });
        obs.observe(document.documentElement, { attributes: true });
        return () => obs.disconnect();
    }, []);

    const wrapLabel = (text: string, width = 35) => {
        if (!text) return "";
        const trimmed = text.trim();
        const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
        const words = capitalized.split(" ");
        let line = "";
        let result = "";
        words.forEach(word => {
            if ((line + word).length > width) {
                result += line.trim() + "<br>";
                line = "";
            }
            line += word + " ";
        });
        return result + line.trim();
    };

    const renderChart = (q: Question) => {
        const data = q.data;
        if (!data) return <Alert variant="warning">No data</Alert>;
        const textColor = isDarkMode ? '#e1e1e1' : '#121212';
        const primaryColor = isDarkMode ? '#bb86fc' : '#6200ea';
        const gridColor = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

        const layoutConfig = {
            autosize: true,
            margin: { l: 150, r: 30, t: 30, b: 80 },
            font: { family: 'Roboto, sans-serif', color: textColor, size: 11 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            xaxis: { gridcolor: gridColor, zerolinecolor: gridColor },
            yaxis: { gridcolor: gridColor, zerolinecolor: gridColor, automargin: true, standoff: 20 },
        };

        if (q.type === 'text') {
            const answers = data.answers || [];
            if (answers.length === 0) return <span className="text-muted">Пусто.</span>;
            return (
                <div style={{ maxHeight: '300px', overflowY: 'auto' }} className="custom-scrollbar">
                    {answers.map((txt: string, i: number) => {
                        const capitalizedTxt = txt.trim().charAt(0).toUpperCase() + txt.trim().slice(1);
                        return (
                            <Card key={i} className="mb-2 p-3 bg-light border-0 rounded-3">
                                <small className="text-secondary">{capitalizedTxt}</small>
                            </Card>
                        );
                    })}
                </div>
            );
        }

        if (q.type === 'matrix') {
            const categories = Object.keys(data);
            const traces: any[] = [];
            const allAnswers = new Set<string>();
            categories.forEach(cat => {
                Object.keys(data[cat]).forEach(ans => allAnswers.add(ans));
            });
            
            const wrappedCategories = categories.map(c => wrapLabel(c, 30));
            const totalLines = wrappedCategories.reduce((acc, l) => acc + l.split('<br>').length, 0);
            const dynamicHeight = Math.max(400, totalLines * 25 + categories.length * 30);

            Array.from(allAnswers).forEach(ans => {
                const xValues: number[] = [];
                categories.forEach(cat => {
                    const total = Object.values(data[cat] as Record<string, number>).reduce((a, b) => a + b, 0);
                    const count = (data[cat] as Record<string, number>)[ans] || 0;
                    xValues.push(total > 0 ? (count / total) * 100 : 0);
                });
                const capitalizedAns = ans.trim().charAt(0).toUpperCase() + ans.trim().slice(1);
                traces.push({
                    y: wrappedCategories,
                    x: xValues,
                    name: capitalizedAns,
                    type: 'bar',
                    orientation: 'h'
                });
            });

            return (
                <div style={{ width: '100%', height: dynamicHeight }}>
                     <Plot
                        data={traces}
                        layout={{ ...layoutConfig, barmode: 'stack', height: dynamicHeight, showlegend: true, legend: { orientation: 'h', y: -0.2, font: { color: textColor } } }}
                        useResizeHandler={true}
                        style={{ width: '100%', height: '100%' }}
                        config={{ displayModeBar: false, responsive: true }}
                    />
                </div>
            );
        }

        const labels = Object.keys(data).map(l => wrapLabel(l, 40));
        const values = Object.values(data) as number[];
        const totalLines = labels.reduce((acc, l) => acc + l.split('<br>').length, 0);
        const dynamicHeight = Math.max(400, totalLines * 25 + labels.length * 35);

        if (q.type === 'single_choice') {
            return (
                <div style={{ width: '100%', height: '400px' }}>
                    <Plot
                        data={[{ labels, values, type: 'pie', hole: 0.5, marker: { colors: [primaryColor, '#03dac6', '#b388ff', '#018786', '#ff0266'] } }]}
                        layout={{ ...layoutConfig, height: 400, showlegend: true, legend: { orientation: 'h', y: -0.1, font: { color: textColor } } }}
                        useResizeHandler={true}
                        style={{ width: '100%', height: '100%' }}
                        config={{ displayModeBar: false, responsive: true }}
                    />
                </div>
            );
        }

        return (
            <div style={{ width: '100%', height: dynamicHeight }}>
                <Plot
                    data={[{ y: labels, x: values, type: 'bar', orientation: 'h', text: values.map(String), textposition: 'auto', marker: { color: primaryColor } }]}
                    layout={{ ...layoutConfig, height: dynamicHeight, yaxis: { ...layoutConfig.yaxis, automargin: true } }}
                    useResizeHandler={true}
                    style={{ width: '100%', height: '100%' }}
                    config={{ displayModeBar: false, responsive: true }}
                />
            </div>
        );
    };

    const getIconForType = (type: string) => {
        switch(type) {
            case 'single_choice': return <PieChart size={18} />;
            case 'text': return <AlignLeft size={18} />;
            default: return <BarChart2 size={18} />;
        }
    };

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
            <Spinner animation="border" variant="primary" />
        </div>
    );
    
    if (!survey) return <Alert variant="danger">Опитування не знайдено</Alert>;

    return (
        <div className="fade-in-up">
            <Button variant="link" className="mb-3 ps-0 text-decoration-none text-muted fw-bold" onClick={() => navigate('/surveys')}>
                <ArrowLeft size={18} className="me-1"/> Назад до стрічки
            </Button>
            
            <Row className="g-4">
                <Col lg={3} className="d-none d-lg-block">
                    <div className="sticky-top" style={{ top: '100px' }}>
                        <Card className="material-card border-0 mb-3 shadow-sm">
                            <Card.Body className="p-0">
                                <div className="p-3 border-bottom bg-light rounded-top-4">
                                    <h6 className="fw-bold mb-0 text-muted text-uppercase small">Навігація</h6>
                                </div>
                                <div id="nav-container" className="p-2 custom-scrollbar" style={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>
                                    <div className="d-flex flex-column gap-1">
                                        <button onClick={scrollToTop} className="btn btn-sm text-start border-0 px-3 py-2 rounded-3 d-flex align-items-center gap-2 hover-bg-light text-primary fw-bold mb-2 border-bottom rounded-0 pb-3">
                                            <ArrowUp size={18} />
                                            <span>Повернутись вгору</span>
                                        </button>
                                        {survey.questions?.map((q, idx) => (
                                            <button key={idx} id={`nav-item-${idx}`} onClick={() => scrollToQuestion(idx)} className={`btn btn-sm text-start border-0 px-3 py-2 rounded-3 d-flex align-items-center gap-2 transition-all ${activeQuestion === idx ? 'bg-primary text-white shadow-sm' : 'hover-bg-light text-secondary'}`}>
                                                <span className={`flex-shrink-0 opacity-75 ${activeQuestion === idx ? 'text-white' : 'text-primary'}`}>{getIconForType(q.type)}</span>
                                                <span className="text-truncate small fw-medium">{idx + 1}. {q.text}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                        <div className="text-center text-muted small">
                            <p className="mb-1">Прогрес перегляду</p>
                            <div className="progress" style={{ height: '6px' }}>
                                <div className="progress-bar bg-primary" role="progressbar" style={{ width: `${((activeQuestion + 1) / (survey.questions?.length || 1)) * 100}%` }}></div>
                            </div>
                        </div>
                    </div>
                </Col>

                <Col lg={9}>
                    <Card className="border-0 mb-5 survey-dashboard-header overflow-hidden">
                        <div className="header-glow"></div>
                        <Card.Body className="p-4 p-lg-5 position-relative z-index-1">
                            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-4">
                                <div className="flex-grow-1">
                                    <Badge bg="primary" className="mb-3 px-4 py-2 rounded-pill bg-opacity-10 text-primary fw-bold text-uppercase tracking-wider extra-small border border-primary border-opacity-10">
                                        <CheckCircle2 size={14} className="me-2" />
                                        Результати дослідження
                                    </Badge>
                                    <h1 className="h2 fw-bold mb-4 text-dark">{survey.title}</h1>
                                    
                                    <div className="d-flex flex-wrap gap-3 mt-2">
                                        <div className="header-info-item">
                                            <Calendar size={16} className="text-primary opacity-75" />
                                            <span>{survey.date}</span>
                                        </div>
                                        <div className="header-info-item">
                                            <Building2 size={16} className="text-primary opacity-75" />
                                            <span>{survey.organization}</span>
                                        </div>
                                        <div className="header-info-item highlight">
                                            <Users size={16} />
                                            <span className="fw-bold">{survey.participants}</span>
                                            <span className="small opacity-75">учасників</span>
                                        </div>
                                        <div className="header-info-item highlight">
                                            <Hash size={16} />
                                            <span className="fw-bold">{survey.questions?.length}</span>
                                            <span className="small opacity-75">питань</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <Button 
                                    variant="primary" 
                                    className="rounded-pill px-4 py-2 shadow-sm fw-bold d-flex align-items-center gap-2 export-btn-premium mt-2 mt-md-0" 
                                    onClick={handleExportPdf}
                                    disabled={exportingPdf}
                                >
                                    {exportingPdf ? <Spinner size="sm" animation="border" /> : <Download size={18} />}
                                    <span style={{ fontSize: '0.9rem' }}>Експорт PDF</span>
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                    
                    <div className="d-flex flex-column gap-5">
                        {survey.questions?.map((q, idx) => (
                            <div key={idx} id={`question-${idx}`} className="question-card scroll-margin-top" data-index={idx}>
                                <Card className="material-card border-0 shadow-sm">
                                    <Card.Body className="p-4 p-lg-5">
                                        <div className="d-flex align-items-start gap-3 mb-4">
                                            <div className="flex-shrink-0 d-flex align-items-center justify-content-center bg-light rounded-circle fw-bold text-primary" style={{ width: '40px', height: '40px' }}>{idx + 1}</div>
                                            <div><h4 className="fw-bold mb-1 text-dark">{q.text}</h4></div>
                                        </div>
                                        <div className="my-4">{renderChart(q)}</div>
                                        <div className="bg-light rounded-4 p-4 mt-4 border border-light">
                                            {q.ai_analysis ? (
                                                <div>
                                                    <div className="d-flex align-items-center gap-2 mb-3 text-primary"><div className="p-2 bg-white rounded-circle shadow-sm"><Sparkles size={18} /></div><h6 className="fw-bold mb-0">AI Висновок</h6></div>
                                                    <div className="text-secondary" style={{ whiteSpace: 'pre-line', lineHeight: '1.7', fontSize: '0.95rem' }}>{q.ai_analysis}</div>
                                                </div>
                                            ) : (
                                                <div className="text-muted fst-italic small">
                                                    Автоматичний аналіз результатів ще не проведено.
                                                </div>
                                            )}
                                        </div>
                                    </Card.Body>
                                </Card>
                            </div>
                        ))}
                    </div>
                </Col>
            </Row>
            <style>{`
                .scroll-margin-top { scroll-margin-top: 120px; }
                .hover-bg-light:hover { background-color: var(--bg-color); }
                [data-theme='dark'] .hover-bg-light:hover { background-color: #333; }

                .survey-dashboard-header {
                    background: var(--surface-color);
                    border-radius: 40px !important;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.03);
                    position: relative;
                    border: 1px solid var(--border-color) !important;
                }
                .header-glow {
                    position: absolute;
                    top: -50%;
                    right: -10%;
                    width: 300px;
                    height: 300px;
                    background: radial-gradient(circle, var(--primary-light) 0%, transparent 70%);
                    opacity: 0.05;
                    filter: blur(50px);
                    pointer-events: none;
                }
                .header-info-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 16px;
                    background: var(--bg-color);
                    border-radius: 16px;
                    font-size: 0.9rem;
                    color: var(--text-secondary);
                    border: 1px solid var(--border-color);
                    transition: all 0.2s ease;
                }
                .header-info-item.highlight {
                    background: rgba(98, 0, 234, 0.05);
                    color: var(--primary-color);
                    border-color: rgba(98, 0, 234, 0.1);
                }
                [data-theme='dark'] .header-info-item.highlight {
                    background: rgba(187, 134, 252, 0.1);
                    color: var(--primary-light);
                }
                .export-btn-premium {
                    min-width: 180px;
                    justify-content: center;
                    letter-spacing: 0.5px;
                    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
                }
                .export-btn-premium:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 10px 20px rgba(98, 0, 234, 0.25) !important;
                }
            `}</style>
        </div>
    );
};

export default DashboardPage;
