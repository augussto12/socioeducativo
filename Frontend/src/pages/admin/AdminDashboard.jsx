import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminStats } from '../../api/admin.api';
import { getTournaments } from '../../api/tournaments.api';
import SkeletonLoader from '../../components/SkeletonLoader';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      setError(null);
      const [statsRes, tourneysRes] = await Promise.all([
        getAdminStats(),
        getTournaments({ limit: 5 }),
      ]);
      setStats(statsRes.data);
      setTournaments(tourneysRes.data.tournaments);
    } catch {
      setError('Error cargando dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const statCards = useMemo(() => [
    { icon: '🛡️', label: 'Equipos', value: stats?.totalTeams || 0, color: 'var(--accent-primary)' },
    { icon: '🏆', label: 'Torneos Activos', value: stats?.activeTournaments || 0, color: 'var(--accent-success)' },
    { icon: '⏳', label: 'Pendientes', value: stats?.pendingMatches || 0, color: 'var(--accent-warning)' },
    { icon: '👥', label: 'Jugadores', value: stats?.totalPlayers || 0, color: 'var(--accent-cyan)' },
    { icon: '✅', label: 'Jugados', value: stats?.totalPlayedMatches || 0, color: 'var(--accent-success)' },
    { icon: '📋', label: 'Total Torneos', value: stats?.totalTournaments || 0, color: 'var(--accent-secondary)' },
  ], [stats]);

  const statusLabel = { DRAFT: 'Borrador', INSCRIPTIONS_OPEN: 'Inscripciones', IN_PROGRESS: 'En Curso', FINISHED: 'Finalizado', CANCELLED: 'Cancelado' };
  const statusClass = { DRAFT: 'badge-pending', INSCRIPTIONS_OPEN: 'badge-draw', IN_PROGRESS: 'badge-active', FINISHED: 'badge-win', CANCELLED: 'badge-loss' };

  if (loading) return <SkeletonLoader variant="full-page" />;

  if (error) {
    return (
      <div className="empty-state">
        <div className="empty-icon" aria-hidden="true">⚠️</div>
        <h3>{error}</h3>
        <button className="btn btn-primary" onClick={load}>🔄 Reintentar</button>
      </div>
    );
  }

  return (
    <section className="admin-dashboard" aria-label="Dashboard administrativo">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
            Bienvenido al panel de administración
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {statCards.map((card, i) => (
          <div key={card.label} className={`stat-card animate-slide-up stagger-${i + 1}`}>
            <div className="stat-icon" aria-hidden="true">{card.icon}</div>
            <div className="stat-value" style={{ color: card.color }}>{card.value}</div>
            <div className="stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="dashboard-section">
        <h2 className="section-title">Acciones Rápidas</h2>
        <div className="quick-actions">
          <button className="btn btn-primary" onClick={() => navigate('/admin/teams')} aria-label="Gestionar equipos">
            <span aria-hidden="true">🛡️</span> Gestionar Equipos
          </button>
          <button className="btn btn-success" onClick={() => navigate('/admin/tournaments')} aria-label="Crear torneo">
            <span aria-hidden="true">🏆</span> Crear Torneo
          </button>
          <button className="btn btn-ghost" onClick={() => navigate('/admin/game-types')} aria-label="Tipos de juego">
            <span aria-hidden="true">🎮</span> Tipos de Juego
          </button>
        </div>
      </div>

      {/* Recent Tournaments */}
      <div className="dashboard-section">
        <h2 className="section-title">Últimos Torneos</h2>
        {tournaments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon" aria-hidden="true">🏆</div>
            <h3>Sin torneos todavía</h3>
            <p>Creá tu primer torneo desde la sección de Torneos</p>
          </div>
        ) : (
          <div className="tournaments-list">
            {tournaments.map((t) => (
              <div
                key={t.id}
                className="tournament-row glass-card"
                onClick={() => navigate(`/admin/tournaments/${t.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/admin/tournaments/${t.id}`)}
                aria-label={`Ver torneo ${t.name}`}
              >
                <div className="tournament-row-info">
                  <span className="tournament-row-icon" aria-hidden="true">{t.gameType?.icon || '🎮'}</span>
                  <div>
                    <div className="tournament-row-name">{t.name}</div>
                    <div className="tournament-row-meta">
                      {t.gameType?.name} · {t.format === 'ROUND_ROBIN' ? 'Todos vs Todos' : 'Eliminación Directa'}
                      · {t._count?.tournamentTeams || 0} equipos
                    </div>
                  </div>
                </div>
                <span className={`badge ${statusClass[t.status]}`}>
                  {statusLabel[t.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
