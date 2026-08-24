import { useState, useEffect } from 'react';
import EligibilityForm from './components/EligibilityForm';
import EvaluationResult from './components/EvaluationResult';
import Login from './components/Login';
import Register from './components/Register';
import ProgramCard from './components/ProgramCard';
import Chatbot from './components/Chatbot';
import { GraduationCap, LogOut, ArrowLeft } from 'lucide-react';
import './index.css';

function App() {
  const [tiposMovilidad, setTiposMovilidad] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [evaluacion, setEvaluacion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [view, setView] = useState('login'); // 'login', 'register', or 'app'

  useEffect(() => {
    if (token) {
      fetch('http://localhost:3000/api/tipos-movilidad')
        .then(res => res.json())
        .then(data => setTiposMovilidad(data))
        .catch(err => {
          console.error(err);
          setError('Error al conectar con el servidor API');
        });
    }
  }, [token]);

  const handleLogin = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setEvaluacion(null);
    setSelectedProgram(null);
  };

  const handleBackToDashboard = () => {
    setSelectedProgram(null);
    setEvaluacion(null);
    setError(null);
  };

  const handleEvaluate = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:3000/api/evaluar', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...formData, tipoMovilidadId: selectedProgram.id })
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          handleLogout();
          throw new Error('Sesión expirada o inválida. Por favor, inicie sesión nuevamente.');
        }
        if (Array.isArray(data.error)) {
          throw new Error(data.error[0].message);
        }
        throw new Error(data.error || 'Error al evaluar');
      }
      setEvaluacion(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="app-container">
        {view === 'register' ? (
          <Register onRegister={handleLogin} onNavigateToLogin={() => setView('login')} />
        ) : (
          <Login onLogin={handleLogin} onNavigateToRegister={() => setView('register')} />
        )}
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="flex flex-col items-center justify-center text-center mb-8 animate-fade-in relative">
        <button 
          onClick={handleLogout}
          className="absolute right-0 top-0 flex items-center gap-2 text-sm text-muted hover:text-danger transition-colors"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <LogOut size={16} /> Cerrar Sesión
        </button>
        <div style={{ background: 'var(--glass-bg)', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
          <GraduationCap size={48} style={{ color: 'var(--primary-color)' }} />
        </div>
        <h1 className="text-4xl font-bold text-gradient">Career-Fit</h1>
        <p className="text-muted mt-2 text-lg max-w-2xl">
          Portal de Movilidad Académica e Idiomas de la ESPE.
        </p>
        <p className="text-sm mt-4 font-medium" style={{ color: 'var(--primary-color)' }}>
          Bienvenido, {user?.nombre}
        </p>
      </header>

      {/* DASHBOARD VIEW */}
      {!selectedProgram ? (
        <main className="animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
          <div className="mb-6 border-b border-gray-200 pb-2">
            <h2 className="text-2xl font-bold text-gray-800">Programas Disponibles</h2>
            <p className="text-muted">Selecciona un programa o trámite para evaluar tu elegibilidad.</p>
          </div>
          
          {error && (
            <div className="glass-panel text-danger mb-4 p-4 text-sm" style={{ borderColor: 'var(--danger)' }}>
              ⚠️ {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tiposMovilidad.map(programa => (
              <ProgramCard 
                key={programa.id} 
                program={programa} 
                onClick={setSelectedProgram} 
              />
            ))}
          </div>
        </main>
      ) : (
        /* EVALUATION VIEW */
        <main className="animate-fade-in" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
          <button 
            onClick={handleBackToDashboard}
            className="mb-4 flex items-center gap-2 text-sm font-medium hover:underline"
            style={{ color: 'var(--primary-color)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <ArrowLeft size={16} /> Volver al Dashboard
          </button>

          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-800">{selectedProgram.nombre}</h2>
            <p className="text-muted">{selectedProgram.descripcion}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section>
              {error && (
                <div className="glass-panel text-danger mb-4 p-4 text-sm" style={{ borderColor: 'var(--danger)' }}>
                  ⚠️ {error}
                </div>
              )}
              <EligibilityForm 
                tiposMovilidad={tiposMovilidad} // Pasamos esto aunque ya no mostraremos el select
                onSubmit={handleEvaluate} 
                loading={loading}
                hideProgramSelect={true} // Nueva prop para ocultar el selector
              />
            </section>
            <section>
              {evaluacion ? (
                <EvaluationResult data={evaluacion} />
              ) : (
                <div className="glass-panel flex flex-col items-center justify-center text-center h-full" style={{ minHeight: '400px' }}>
                  <div className="text-muted">
                    <GraduationCap size={48} className="mb-4 mx-auto opacity-50" />
                    <h3 className="text-xl font-semibold text-main mb-2">Evaluación Pendiente</h3>
                    <p>Completa y envía el formulario para analizar tu perfil contra los requisitos.</p>
                  </div>
                </div>
              )}
            </section>
          </div>
        </main>
      )}

      {/* CHATBOT GLOBAL */}
      <Chatbot token={token} />
    </div>
  );
}

export default App;
