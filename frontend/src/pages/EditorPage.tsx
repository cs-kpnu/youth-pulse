import { useState, useEffect } from 'react';
import { Container, Table, Button, Form, Modal, Row, Col, Card, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { getAllSurveysFull, updateSurvey, deleteSurvey, generateDescription } from '../api';
import { Survey } from '../types';
import { Edit3, Trash2, Calendar, Building2, Users, Sparkles, Save, X, Search, FileText } from 'lucide-react';

const EditorPage = () => {
    const navigate = useNavigate();
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [editForm, setEditForm] = useState<any>({});
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        const isAdmin = localStorage.getItem('isAdmin');
        if (!isAdmin) navigate('/login');
        loadSurveys();
    }, []);

    const loadSurveys = () => {
        getAllSurveysFull().then(setSurveys).catch(console.error);
    };

    const handleEdit = (survey: Survey) => {
        setEditingSurvey(survey);
        setEditForm({
            title: survey.title,
            organization: survey.organization,
            participants: survey.participants,
            date: survey.date,
            ai_description: survey.ai_description
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Ви впевнені, що хочете видалити це опитування?')) {
            await deleteSurvey(id);
            loadSurveys();
        }
    };

    const handleSave = async () => {
        if (!editingSurvey?._id && !editingSurvey?.id) return;
        const id = editingSurvey._id || String(editingSurvey.id);
        
        await updateSurvey(id, editForm);
        setShowModal(false);
        loadSurveys();
    };

    const handleGenerateDesc = async () => {
        if (!editingSurvey) return;
        setGenerating(true);
        try {
            const res = await generateDescription(editForm.title, editingSurvey.questions || []);
            setEditForm({ ...editForm, ai_description: res.description });
        } catch (e) {
            console.error(e);
        } finally {
            setGenerating(false);
        }
    };

    const filteredSurveys = surveys.filter(s => 
        s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (s.organization || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Container className="fade-in-up py-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 gap-3">
                <div>
                    <h1 className="fw-bold mb-1">✏️ Редактор опитувань</h1>
                    <p className="text-muted mb-0">Керування існуючими даними та редагування метаінформації</p>
                </div>
                <div className="d-flex gap-2">
                     <Button variant="outline-primary" className="rounded-pill px-4" onClick={() => navigate('/admin')}>
                        🛠 Адмін-панель
                     </Button>
                </div>
            </div>

            <Card className="material-card border-0 mb-4">
                <Card.Body className="p-4">
                    <Row className="align-items-center">
                        <Col md={6}>
                            <div className="position-relative">
                                <Search className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" size={18} />
                                <Form.Control 
                                    type="text" 
                                    placeholder="Пошук за назвою або організацією..." 
                                    className="bg-light border-0 rounded-pill py-2 ps-5 shadow-none"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </Col>
                        <Col md={6} className="text-md-end mt-3 mt-md-0">
                            <span className="text-muted small fw-medium">Всього знайдено: <span className="text-dark fw-bold">{filteredSurveys.length}</span></span>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <Card className="material-card border-0 overflow-hidden">
                <div className="table-responsive">
                    <Table hover className="align-middle mb-0">
                        <thead className="bg-light text-muted small text-uppercase">
                            <tr>
                                <th className="px-4 py-3 border-0">Назва опитування</th>
                                <th className="px-4 py-3 border-0">Організація</th>
                                <th className="px-4 py-3 border-0 text-center">Дата</th>
                                <th className="px-4 py-3 border-0 text-end">Дії</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSurveys.map((s, i) => (
                                <tr key={s._id || s.id || i}>
                                    <td className="px-4 py-3">
                                        <div className="d-flex align-items-center gap-2">
                                            <div className="p-2 bg-primary bg-opacity-10 rounded text-primary">
                                                <FileText size={18} />
                                            </div>
                                            <span className="fw-bold text-dark">{s.title}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-muted">
                                        <div className="d-flex align-items-center gap-1">
                                            <Building2 size={14} />
                                            {s.organization}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center text-muted small">
                                        <div className="d-flex align-items-center justify-content-center gap-1">
                                            <Calendar size={14} />
                                            {s.date || 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-end">
                                        <div className="d-flex justify-content-end gap-2">
                                            <Button 
                                                size="sm" 
                                                variant="outline-primary" 
                                                className="rounded-circle p-2 border-0 shadow-sm action-btn" 
                                                onClick={() => handleEdit(s)}
                                                title="Редагувати"
                                            >
                                                <Edit3 size={18} />
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                variant="outline-danger" 
                                                className="rounded-circle p-2 border-0 shadow-sm action-btn" 
                                                onClick={() => handleDelete(s._id || String(s.id))}
                                                title="Видалити"
                                            >
                                                <Trash2 size={18} />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredSurveys.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="text-center py-5 text-muted">
                                        Опитувань не знайдено
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </div>
            </Card>

            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered className="editor-modal">
                <Modal.Header className="border-0 px-4 pt-4">
                    <Modal.Title className="fw-bold d-flex align-items-center gap-2">
                        <Edit3 className="text-primary" /> Редагування метаданих
                    </Modal.Title>
                    <Button variant="link" className="text-muted p-0 border-0" onClick={() => setShowModal(false)}>
                        <X size={24} />
                    </Button>
                </Modal.Header>
                <Modal.Body className="px-4 pb-4">
                    <Form>
                        <Row className="mb-4 g-3">
                            <Col md={12}>
                                <Form.Label className="fw-bold small text-uppercase text-muted">Назва опитування</Form.Label>
                                <Form.Control 
                                    className="bg-light border-0 rounded-3 py-2 shadow-none"
                                    value={editForm.title || ''} 
                                    onChange={e => setEditForm({...editForm, title: e.target.value})} 
                                />
                            </Col>
                        </Row>
                        <Row className="mb-4 g-3">
                            <Col md={6}>
                                <Form.Label className="fw-bold small text-uppercase text-muted">Організація</Form.Label>
                                <Form.Control 
                                    className="bg-light border-0 rounded-3 py-2 shadow-none"
                                    value={editForm.organization || ''} 
                                    onChange={e => setEditForm({...editForm, organization: e.target.value})} 
                                />
                            </Col>
                            <Col md={6}>
                                <Form.Label className="fw-bold small text-uppercase text-muted">Дата</Form.Label>
                                <Form.Control 
                                    type="date"
                                    className="bg-light border-0 rounded-3 py-2 shadow-none"
                                    value={editForm.date || ''} 
                                    onChange={e => setEditForm({...editForm, date: e.target.value})} 
                                />
                            </Col>
                        </Row>
                        <Row className="mb-4 g-3">
                            <Col md={6}>
                                <Form.Label className="fw-bold small text-uppercase text-muted">Учасників</Form.Label>
                                <InputGroup>
                                    <InputGroup.Text className="bg-light border-0"><Users size={16} /></InputGroup.Text>
                                    <Form.Control 
                                        type="number"
                                        className="bg-light border-0 rounded-end-3 py-2 shadow-none"
                                        value={editForm.participants || 0} 
                                        onChange={e => setEditForm({...editForm, participants: Number(e.target.value)})} 
                                    />
                                </InputGroup>
                            </Col>
                        </Row>
                        <Form.Group className="mb-0">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <Form.Label className="fw-bold small text-uppercase text-muted mb-0">AI Опис</Form.Label>
                                <Button 
                                    variant="link" 
                                    size="sm" 
                                    className="text-primary text-decoration-none fw-bold p-0"
                                    onClick={handleGenerateDesc}
                                    disabled={generating}
                                >
                                    {generating ? 'Генерую...' : <><Sparkles size={14} className="me-1" /> Згенерувати автоматично</>}
                                </Button>
                            </div>
                            <Form.Control 
                                as="textarea" 
                                rows={4}
                                className="bg-light border-0 rounded-3 py-2 shadow-none"
                                value={editForm.ai_description || ''} 
                                onChange={e => setEditForm({...editForm, ai_description: e.target.value})} 
                                placeholder="Цей опис буде відображатися на головній сторінці..."
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer className="border-0 px-4 pb-4 pt-0">
                    <Button variant="light" className="rounded-pill px-4 fw-bold" onClick={() => setShowModal(false)}>
                        Скасувати
                    </Button>
                    <Button variant="primary" className="rounded-pill px-4 fw-bold shadow-sm" onClick={handleSave}>
                        <Save size={18} className="me-2" /> Зберегти зміни
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default EditorPage;

