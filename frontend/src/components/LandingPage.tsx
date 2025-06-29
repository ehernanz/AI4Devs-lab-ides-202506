import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleAddCandidate = () => {
    navigate('/add-candidate');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="landing-page">
      <div className="landing-container">
        <div className="user-info">
          <span className="welcome-text">Bienvenido, {user.username}</span>
          <button onClick={handleLogout} className="logout-btn">
            Cerrar Sesión
          </button>
        </div>

        <h1 className="landing-title">Gestor de Candidaturas</h1>
        <p className="landing-subtitle">Sistema de gestión de candidatos</p>
        
        <div className="menu-container">
          <h2 className="menu-title">Menú Principal</h2>
          <div className="menu-options">
            <button 
              className="menu-button add-candidate-btn"
              onClick={handleAddCandidate}
            >
              <span className="button-icon">➕</span>
              <span className="button-text">Añadir Candidato</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage; 