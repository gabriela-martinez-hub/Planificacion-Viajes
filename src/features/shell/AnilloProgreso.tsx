// Anillo de progreso (SVG) para el contador de estampas del álbum. Muestra la
// fracción de municipios visitados con un trazo ámbar sobre un aro crema.
import { motion } from 'framer-motion';
import { useReducedMotion } from 'framer-motion';

interface Props {
  /** Fracción 0–1. */
  fraccion: number;
  /** Diámetro en px. */
  tamano?: number;
  /** Contenido central (p. ej. el número). */
  children?: React.ReactNode;
}

export function AnilloProgreso({ fraccion, tamano = 44, children }: Props) {
  const reducir = useReducedMotion();
  const grosor = 4;
  const r = (tamano - grosor) / 2;
  const circunferencia = 2 * Math.PI * r;
  const avance = Math.max(0, Math.min(1, fraccion));

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: tamano, height: tamano }}
    >
      <svg
        width={tamano}
        height={tamano}
        viewBox={`0 0 ${tamano} ${tamano}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={tamano / 2}
          cy={tamano / 2}
          r={r}
          fill="none"
          stroke="#ece2cf"
          strokeWidth={grosor}
        />
        <motion.circle
          cx={tamano / 2}
          cy={tamano / 2}
          r={r}
          fill="none"
          stroke="#e39f2c"
          strokeWidth={grosor}
          strokeLinecap="round"
          strokeDasharray={circunferencia}
          initial={{ strokeDashoffset: circunferencia }}
          animate={{ strokeDashoffset: circunferencia * (1 - avance) }}
          transition={
            reducir ? { duration: 0 } : { duration: 0.8, ease: 'easeOut' }
          }
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-selva-800">
        {children}
      </span>
    </div>
  );
}
