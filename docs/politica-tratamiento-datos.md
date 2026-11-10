# Política de tratamiento de datos personales

> **Borrador (T-26), 2026-11-09.** Lo redactó Claude y debe aprobarlo el
> usuario. No es asesoría legal. Los campos entre corchetes `[...]` faltan por
> completar. Marco: Ley 1581 de 2012 y Decreto 1377 de 2013 (compilado en el
> Decreto 1074 de 2015).

## 1. Responsable del tratamiento

- Nombre: [nombre de los responsables del proyecto]
- Calidad: estudiantes del curso de Sistemas Inteligentes, [universidad y
  programa]. La aplicación es un proyecto académico sin ánimo de lucro.
- Correo de contacto para consultas y reclamos: [correo]

## 2. Alcance

Esta política aplica a los datos personales que se tratan en la aplicación
"Planificador de viajes del Eje Cafetero" (en adelante, la aplicación). Se puede
explorar el catálogo y generar un itinerario sin cuenta; en ese caso el
itinerario se guarda solo en el dispositivo y no se recibe ningún dato personal.

## 3. Datos que se tratan

Con una cuenta (inicio de sesión con Google):

| Dato | Origen | Para qué se usa |
|---|---|---|
| Nombre, correo electrónico y foto de perfil | Cuenta de Google | Identificar la cuenta y mostrar el perfil |
| Viajes: fechas, punto de partida, viajeros, preferencias, presupuesto, itinerario | El usuario | Guardar y mostrar sus viajes |
| Metas de ahorro y aportes registrados | El usuario | Calcular el progreso de la meta |
| Check-ins: lugar, fecha y hora del servidor, si quedó verificado, distancia al lugar y precisión del GPS | El usuario y su dispositivo | Verificar visitas y otorgar insignias |
| Fecha en que aceptó esta política | La aplicación | Probar la autorización |

Ubicación: al hacer check-in, el dispositivo envía su posición una sola vez. El
servidor la compara con la del lugar y la descarta. **No se guardan las
coordenadas del usuario**; solo la distancia al lugar y la precisión del GPS.

No se tratan datos sensibles ni se piden datos de pago o bancarios. La
aplicación no está dirigida a menores de 18 años.

## 4. Finalidades

1. Crear y administrar la cuenta.
2. Guardar, mostrar y editar los viajes del usuario.
3. Registrar check-ins y otorgar insignias.
4. Calcular presupuestos y metas de ahorro.
5. Evaluar el proyecto en el marco académico del curso, con datos agregados y sin
   identificar a las personas.

Los datos no se venden, no se ceden a terceros con fines comerciales y no se usan
para publicidad.

## 5. Encargados y transmisión internacional

Para funcionar, la aplicación usa proveedores que tratan datos por cuenta del
responsable (encargados) y que tienen servidores fuera de Colombia:

- Supabase: base de datos y autenticación. Región del proyecto: [región elegida
  en Supabase].
- Google: inicio de sesión (OAuth). Google trata los datos de la cuenta según su
  propia política de privacidad.
- [Proveedor de alojamiento web, p. ej. Vercel o Netlify]: sirve la aplicación.

Al aceptar esta política, el usuario autoriza la transmisión internacional de
sus datos a estos encargados.

Otros servicios que la aplicación consulta y que no reciben datos de la cuenta:

- Open-Meteo (clima): recibe solo las coordenadas de los municipios y
  atracciones del catálogo.
- OpenStreetMap (mapa): el navegador descarga las imágenes del mapa
  directamente de sus servidores, que reciben la dirección IP del usuario como
  cualquier sitio web.

## 6. Derechos del titular

Según el artículo 8 de la Ley 1581 de 2012, el usuario puede:

1. Conocer, actualizar y rectificar sus datos.
2. Pedir prueba de la autorización que dio.
3. Saber cómo se han usado sus datos.
4. Presentar quejas ante la Superintendencia de Industria y Comercio (SIC).
5. Revocar la autorización y pedir que se borren sus datos.
6. Consultar sus datos gratis.

La aplicación tiene la opción **"Eliminar mi cuenta y mis datos"** en el perfil.
Borra la cuenta, los viajes, las metas de ahorro, los check-ins y las insignias.

## 7. Consultas y reclamos

- Se envían al correo del punto 1, indicando el nombre y el correo de la cuenta.
- Consultas: se responden en máximo 10 días hábiles, prorrogables 5 días hábiles
  más avisando el motivo (artículo 14 de la Ley 1581 de 2012).
- Reclamos (corrección, actualización, supresión o incumplimiento): se responden
  en máximo 15 días hábiles, prorrogables 8 días hábiles más avisando el motivo
  (artículo 15). Si el reclamo está incompleto, se pide completarlo en los 5
  días siguientes; si pasan 2 meses sin respuesta, se entiende que se desistió.
- Antes de acudir a la SIC, el titular debe haber agotado este trámite.

## 8. Seguridad y conservación

- Cada usuario solo puede leer y modificar sus propios datos (políticas de
  seguridad por fila en la base de datos).
- La verificación de check-ins e insignias se hace en el servidor.
- Los datos se conservan mientras la cuenta exista. Al eliminar la cuenta se
  borran. Al terminar el proyecto académico, [fecha o condición], se eliminarán
  las cuentas y la base de datos.

## 9. Autorización

Antes del primer check-in, la aplicación muestra esta política y pide aceptarla
de forma explícita. La fecha de aceptación queda guardada. Sin aceptación se
puede usar la aplicación, pero no hacer check-in.

## 10. Vigencia y cambios

Vigente desde [fecha de publicación]. Si cambia de forma sustancial, se avisará
en la aplicación y se pedirá aceptar de nuevo.
