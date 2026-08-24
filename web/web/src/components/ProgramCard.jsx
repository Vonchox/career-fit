import { ChevronRight } from 'lucide-react';

export default function ProgramCard({ program, onClick }) {
  // Select a background color or pattern based on the type of program to mimic Moodle
  const isInternational = program.ambito === 'internacional';
  const bgClass = isInternational ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-green-600 to-emerald-500';

  return (
    <div 
      className="glass-panel overflow-hidden cursor-pointer hover:shadow-xl transition-all p-0 flex flex-col h-full"
      onClick={() => onClick(program)}
      style={{ padding: 0 }}
    >
      <div className={`${bgClass} h-32 w-full relative`} style={{ minHeight: '120px' }}>
        <div className="absolute inset-0 opacity-20" style={{ 
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', 
          backgroundSize: '20px 20px' 
        }}></div>
      </div>
      <div className="p-4 flex flex-col flex-1 bg-white">
        <h3 className="text-lg font-bold text-gray-800 mb-2">{program.nombre}</h3>
        <p className="text-sm text-gray-600 flex-1">{program.descripcion}</p>
        
        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary-color">
            {program.ambito}
          </span>
          <button className="text-primary-color bg-gray-50 hover:bg-gray-100 p-1 rounded-full transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
