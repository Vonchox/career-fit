import { Sprout } from "lucide-react";
export default function Brand({ onClick }) {
  return (
    <button
      className="brand"
      onClick={onClick}
      aria-label="Career-Fit, ir al inicio"
    >
      <span className="brand-icon">
        <Sprout size={23} />
      </span>
      career<span className="brand-light">fit</span>
      <span className="brand-dot">.</span>
    </button>
  );
}
