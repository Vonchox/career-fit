import { CheckCircle, XCircle, FileText, ExternalLink, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function EvaluationResult({ data }) {
  const { esViable, resultado, requisitos, tipoMovilidad, aiAnalysis } = data;

  return (
    <div className="glass-panel animate-fade-in flex flex-col h-full overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Resultado de Elegibilidad</h2>
        <p className="text-muted">Programa: {tipoMovilidad.nombre}</p>
      </div>

      <div className={`p-4 rounded-lg mb-6 flex items-center gap-4 ${esViable ? 'border-success' : 'border-warning'} border`} style={{
        backgroundColor: esViable ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
        borderColor: esViable ? 'var(--success)' : 'var(--warning)'
      }}>
        {esViable ? (
          <CheckCircle size={32} className="text-success" />
        ) : (
          <XCircle size={32} className="text-warning" />
        )}
        <div>
          <h3 className={`text-xl font-bold ${esViable ? 'text-success' : 'text-warning'}`}>
            {esViable ? 'Candidato Viable' : 'No Viable Todavía'}
          </h3>
          <p className="text-sm text-main opacity-90 mt-1">
            {esViable 
              ? 'Cumples con los requisitos iniciales. Puedes iniciar tu proceso de postulación.' 
              : 'Te faltan algunos requisitos por cumplir.'}
          </p>
        </div>
      </div>

      {aiAnalysis && (
        <div className="mb-6 p-5 rounded-lg border border-primary/20 bg-primary/5" style={{ backgroundColor: 'rgba(0, 102, 51, 0.05)', borderColor: 'rgba(0, 102, 51, 0.2)' }}>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--primary-color)' }}>
            <Bot size={20} /> Análisis Profesional
          </h3>
          <div className="text-sm text-main leading-relaxed markdown-content">
            <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
          </div>
        </div>
      )}

      <h3 className="text-lg font-semibold mb-3 border-b border-gray-300 pb-2">Detalle de Requisitos</h3>
      <div className="flex flex-col gap-3 flex-1 mb-4">
        {requisitos.map(req => (
          <div key={req.id} className="flex gap-3 items-start p-3 bg-white rounded-lg border border-gray-200">
            <div className="mt-1">
              {req.cumplido ? <CheckCircle size={18} className="text-success" /> : <XCircle size={18} className="text-danger" />}
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-sm flex items-center justify-between">
                {req.nombre}
                <span className="text-xs text-muted font-normal bg-gray-100 px-2 py-0.5 rounded border border-gray-200">{req.articuloReglamento}</span>
              </h4>
              <p className="text-xs text-muted mt-1">{req.descripcion}</p>
              {!req.cumplido && (
                <p className="text-xs text-danger mt-1 font-medium bg-danger/10 px-2 py-1 rounded inline-block mt-2" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                  Tu valor: {req.valorEstudiante !== undefined ? String(req.valorEstudiante) : 'N/A'}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {esViable && (
        <div className="mt-auto animate-fade-in">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--primary-color)' }}>
            <FileText size={16} /> Documentos a reunir (según Art. 29):
          </h3>
          <ul className="text-xs text-muted flex flex-col gap-2 mb-4 pl-6 list-disc">
            {requisitos.filter(r => r.documentoRespaldo).map((r, i) => (
              <li key={i}>{r.documentoRespaldo}</li>
            ))}
            <li>Formularios oficiales de postulación ESPE</li>
          </ul>
          
          <a 
            href="https://ube.espe.edu.ec/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn w-full justify-center mt-2"
          >
            <ExternalLink size={16} />
            Descargar Formatos Oficiales (UBE)
          </a>
        </div>
      )}
    </div>
  );
}
