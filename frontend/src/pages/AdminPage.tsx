import { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Form, Table, Card, Tabs, Tab, Modal, Badge, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { 
    uploadFile, 
    saveSurvey, 
    getAllSurveysFull, 
    updateSurvey, 
    deleteSurvey, 
    generateDescription,
    exportSurveyPdf
} from '../api';
import { ColumnInfo, Survey } from '../types';
import { 
    Upload, 
    Settings, 
    Save, 
    ArrowRight, 
    Trash2, 
    RefreshCw, 
    Edit3, 
    Building2, 
    Sparkles, 
    X, 
    Search, 
    FileText,
    LayoutGrid,
    PlusCircle,
    Download,
    Eye,
    EyeOff
} from 'lucide-react';

const AdminPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('manage');
    
    // --- Management State (ex EditorPage) ---
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
    const [showEditModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editForm, setEditForm] = useState<any>({});
    const [generating, setGenerating] = useState(false);
    const [exportingAllPdf, setExportingAllPdf] = useState(false);
    const [exportingId, setExportingId] = useState<string | null>(null);

    // --- Import State (ex AdminPage) ---
    const [importStep, setImportStep] = useState(0);
    const [file, setFile] = useState<File | null>(null);
    const [uploadData, setUploadData] = useState<any>(null);
    const [importLoading, setImportLoading] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newOrg, setNewOrg] = useState('IT Kamianets');
    const [selectedTypes, setSelectedTypes] = useState<{[key: string]: string}>({});
    const [droppedCols, setDroppedCols] = useState<string[]>([]);

    useEffect(() => {
        const isAdmin = localStorage.getItem('isAdmin');
        if (!isAdmin) {
            navigate('/login');
            return;
        }
        loadSurveys();
    }, []);

    const loadSurveys = () => {
        getAllSurveysFull().then(setSurveys).catch(console.error);
    };

    const downloadBlob = (blob: Blob, filename: string) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    const handleExportPdf = async (survey: Survey) => {
        const id = survey._id || String(survey.id);
        setExportingId(id);
        try {
            const blob = await exportSurveyPdf(id);
            downloadBlob(blob, `survey_${id}.pdf`);
        } catch (e) {
            console.error(e);
            alert('Помилка при експорті PDF');
        } finally {
            setExportingId(null);
        }
    };

    const handleExportAllPdf = async () => {
        if (filteredSurveys.length === 0) return;
        setExportingAllPdf(true);
        try {
            for (const s of filteredSurveys) {
                const id = s._id || String(s.id);
                const blob = await exportSurveyPdf(id);
                downloadBlob(blob, `survey_${id}.pdf`);
                // Add a small delay between downloads to be nice to the browser
                await new Promise(r => setTimeout(r, 500));
            }
        } catch (e) {
            console.error(e);
            alert('Помилка при експорті PDF');
        } finally {
            setExportingAllPdf(false);
        }
    };

    // --- Editor Actions ---
    const handleEdit = (survey: Survey) => {
        setEditingSurvey(survey);
        setEditForm({
            title: survey.title,
            organization: survey.organization,
            participants: survey.participants,
            date: survey.date,
            ai_description: survey.ai_description,
            is_published: survey.is_published ?? false
        });
        setShowModal(true);
    };

    const handleTogglePublish = async (survey: Survey) => {
        const id = survey._id || String(survey.id);
        const newState = !survey.is_published;
        // Optimistic UI
        setSurveys(prev => prev.map(s => (s._id === id || String(s.id) === id) ? { ...s, is_published: newState } : s));
        try {
            await updateSurvey(id, { ...survey, is_published: newState });
        } catch (e) {
            console.error(e);
            loadSurveys();
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Ви впевнені, що хочете видалити це опитування?')) {
            await deleteSurvey(id);
            loadSurveys();
        }
    };

    const handleSaveEdit = async () => {
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

    // --- Import Actions ---
    const handleFileUpload = async () => {
        if (!file) return;
        setImportLoading(true);
        try {
            const res = await uploadFile(file);
            setUploadData(res);
            const types: any = {};
            res.columns.forEach((c: ColumnInfo) => {
                types[c.name] = c.suggested_type;
            });
            setSelectedTypes(types);
            setDroppedCols(res.suggested_drop || []);
            setNewTitle(res.filename.replace(/\.(xlsx|csv|xls)$/i, ''));
            setImportStep(1);
        } catch (e) {
            alert('Помилка завантаження файлу');
        } finally {
            setImportLoading(false);
        }
    };

    const handleSaveNewSurvey = async () => {
        setImportLoading(true);
        try {
            await saveSurvey({
                temp_id: uploadData.temp_id,
                title: newTitle,
                organization: newOrg,
                participants: 0,
                selected_types: selectedTypes,
                dropped_columns: droppedCols
            });
            setImportStep(0);
            setFile(null);
            loadSurveys();
            setActiveTab('manage');
        } catch (e) {
            alert('Помилка збереження опитування');
        } finally {
            setImportLoading(false);
        }
    };

    const toggleDrop = (colName: string) => {
        if (droppedCols.includes(colName)) {
            setDroppedCols(droppedCols.filter(c => c !== colName));
        } else {
            setDroppedCols([...droppedCols, colName]);
        }
    };

    const filteredSurveys = surveys.filter(s => 
        s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (s.organization || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Container className="fade-in-up py-4">
            <div className="mb-5">
                <h1 className="fw-bold mb-1">🛠 Адмін-панель</h1>
                <p className="text-muted">Централізоване керування всіма даними платформи</p>
            </div>

            <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k || 'manage')}
                className="mb-4 custom-admin-tabs border-0"
            >
                <Tab eventKey="manage" title={<span><LayoutGrid size={18} className="me-2" /> Керування даними</span>}>
                    <div className="pt-3">
                        <Card className="material-card border-0 mb-4 shadow-sm">
                            <Card.Body className="p-4">
                                <Row className="align-items-center">
                                    <Col md={6}>
                                        <div className="position-relative">
                                            <Search className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" size={18} />
                                            <Form.Control 
                                                type="text" 
                                                placeholder="Пошук опитувань..." 
                                                className="bg-light border-0 rounded-pill py-2 ps-5 shadow-none"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                    </Col>
                                    <Col md={6} className="text-md-end mt-3 mt-md-0">
                                        <Button variant="outline-primary" className="rounded-pill px-4 me-2" onClick={handleExportAllPdf} disabled={exportingAllPdf}>
                                            {exportingAllPdf ? <Spinner size="sm" animation="border" /> : <><Download size={18} className="me-2" /> Експорт всіх в PDF</>}
                                        </Button>
                                        <Button variant="primary" className="rounded-pill px-4" onClick={() => setActiveTab('import')}>
                                            <PlusCircle size={18} className="me-2" /> Новий імпорт
                                        </Button>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>

                        <Card className="material-card border-0 overflow-hidden shadow-sm">
                            <div className="table-responsive">
                                <Table hover className="align-middle mb-0">
                                    <thead className="bg-light text-muted small text-uppercase">
                                        <tr>
                                            <th className="px-4 py-3 border-0">Назва</th>
                                            <th className="px-4 py-3 border-0">Організація</th>
                                            <th className="px-4 py-3 border-0 text-center">Статус</th>
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
                                                <td className="px-4 py-3 text-muted small">
                                                    <Building2 size={14} className="me-1" /> {s.organization}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <Badge 
                                                        bg={s.is_published ? "success" : "secondary"} 
                                                        className="rounded-pill px-3 py-2 cursor-pointer"
                                                        onClick={() => handleTogglePublish(s)}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        {s.is_published ? <><Eye size={12} className="me-1"/> Публічно</> : <><EyeOff size={12} className="me-1"/> Чернетка</>}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-center text-muted small">
                                                    {s.date || 'N/A'}
                                                </td>
                                                <td className="px-4 py-3 text-end">
                                                    <div className="d-flex justify-content-end gap-2">
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline-primary" 
                                                            className="rounded-circle p-2 border-0" 
                                                            onClick={() => handleExportPdf(s)}
                                                            title="Експорт в PDF"
                                                            disabled={exportingId === (s._id || String(s.id))}
                                                        >
                                                            {exportingId === (s._id || String(s.id)) ? <Spinner size="sm" animation="border" /> : <Download size={18} />}
                                                        </Button>
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline-primary" 
                                                            className="rounded-circle p-2 border-0" 
                                                            onClick={() => handleEdit(s)}
                                                        >
                                                            <Edit3 size={18} />
                                                        </Button>
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline-danger" 
                                                            className="rounded-circle p-2 border-0" 
                                                            onClick={() => handleDelete(s._id || String(s.id))}
                                                        >
                                                            <Trash2 size={18} />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        </Card>
                    </div>
                </Tab>

                <Tab eventKey="import" title={<span><PlusCircle size={18} className="me-2" /> Новий імпорт</span>}>
                    <div className="pt-3">
                        {importStep === 0 && (
                            <Row className="justify-content-center">
                                <Col lg={6}>
                                    <Card className="material-card p-5 text-center border-0 shadow-sm">
                                        <div className="mb-4 text-primary bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mx-auto" style={{ width: '96px', height: '96px' }}>
                                            <Upload size={48} />
                                        </div>
                                        <h4 className="fw-bold mb-3">Завантажте дані</h4>
                                        <p className="text-muted mb-4 small">Оберіть файл у форматі CSV або Excel для створення нового опитування</p>
                                        
                                        <div className="custom-file-upload border-dashed rounded-4 p-5 bg-light transition-all cursor-pointer hover-bg-light-dark mb-4">
                                            <input type="file" className="d-none" id="fileImport" onChange={(e: any) => setFile(e.target.files[0])} />
                                            <label htmlFor="fileImport" className="w-100 cursor-pointer mb-0">
                                                <div className="fw-bold text-dark mb-1">{file ? file.name : 'Виберіть файл'}</div>
                                                <small className="text-muted">або перетягніть його сюди</small>
                                            </label>
                                        </div>
                                        
                                        <Button 
                                            variant="primary" 
                                            className="w-100 py-3 rounded-pill fw-bold d-flex align-items-center justify-content-center gap-2"
                                            onClick={handleFileUpload}
                                            disabled={!file || importLoading}
                                        >
                                            {importLoading ? <RefreshCw className="spin" /> : <><ArrowRight size={20} /> Продовжити</>}
                                        </Button>
                                    </Card>
                                </Col>
                            </Row>
                        )}

                        {importStep === 1 && uploadData && (
                            <div className="fade-in-up">
                                <Card className="material-card p-4 border-0 shadow-sm mb-4">
                                    <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
                                        <Settings className="text-primary" size={20} /> Основні параметри
                                    </h5>
                                    <Row className="g-3">
                                        <Col md={6}>
                                            <Form.Label className="small fw-bold text-muted text-uppercase">Назва опитування</Form.Label>
                                            <Form.Control 
                                                value={newTitle} 
                                                onChange={e => setNewTitle(e.target.value)} 
                                                className="bg-light border-0 rounded-3 py-2 shadow-none"
                                            />
                                        </Col>
                                        <Col md={6}>
                                            <Form.Label className="small fw-bold text-muted text-uppercase">Організація</Form.Label>
                                            <Form.Control 
                                                value={newOrg} 
                                                onChange={e => setNewOrg(e.target.value)} 
                                                className="bg-light border-0 rounded-3 py-2 shadow-none"
                                            />
                                        </Col>
                                    </Row>
                                </Card>

                                <Card className="material-card border-0 shadow-sm overflow-hidden">
                                    <div className="p-4 border-bottom d-flex justify-content-between align-items-center">
                                        <h5 className="fw-bold mb-0">Конфігурація питань</h5>
                                        <Badge bg="light" text="dark" className="border px-3 py-2 rounded-pill fw-normal">
                                            Колонок: {uploadData.columns.length}
                                        </Badge>
                                    </div>
                                    <div className="table-responsive">
                                        <Table hover className="align-middle mb-0">
                                            <thead className="bg-light text-muted small text-uppercase">
                                                <tr>
                                                    <th className="px-4 py-3 border-0">Питання</th>
                                                    <th className="px-4 py-3 border-0">Тип</th>
                                                    <th className="px-4 py-3 border-0 text-end">Дія</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {uploadData.columns.map((col: ColumnInfo) => {
                                                    const isDropped = droppedCols.includes(col.name);
                                                    return (
                                                        <tr key={col.name} className={isDropped ? 'opacity-50' : ''}>
                                                            <td className="px-4 py-3">
                                                                <div className="fw-bold text-dark small">{col.name}</div>
                                                                <div className="text-muted" style={{ fontSize: '11px' }}>Приклад: {col.example}</div>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <Form.Select 
                                                                    size="sm"
                                                                    value={selectedTypes[col.name]} 
                                                                    onChange={e => setSelectedTypes({...selectedTypes, [col.name]: e.target.value})}
                                                                    disabled={isDropped}
                                                                    className="border-0 bg-light rounded-3 shadow-none fw-medium"
                                                                >
                                                                    <option value="single_choice">Один вибір</option>
                                                                    <option value="multiple_choice">Множинний вибір</option>
                                                                    <option value="text">Текст</option>
                                                                    <option value="matrix">Матриця</option>
                                                                </Form.Select>
                                                            </td>
                                                            <td className="px-4 py-3 text-end">
                                                                <Button 
                                                                    variant={isDropped ? "light" : "outline-danger"} 
                                                                    size="sm" 
                                                                    onClick={() => toggleDrop(col.name)}
                                                                    className="border-0"
                                                                >
                                                                    {isDropped ? <RefreshCw size={14} /> : <Trash2 size={14} />}
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </Table>
                                    </div>
                                    <div className="p-4 bg-light d-flex justify-content-between">
                                        <Button variant="link" className="text-muted text-decoration-none" onClick={() => setImportStep(0)}>
                                            Повернутися
                                        </Button>
                                        <Button className="rounded-pill px-5 fw-bold shadow-sm" onClick={handleSaveNewSurvey} disabled={importLoading}>
                                            {importLoading ? <RefreshCw className="spin me-2" /> : <Save size={18} className="me-2" />}
                                            Зберегти опитування
                                        </Button>
                                    </div>
                                </Card>
                            </div>
                        )}
                    </div>
                </Tab>
            </Tabs>

            {/* Edit Modal (Survey Metadata) */}
            <Modal show={showEditModal} onHide={() => setShowModal(false)} size="lg" centered>
                <Modal.Header className="border-0 px-4 pt-4">
                    <Modal.Title className="fw-bold d-flex align-items-center gap-2">
                        <Edit3 className="text-primary" /> Редагування метаданих
                    </Modal.Title>
                    <Button variant="link" className="text-muted p-0" onClick={() => setShowModal(false)}><X size={24} /></Button>
                </Modal.Header>
                <Modal.Body className="px-4 pb-4">
                    <Form>
                        <Row className="mb-4 g-3">
                            <Col md={12}>
                                <Form.Label className="small fw-bold text-muted text-uppercase">Назва</Form.Label>
                                <Form.Control 
                                    className="bg-light border-0 py-2 shadow-none"
                                    value={editForm.title || ''} 
                                    onChange={e => setEditForm({...editForm, title: e.target.value})} 
                                />
                            </Col>
                            <Col md={6}>
                                <Form.Label className="small fw-bold text-muted text-uppercase">Організація</Form.Label>
                                <Form.Control 
                                    className="bg-light border-0 py-2 shadow-none"
                                    value={editForm.organization || ''} 
                                    onChange={e => setEditForm({...editForm, organization: e.target.value})} 
                                />
                            </Col>
                            <Col md={6}>
                                <Form.Label className="small fw-bold text-muted text-uppercase">Дата</Form.Label>
                                <Form.Control 
                                    type="date"
                                    className="bg-light border-0 py-2 shadow-none"
                                    value={editForm.date || ''} 
                                    onChange={e => setEditForm({...editForm, date: e.target.value})} 
                                />
                            </Col>
                            <Col md={12}>
                                <Form.Check 
                                    type="switch"
                                    id="publish-switch"
                                    label="Опублікувати на головній сторінці"
                                    className="fw-bold text-primary mt-2"
                                    checked={editForm.is_published || false}
                                    onChange={e => setEditForm({...editForm, is_published: e.target.checked})}
                                />
                            </Col>
                        </Row>
                        <Form.Group className="mb-0">
                            <div className="d-flex justify-content-between mb-2">
                                <Form.Label className="small fw-bold text-muted text-uppercase">AI Опис</Form.Label>
                                <Button 
                                    variant="link" 
                                    size="sm" 
                                    className="p-0 text-primary text-decoration-none fw-bold"
                                    onClick={handleGenerateDesc}
                                    disabled={generating}
                                >
                                    {generating ? 'Генерую...' : <><Sparkles size={14} className="me-1" /> Згенерувати</>}
                                </Button>
                            </div>
                            <Form.Control 
                                as="textarea" 
                                rows={4}
                                className="bg-light border-0 shadow-none"
                                value={editForm.ai_description || ''} 
                                onChange={e => setEditForm({...editForm, ai_description: e.target.value})} 
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer className="border-0 px-4 pb-4 pt-0">
                    <Button variant="light" className="rounded-pill px-4" onClick={() => setShowModal(false)}>Скасувати</Button>
                    <Button variant="primary" className="rounded-pill px-4 shadow-sm" onClick={handleSaveEdit}>
                        Зберегти зміни
                    </Button>
                </Modal.Footer>
            </Modal>

            <style>{`
                .custom-admin-tabs .nav-link {
                    color: var(--text-secondary);
                    font-weight: 600;
                    border: none;
                    padding: 1rem 1.5rem;
                    border-bottom: 2px solid transparent;
                    transition: all 0.3s;
                }
                .custom-admin-tabs .nav-link.active {
                    color: var(--primary-color);
                    background: transparent;
                    border-bottom: 2px solid var(--primary-color);
                }
                .border-dashed { border: 2px dashed #dee2e6; }
                .cursor-pointer { cursor: pointer; }
                .hover-bg-light-dark:hover { background-color: #f1f3f5 !important; border-color: var(--primary-color); }
                .spin { animation: spin 2s infinite linear; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </Container>
    );
};

export default AdminPage;
