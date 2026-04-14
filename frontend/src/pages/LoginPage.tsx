import { useState } from 'react';
import { Card, Form, Button, Container, Alert, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { loginAdmin } from '../api';
import { Lock, ShieldCheck, ArrowRight, LayoutDashboard, KeyRound } from 'lucide-react';

const LoginPage = () => {
    const [password, setPassword] = useState('');
    const [nickname, setNickname] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const data = await loginAdmin(password, nickname);
            localStorage.setItem('isAdmin', 'true');
            localStorage.setItem('userRole', data.role);
            localStorage.setItem('ownerId', data.owner_id);
            // Force a reload or navigation to update the Header state
            window.location.href = '/admin';
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Невірний пароль доступу. Спробуйте ще раз.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light" style={{ marginTop: '-80px' }}>
            <Container>
                <div className="text-center mb-4 fade-in-up">
                    <div className="d-inline-flex align-items-center justify-content-center p-3 bg-white rounded-circle shadow-sm mb-3" style={{ color: 'var(--primary-color)' }}>
                        <LayoutDashboard size={40} />
                    </div>
                    <h2 className="fw-bold">YouthPulse</h2>
                    <p className="text-muted">Панель керування системою</p>
                </div>

                <Card className="material-card border-0 mx-auto fade-in-up delay-100" style={{ maxWidth: '420px' }}>
                    <Card.Body className="p-4 p-md-5">
                        <div className="text-center mb-4">
                            <h4 className="fw-bold mb-1">Авторизація</h4>
                            <p className="text-muted small">Введіть пароль адміністратора або гостя</p>
                        </div>

                        {error && (
                            <Alert variant="danger" className="py-2 small border-0 shadow-sm d-flex align-items-center gap-2 mb-4">
                                <KeyRound size={16} />
                                {error}
                            </Alert>
                        )}

                        <Form onSubmit={handleSubmit}>
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold text-uppercase text-muted ms-1">Пароль доступу</Form.Label>
                                <InputGroup className="bg-light rounded-3 overflow-hidden border-0">
                                    <InputGroup.Text className="bg-light border-0 text-muted ps-3">
                                        <Lock size={18} />
                                    </InputGroup.Text>
                                    <Form.Control 
                                        type="password" 
                                        placeholder="••••••••" 
                                        className="bg-light border-0 py-3 shadow-none"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        autoFocus
                                    />
                                </InputGroup>
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <Form.Label className="small fw-bold text-uppercase text-muted ms-1">Нікнейм / Назва (для гостей)</Form.Label>
                                <InputGroup className="bg-light rounded-3 overflow-hidden border-0">
                                    <InputGroup.Text className="bg-light border-0 text-muted ps-3">
                                        <KeyRound size={18} />
                                    </InputGroup.Text>
                                    <Form.Control 
                                        type="text" 
                                        placeholder="Наприклад: Організація_А" 
                                        className="bg-light border-0 py-3 shadow-none"
                                        value={nickname}
                                        onChange={(e) => setNickname(e.target.value)}
                                    />
                                </InputGroup>
                                <Form.Text className="text-muted small px-1">
                                    Гості бачитимуть лише ті опитування, які вони завантажили під цим нікнеймом.
                                </Form.Text>
                            </Form.Group>

                            <Button 
                                variant="primary" 
                                type="submit" 
                                className="w-100 py-3 fw-bold rounded-pill d-flex align-items-center justify-content-center gap-2"
                                disabled={loading}
                            >
                                {loading ? 'Перевірка...' : (
                                    <>
                                        Увійти в систему
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </Button>
                        </Form>

                        <div className="text-center mt-4 pt-2">
                             <Button 
                                variant="link" 
                                className="text-muted text-decoration-none small fw-medium"
                                onClick={() => navigate('/')}
                             >
                                Повернутися на головну
                             </Button>
                        </div>
                    </Card.Body>
                </Card>
                
                <div className="text-center mt-4 fade-in-up delay-200">
                    <div className="d-flex align-items-center justify-content-center gap-2 text-muted small">
                        <ShieldCheck size={14} />
                        <span>Secure Admin Access</span>
                    </div>
                </div>
            </Container>
        </div>
    );
};

export default LoginPage;

