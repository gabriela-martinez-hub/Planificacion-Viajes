# Tratamiento de datos personales (uso académico)

> Versión académica (T-26), 2026-11-09. Redactada por Claude; debe aprobarla el
> usuario. No es asesoría legal.

## Alcance

El "Planificador de viajes del Eje Cafetero" es un proyecto académico del curso
de Sistemas Inteligentes, sin ánimo de lucro y sin usuarios públicos. Solo lo
usan los integrantes del equipo y los evaluadores del curso, con cuentas de
Google registradas como usuarios de prueba.

Si en algún momento se abre a otras personas, este documento se reemplaza por
una política completa según la Ley 1581 de 2012 y el Decreto 1377 de 2013.

## Datos que guarda la aplicación

- De la cuenta de Google: nombre, correo y foto de perfil.
- Los viajes, metas de ahorro y aportes que registre quien prueba la aplicación.
- Los check-ins: lugar, fecha y hora, si quedó verificado, distancia al lugar y
  precisión del GPS.

Al hacer check-in, el dispositivo envía su ubicación una sola vez. El servidor la
compara con la del lugar y la descarta: **no se guardan las coordenadas**.

Sin cuenta se puede explorar y generar itinerarios; en ese caso todo queda en el
dispositivo y no se envía ningún dato personal.

## Para qué se usan

Solo para que la aplicación funcione y para evaluar el proyecto en el curso. No
se venden, no se comparten con fines comerciales y no se usan para publicidad.

## Servicios externos

- Supabase: base de datos y autenticación.
- Google: inicio de sesión.
- Open-Meteo: recibe solo coordenadas de municipios y atracciones del catálogo.
- OpenStreetMap: el navegador descarga las imágenes del mapa y sus servidores
  ven la dirección IP, como en cualquier sitio web.

## Seguridad y borrado

- Cada cuenta solo puede leer y modificar sus propios datos (RLS en la base).
- La opción "Eliminar mi cuenta y mis datos" del perfil borra la cuenta, los
  viajes, las metas, los check-ins y las insignias.
- Al terminar el curso se eliminan las cuentas de prueba y los datos.
