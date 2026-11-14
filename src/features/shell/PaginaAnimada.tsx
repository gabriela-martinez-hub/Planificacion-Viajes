// Envoltura de página: anima la entrada (fundido + leve desplazamiento) al
// montar la sección. Se usa en la raíz de cada pantalla. Respeta la preferencia
// de reducir movimiento. Al ser el contenedor de cada ruta, se monta una sola
// vez por navegación (React Router intercambia la ruta), sin remontar árboles
// ni abortar peticiones en vuelo.
import { motion, useReducedMotion } from 'framer-motion';

interface Props {
  children: React.ReactNode;
  className?: string;
}

export function PaginaAnimada({ children, className }: Props) {
  const reducir = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reducir ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reducir ? { duration: 0 } : { duration: 0.28, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
