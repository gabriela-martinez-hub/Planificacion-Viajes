// Puente entre el formulario del planificador y el generador de itinerario
// (T-11). Arma la EntradaItinerario a partir del formulario validado y del
// catálogo leído de Supabase. Función pura para poder probarla sin React.

import type {
  Atraccion,
  Municipio,
  OrigenExterno,
  RutaBus,
  TarifaReferencia,
} from '@/domain/catalogo/esquemas';
import type {
  CatalogoItinerario,
  ClimaDia,
  EntradaItinerario,
} from '@/domain/itinerario';
import type { FormularioViaje } from '@/domain/viaje/esquemas';

export interface DatosCatalogo {
  municipios: Municipio[];
  origenesExternos: OrigenExterno[];
  atracciones: Atraccion[];
  rutasBus: RutaBus[];
  tarifas: TarifaReferencia[];
}

/** Arma el subconjunto de catálogo que consume el generador. */
export function catalogoItinerario(datos: DatosCatalogo): CatalogoItinerario {
  return {
    municipios: datos.municipios,
    origenesExternos: datos.origenesExternos,
    atracciones: datos.atracciones,
    rutasBus: datos.rutasBus,
    tarifas: datos.tarifas,
  };
}

/**
 * Construye la entrada del generador. El clima se pasa aparte (lo provee T-17);
 * por defecto todos los días se tratan como secos.
 */
export function armarEntrada(
  formulario: FormularioViaje,
  datos: DatosCatalogo,
  climaPorDia: ClimaDia[] = [],
): EntradaItinerario {
  return {
    catalogo: catalogoItinerario(datos),
    origenNodoId: formulario.origenNodoId,
    fechaInicio: formulario.fechaInicio,
    fechaFin: formulario.fechaFin,
    incluyeRegreso: formulario.incluyeRegreso,
    viajeros: formulario.viajeros,
    estilos: formulario.estilos,
    nivel: formulario.nivel,
    municipiosElegidos: formulario.municipiosElegidos,
    atraccionesObligatorias: formulario.atraccionesObligatorias,
    limiteJornadaMin: formulario.limiteJornadaMin,
    climaPorDia,
  };
}
