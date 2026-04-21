import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminStats } from '../../api/admin.api';
import { getTournaments } from '../../api/tournaments.api';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, tourneysRes] = await Promise.all([
          getAdminStats(),
          getTournaments({ limit: 5 }),
        ]);
        setStats(statsRes.data);
        setTournaments(tourneysRes.data.tournaments);
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="loading-page"><div className="spinner" /></div>;
  }

  const statCards = [
    { icon: '🛡️', label: 'Equipos', value: stats?.totalTeams || 0, color: 'var(--accent-primary)' },
    { icon: '🏆', label: 'Torneos Activos', value: stats?.activeTournaments || 0, color: 'var(--accent-success)' },
    { icon: '⏳', label: 'Partidos Pendientes', value: stats?.pendingMatches || 0, color: 'var(--accent-warning)' },
    { icon: '👥', label: 'Jugadores', value: stats?.totalPlayers || 0, color: 'var(--accent-cyan)' },
    { icon: '✅', label: 'Partidos Jugados', value: stats?.totalPlayedMatches || 0, color: 'var(--accent-success)' },
    { icon: '📋', label: 'Total Torneos', value: stats?.totalTournaments || 0, color: 'var(--accent-secondary)' },
  ];

  const statusLabel = {
    DRAFT: 'Borrador',
    INSCRIPTIONS_OPEN: 'Inscripciones',
    IN_PROGRESS: 'En Curso',
    FINISHED: 'Finalizado',
    CANCELLED: 'Cancelado',
  };

  const statusClass = {
    DRAFT: 'badge-pending',
    INSCRIPTIONS_OPEN: 'badge-draw',
    IN_PROGRESS: 'badge-active',
    FINISHED: 'badge-win',
    CANCELLED: 'badge-loss',
  };

  return (
    <div className="admin-dashboard">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Bienvenido al panel de administración
        </p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {statCards.map((card, i) => (
          <div key={card.label} className={`stat-card animate-slide-up stagger-${i + 1}`}>
            <div className="stat-icon">{card.icon}</div>
            <div className="stat-value" style={{ color: card.color }}>{card.value}</div>
            <div className="stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="dashboard-section">
        <h2 className="section-title">Acciones Rápidas</h2>
        <div className="quick-actions">
          <button className="btn btn-primary" onClick={() => navigate('/admin/teams')}>
            🛡️ Gestionar Equipos
          </button>
          <button className="btn btn-success" onClick={() => navigate('/admin/tournaments')}>
            🏆 Crear Torneo
          </button>
          <button className="btn btn-ghost" onClick={() => navigate('/admin/game-types')}>
            🎮 Tipos de Juego
          </button>
        </div>
      </div>

      {/* Recent Tournaments */}
      <div className="dashboard-section">
        <h2 className="section-title">Últimos Torneos</h2>
        {tournaments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏆</div>
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
              >
                <div className="tournament-row-info">
                  <span className="tournament-row-icon">{t.gameType?.icon || '🎮'}</span>
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
    </div>
  );
}
