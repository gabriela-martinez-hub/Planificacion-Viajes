// Todos los textos de interfaz viven aquí (es-CO). Los componentes no llevan
// texto escrito directamente: lo piden con t('seccion.clave') desde '@/i18n'.
// Los marcadores {nombre} se reemplazan con los parámetros de t().
// Moneda, números y fechas no van aquí: se formatean con Intl y el locale es-CO.
// Las claves de rutas.* e insignias.* son las que guarda clave_texto en la base.

export const textos = {
  app: {
    titulo: 'Planificador de viajes del Eje Cafetero',
    descripcion:
      'Planifica viajes por Caldas, Quindío y Risaralda según fechas, presupuesto y clima.',
  },

  comun: {
    cargando: 'Cargando…',
    reintentar: 'Reintentar',
    guardar: 'Guardar',
    cancelar: 'Cancelar',
    eliminar: 'Eliminar',
    confirmar: 'Confirmar',
    cerrar: 'Cerrar',
    volver: 'Volver',
    subir: 'Subir',
    bajar: 'Bajar',
    sinConexion: 'Sin conexión. Estás viendo la última versión guardada.',
    errorGenerico: 'Algo salió mal. Inténtalo de nuevo.',
  },

  nav: {
    inicio: 'Inicio',
    explorar: 'Explorar',
    planificar: 'Planificar',
    misViajes: 'Mis viajes',
    perfil: 'Perfil',
  },

  auth: {
    iniciarSesion: 'Iniciar sesión con Google',
    cerrarSesion: 'Cerrar sesión',
    saludo: 'Hola, {nombre}',
    sinCuenta:
      'Puedes explorar y crear un itinerario sin cuenta. Se guardará solo en este dispositivo.',
    errorInicio: 'No se pudo iniciar sesión con Google. Inténtalo de nuevo.',
  },

  catalogo: {
    titulo: 'Explorar el Eje Cafetero',
    subtitulo: 'Municipios y atracciones de Caldas, Quindío y Risaralda.',
    buscar: 'Buscar municipio o atracción',
    buscarMunicipio: 'Buscar un municipio',
    buscarAtraccion: 'Buscar una atracción',
    filtroDepartamento: 'Departamento',
    filtroEstilo: 'Estilo de viaje',
    todos: 'Todos',
    sinResultados: 'No hay resultados con esos filtros.',
    municipioNoEncontrado:
      'No encontramos ese municipio. El catálogo cubre los 53 municipios de Caldas, Quindío y Risaralda; revisa el nombre o quita los filtros.',
    atraccionNoEncontrada:
      'No encontramos esa atracción con esos filtros. Prueba con otro nombre o cambia el estilo.',
    puebloPatrimonio: 'Pueblo patrimonio',
    cascoUrbano: 'Casco urbano',
    pestanaMunicipios: 'Municipios',
    pestanaAtracciones: 'Atracciones',
    pestanaMapa: 'Mapa',
    conteoMunicipios: '{n} de 53 municipios',
    conteoAtracciones: '{n} atracciones',
    verAtracciones: 'Ver atracciones',
    atraccionesDe: 'Atracciones de {municipio}',
    sinAtracciones: 'Este municipio aún no tiene atracciones cargadas.',
    altitud: 'Altitud',
    metros: '{valor} m s. n. m.',
    duracion: 'Duración aproximada',
    minutos: '{valor} min',
    horario: 'Horario',
    horas: '{apertura} a {cierre}',
    sinHorario: 'Sin horario fijo',
    cerradoLos: 'Cerrado: {dias}',
    entrada: 'Entrada',
    gratis: 'Gratis',
    notaTarifaAdulto:
      'Tarifa general de adulto. El precio puede variar por edad (niños, adulto mayor) o tipo de entrada; consulta el sitio oficial.',
    costoAproximado: 'Costo aproximado, actualizado el {fecha}.',
    fuente: 'Fuente: {fuente}',
    requiereGuia: 'Requiere guía u operador',
    volverLista: 'Volver a la lista',
    estilos: {
      aventura: 'Aventura',
      naturaleza: 'Naturaleza',
      cultura_cafetera: 'Cultura cafetera',
      descanso: 'Descanso',
      gastronomia: 'Gastronomía',
    },
    estadoAcceso: {
      abierta: 'Abierta',
      restringida: 'Acceso restringido',
      cerrada: 'Cerrada',
    },
  },

  planificador: {
    titulo: 'Planifica tu viaje',
    tituloViaje: 'Nombre del viaje',
    elige: 'Elige una opción',
    origen: 'Punto de partida',
    fechaInicio: 'Fecha de ida',
    fechaFin: 'Fecha de regreso',
    viajeros: 'Número de viajeros',
    nivelViaje: 'Nivel del viaje',
    estilos: 'Estilos de viaje',
    estilosTodos: 'Todos',
    municipios: 'Municipios que quieres visitar',
    municipiosElegidos: '{n} municipio(s) elegido(s)',
    obligatorias: 'Atracciones que no te quieres perder',
    limiteJornada: 'Horas máximas de actividad por día',
    incluyeRegreso: 'Incluir el regreso al punto de partida',
    generar: 'Generar itinerario',
    guardarViaje: 'Guardar viaje',
    viajeGuardado: 'Viaje guardado en tu cuenta.',
    viajeRestaurado:
      'Recuperamos el viaje que preparaste. Pulsa Guardar viaje para conservarlo en tu cuenta.',
    errorGuardar: 'No se pudo guardar el viaje. Intenta de nuevo.',
    iniciaParaGuardar: 'Inicia sesión con Google para guardar este viaje.',
    iniciaParaVerViajes: 'Inicia sesión con Google para ver tus viajes.',
    sinViajes: 'Todavía no has guardado ningún viaje.',
    dia: 'Día {numero}',
    diaLluvioso: 'Día lluvioso',
    soloTraslado: 'Día de solo traslado',
    ordenDestinos: 'Orden de los destinos',
    ordenDestinosAyuda:
      'Puedes cambiar el orden en que visitas los municipios. Los traslados se recalculan solos.',
    ordenNoOptimo:
      'Este orden lo elegiste tú y puede no ser el más corto en tiempo de viaje.',
    trasladoFijo:
      'El traslado es fijo. Para cambiar su destino, reordena los destinos arriba.',
    subir: 'Subir',
    bajar: 'Bajar',
    fijar: 'Fijar',
    desfijar: 'Quitar fijado',
    fijado: 'Fijado: no se mueve al reorganizar',
    sinFactible: 'No se pudo armar un itinerario con estas condiciones.',
    nivel: {
      economico: 'Económico',
      medio: 'Medio',
      alto: 'Alto',
    },
    tipoItem: {
      actividad: 'Actividad',
      traslado: 'Traslado',
      alojamiento: 'Alojamiento',
      comida: 'Comida',
      libre: 'Tiempo libre',
    },
  },

  presupuesto: {
    titulo: 'Presupuesto',
    modoFijo: 'Tengo un monto fijo',
    modoSonado: 'Viaje soñado',
    montoTotal: 'Presupuesto total del grupo',
    total: 'Total estimado',
    porPersona: 'Por persona',
    aproximado:
      'Los costos son aproximados (tarifas de referencia con fuente).',
    calcular: 'Ajustar a mi presupuesto',
    nivelFinal:
      'Nivel tras el ajuste: alojamiento {alojamiento}, comida {comida}',
    actividadesQuitadas:
      'Se quitaron {n} actividad(es) no obligatoria(s) para ajustar el presupuesto.',
    noAlcanza:
      'El presupuesto no alcanza. El mínimo para este viaje es {minimo}. Prueba acortar el viaje o cambiar de nivel.',
    ajustado: 'Itinerario ajustado a tu presupuesto',
    desglose: {
      transporte: 'Transporte',
      alojamiento: 'Alojamiento',
      comida: 'Comida',
      entradas: 'Entradas y actividades',
    },
    meta: {
      titulo: 'Meta de ahorro',
      objetivo: 'Monto objetivo',
      frecuencia: 'Frecuencia de ahorro',
      semanal: 'Semanal',
      mensual: 'Mensual',
      cuota: 'Cuota sugerida',
      registrarAporte: 'Registrar aporte',
      cumplida: '¡Meta cumplida!',
      vencida: 'La fecha del viaje ya pasó.',
    },
  },

  clima: {
    pronostico: 'Pronóstico',
    estimacion: 'Estimación con promedios históricos',
    avisoSinRed:
      'No se pudo consultar el pronóstico. Se muestra la estimación con promedios históricos.',
    lluvia: 'Probabilidad de lluvia: {probabilidad}',
    reorganizar: 'Reorganizar por clima',
    vistaPrevia: 'Vista previa de los cambios',
    aplicar: 'Aplicar cambios',
    atribucion: 'Datos del clima: Open-Meteo',
  },

  checkin: {
    registrar: 'Hacer check-in',
    sinConexion: 'El check-in necesita conexión a internet.',
    verificado: 'Check-in verificado',
    manual: 'Registro manual (no verificado)',
    fueraDeRadio:
      'Estás fuera del área del lugar. Puedes hacer un registro manual.',
    precisionBaja:
      'La ubicación no es lo bastante precisa. Inténtalo al aire libre.',
  },

  privacidad: {
    titulo: 'Tratamiento de datos personales',
    consentimiento:
      'Para hacer check-in usamos tu ubicación una sola vez para compararla con la del lugar. No guardamos tus coordenadas.',
    aceptar: 'Acepto',
    verPolitica: 'Ver la política de tratamiento de datos',
  },

  perfil: {
    titulo: 'Mi perfil',
    municipiosVisitados: 'Municipios visitados',
    progreso: '{visitados} de {total}',
    eliminarCuenta: 'Eliminar mi cuenta y mis datos',
    confirmarEliminar:
      'Se borrarán tus viajes, check-ins e insignias. Esta acción no se puede deshacer.',
  },

  rutas: {
    cafe: 'Ruta del café',
    termales: 'Ruta de termales',
    pueblosPatrimonio: 'Pueblos patrimonio',
  },

  insignias: {
    titulo: 'Insignias',
    verificada: 'Verificada',
    noVerificada: 'Con registros manuales',
    caldas: 'Caldas completo',
    quindio: 'Quindío completo',
    risaralda: 'Risaralda completo',
    ejeCafetero: 'Eje Cafetero',
    rutaPueblosPatrimonio: 'Pueblos patrimonio',
    rutaCafe: 'Ruta del café',
    rutaTermales: 'Ruta de termales',
  },
} as const;

/** Misma forma que `textos`, con cualquier texto. Otro idioma tendría este tipo. */
type Forma<T> = { [K in keyof T]: T[K] extends string ? string : Forma<T[K]> };
export type Textos = Forma<typeof textos>;

export default textos;
