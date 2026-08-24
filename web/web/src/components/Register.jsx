import { useState } from 'react';
import { UserPlus, GraduationCap } from 'lucide-react';

function Register({ onRegister, onNavigateToLogin }) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al registrarse');
      }
      onRegister(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center animate-fade-in" style={{ minHeight: '60vh' }}>
      <div className="glass-panel w-full" style={{ maxWidth: '400px' }}>
        <div className="flex flex-col items-center mb-6">
          <div style={{ background: 'var(--glass-bg)', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
            <GraduationCap size={40} style={{ color: 'var(--primary-color)' }} />
          </div>
          <h2 className="text-2xl font-bold text-gradient">Crear Cuenta</h2>
          <p className="text-muted mt-2 text-center text-sm">
            Únete a Career-Fit para evaluar tu perfil
          </p>
        </div>

        {error && (
          <div className="glass-panel text-danger mb-4 p-4 text-sm" style={{ borderColor: 'var(--danger)' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium">Nombre Completo</label>
            <input 
              type="text" 
              className="input-field" 
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Juan Pérez"
              required 
            />
          </div>
          <div>
            <label className="text-sm font-medium">Correo Electrónico</label>
            <input 
              type="email" 
              className="input-field" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required 
            />
          </div>
          <div>
            <label className="text-sm font-medium">Contraseña</label>
            <input 
              type="password" 
              className="input-field" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              required 
            />
          </div>
          <button type="submit" className="btn mt-2" disabled={loading}>
            <UserPlus size={18} />
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-6">
          ¿Ya tienes una cuenta?{' '}
          <button onClick={onNavigateToLogin} className="text-primary font-medium" style={{ color: 'var(--primary-color)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
            Inicia sesión aquí
          </button>
        </p>
      </div>
    </div>
  );
}

export default Register;
