import { ArrowUpRight, Globe2, MapPin, Languages } from "lucide-react";
export default function ProgramCard({ program, onClick, index = 0 }) {
  const language = /inglés/i.test(program.nombre);
  const Icon = language
    ? Languages
    : program.ambito === "internacional"
      ? Globe2
      : MapPin;
  return (
    <button
      className={`program-card tone-${index % 4}`}
      onClick={() => onClick(program)}
    >
      <div className="program-art">
        <Icon size={68} strokeWidth={0.8} />
        <div className="program-orbit" />
        <span className="program-tag">
          {language
            ? "Idiomas"
            : program.ambito === "internacional"
              ? "Internacional"
              : "Nacional"}
        </span>
        <ArrowUpRight className="program-arrow" size={19} />
      </div>
      <div className="program-content">
        <h3>{program.nombre}</h3>
        <p>{program.descripcion}</p>
        <span className="program-bottom">
          Preparar mis documentos <ArrowUpRight size={16} />
        </span>
      </div>
    </button>
  );
}
