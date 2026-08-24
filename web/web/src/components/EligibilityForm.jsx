import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

export default function EligibilityForm({ tiposMovilidad, onSubmit, loading }) {
  const [formData, setFormData] = useState({
    carrera: '',
    semestre: '',
    promedio: '',
    creditosMatriculados: '',
    tieneConvenioOInvitacion: false,
    tieneResolucionConsejoCarrera: false,
    tipoMovilidadId: ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      semestre: parseInt(formData.semestre, 10),
      promedio: parseFloat(formData.promedio),
      creditosMatriculados: parseInt(formData.creditosMatriculados, 10)
    });
  };

  return (
    <div className="glass-panel">
      <h2 className="text-2xl font-bold mb-6">Tus Datos</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        
        <div>
          <label className="text-sm font-medium text-muted">Tipo de Movilidad</label>
          <select 
            name="tipoMovilidadId" 
            className="input-field" 
            value={formData.tipoMovilidadId} 
            onChange={handleChange} 
            required
          >
            <option value="">Selecciona el programa...</option>
            {tiposMovilidad.map(tipo => (
              <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-muted">Carrera</label>
          <input 
            type="text" 
            name="carrera" 
            className="input-field" 
            placeholder="Ej. Ingeniería en Software" 
            value={formData.carrera} 
            onChange={handleChange} 
            required 
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted">Semestre Actual</label>
            <input 
              type="number" 
              name="semestre" 
              className="input-field" 
              placeholder="Ej. 5" 
              min="1" max="20"
              value={formData.semestre} 
              onChange={handleChange} 
              required 
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted">Promedio Acumulado</label>
            <input 
              type="number" 
              step="0.01" 
              name="promedio" 
              className="input-field" 
              placeholder="Ej. 17.5" 
              min="0" max="20"
              value={formData.promedio} 
              onChange={handleChange} 
              required 
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-muted">Créditos/Horas Matriculados</label>
          <input 
            type="number" 
            name="creditosMatriculados" 
            className="input-field" 
            placeholder="Ej. 15" 
            min="0"
            value={formData.creditosMatriculados} 
            onChange={handleChange} 
            required 
          />
        </div>

        <div className="mt-2 flex flex-col gap-3">
          <label className="checkbox-container">
            <input 
              type="checkbox" 
              name="tieneConvenioOInvitacion" 
              checked={formData.tieneConvenioOInvitacion} 
              onChange={handleChange} 
            />
            <span className="text-sm">Cuento con convenio de la universidad, carta de invitación o reconocimiento a un evento.</span>
          </label>
          
          <label className="checkbox-container">
            <input 
              type="checkbox" 
              name="tieneResolucionConsejoCarrera" 
              checked={formData.tieneResolucionConsejoCarrera} 
              onChange={handleChange} 
            />
            <span className="text-sm">Tengo una resolución de Consejo de Carrera aprobada para mi proyecto de movilidad.</span>
          </label>
        </div>

        <button type="submit" className="btn mt-4 w-full" disabled={loading}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          {loading ? 'Evaluando...' : 'Evaluar Elegibilidad'}
        </button>
      </form>
    </div>
  );
}
