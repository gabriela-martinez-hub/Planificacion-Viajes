// Ensambla el catálogo del seed y lo valida con Zod. Es el punto único desde el
// que el script de carga (scripts/cargar-seed.ts) y las pruebas obtienen los
// datos ya validados. Si una fila no cumple el esquema, construirSeed lanza.
import {
  catalogoSchema,
  type Catalogo,
} from '../../../src/domain/catalogo/esquemas';
import { departamentos } from './departamentos';
import { municipios } from './municipios';
import { origenesExternos } from './origenes-externos';
import { atracciones } from './atracciones';
import { rutasBus } from './rutas-bus';
import { tarifasReferencia } from './tarifas';
import { climaMensual } from './clima';
import { rutasTematicas, rutaItems } from './rutas-tematicas';
import { insignias } from './insignias';

/**
 * Construye el catálogo y lo valida. Lanza ZodError si algún dato no cumple el
 * esquema. El radio de check-in de los municipios toma el valor por defecto del
 * esquema (1500 m) salvo que se especifique en los datos.
 */
export function construirSeed(): Catalogo {
  const sinValidar = {
    departamentos,
    municipios,
    origenes_externos: origenesExternos,
    atracciones,
    rutas_bus: rutasBus,
    tarifas_referencia: tarifasReferencia,
    clima_mensual: climaMensual,
    rutas_tematicas: rutasTematicas,
    ruta_items: rutaItems,
    insignias,
  };
  // parse aplica los valores por defecto del esquema (p. ej. radio_checkin_m).
  return catalogoSchema.parse(sinValidar);
}
