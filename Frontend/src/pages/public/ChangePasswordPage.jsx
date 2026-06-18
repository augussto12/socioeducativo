import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './LoginPage.css';

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, changePassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('La nueva contrasena debe tener al menos 8 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('La confirmacion no coincide con la nueva contrasena.');
      return;
    }

    setLoading(true);
    try {
      const { user: updatedUser } = await changePassword(currentPassword, newPassword);
      const nextUser = updatedUser || user;
      navigate(nextUser?.role === 'ADMIN' ? '/admin' : '/staff', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cambiar la contrasena.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page" id="main-content">
      <div className="login-card glass-card animate-slide-up">
        <div className="login-header">
          <div className="login-logo">SE</div>
          <h1 className="login-title">Cambiar contrasena</h1>
          <p className="login-subtitle">Actualiza tu acceso para continuar</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <div className="login-error animate-fade-in">
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="currentPassword">Contrasena actual</label>
            <input
              id="currentPassword"
              type="password"
              className="form-input"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="newPassword">Nueva contrasena</label>
            <input
              id="newPassword"
              type="password"
              className="form-input"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              minLength="8"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">Confirmar nueva contrasena</label>
            <input
              id="confirmPassword"
              type="password"
              className="form-input"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              minLength="8"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            {loading ? 'Actualizando...' : 'Actualizar contrasena'}
          </button>
        </form>
      </div>
    </main>
  );
}
