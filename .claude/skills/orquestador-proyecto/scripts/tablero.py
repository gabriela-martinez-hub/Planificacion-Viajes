#!/usr/bin/env python3
"""Tablero del proyecto Planificacion-Viajes (solo biblioteca estándar).

Fuente de verdad: control/tablero.json. Vista legible: TABLERO.md.

Comandos:
  mostrar                 Resumen en texto: avance, ruta crítica, bloqueos, riesgos, alertas.
  render                  Regenera TABLERO.md desde el JSON.
  validar                 Revisa el JSON (dependencias, ciclos, valores). Sale con 1 si hay errores.
  cambio '<json>'         Aplica operaciones y las registra en el historial.
  servir [--puerto N]     Interfaz web local (127.0.0.1) para que el usuario edite el tablero.

Formato de `cambio`:
  {"por": "claude", "ops": [ {...}, {...} ]}   (o una sola operación: {"por": "...", "op": ...})

Operaciones:
  {"op": "tarea_agregar", "tarea": {"titulo": "...", "frente": "F-a", "grupo": "ruta_critica",
       "responsable": "claude", "prioridad": "P2", "dependencias": ["T-03"], "notas": "..."}}
  {"op": "riesgo_agregar", "riesgo": {"descripcion": "...", "impacto": "alto",
       "probabilidad": "media", "mitigacion": "...", "responsable": "usuario"}}
  {"op": "idea_agregar", "idea": {"descripcion": "...", "origen": "..."}}
  {"op": "campo", "id": "T-05", "campo": "estado", "valor": "hecha"}   (sirve para T-, R- e I-)
  {"op": "mover", "id": "T-05", "posicion": 2}   (posición 1-based dentro de su grupo)
  {"op": "nota", "id": "T-05", "texto": "..."}   (agrega una línea a las notas)

Nada se borra: las tareas se descartan con estado "descartada"; el historial solo crece.
"""

import json
import os
import sys
import tempfile
import time
from contextlib import contextmanager
from datetime import date, datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

try:
    import fcntl  # Unix
except ImportError:  # Windows no tiene fcntl
    fcntl = None


def _raiz_proyecto() -> Path:
    env = os.environ.get("CLAUDE_PROJECT_DIR")
    if env:
        return Path(env)
    # scripts/ -> orquestador-proyecto/ -> skills/ -> .claude/ -> raíz
    return Path(__file__).resolve().parents[4]


RAIZ = _raiz_proyecto()
TABLERO_JSON = RAIZ / "control" / "tablero.json"
TABLERO_MD = RAIZ / "TABLERO.md"
BLOQUEO = RAIZ / "control" / ".tablero.lock"

ESTADOS_TAREA = ["pendiente", "en_curso", "bloqueada", "hecha", "descartada"]
ESTADOS_RIESGO = ["activo", "mitigado", "materializado", "cerrado"]
ESTADOS_IDEA = ["nueva", "evaluada", "convertida", "descartada"]
PRIORIDADES = ["P1", "P2", "P3", "P4"]
GRUPOS = ["ruta_critica", "paralelo"]
NIVELES = ["bajo", "medio", "alto"]
NIVELES_PROB = ["baja", "media", "alta"]

CAMPOS_TAREA = {"titulo", "frente", "grupo", "responsable", "prioridad", "dependencias",
                "estado", "notas", "bloqueado_por", "vence"}
CAMPOS_RIESGO = {"descripcion", "impacto", "probabilidad", "mitigacion", "responsable", "estado"}
CAMPOS_IDEA = {"descripcion", "origen", "estado"}


class ErrorTablero(Exception):
    pass


# ---------------------------------------------------------------- E/S

def cargar() -> dict:
    if not TABLERO_JSON.exists():
        raise ErrorTablero(f"No existe {TABLERO_JSON}")
    with TABLERO_JSON.open(encoding="utf-8") as f:
        return json.load(f)


def guardar(datos: dict) -> None:
    """Escritura atómica: archivo temporal en la misma carpeta + os.replace."""
    datos["actualizado"] = datetime.now().isoformat(timespec="seconds")
    datos["revision"] = int(datos.get("revision", 0)) + 1
    fd, tmp = tempfile.mkstemp(dir=TABLERO_JSON.parent, prefix=".tablero.", suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(datos, f, ensure_ascii=False, indent=2)
            f.write("\n")
        os.replace(tmp, TABLERO_JSON)
    except BaseException:
        if os.path.exists(tmp):
            os.unlink(tmp)
        raise


@contextmanager
def bloqueo():
    BLOQUEO.parent.mkdir(parents=True, exist_ok=True)
    if fcntl is not None:
        # Unix: bloqueo de archivo con fcntl.
        with BLOQUEO.open("w") as f:
            fcntl.flock(f, fcntl.LOCK_EX)
            try:
                yield
            finally:
                fcntl.flock(f, fcntl.LOCK_UN)
    else:
        # Windows (sin fcntl): bloqueo por creación exclusiva del archivo.
        intentos = 0
        while True:
            try:
                fd = os.open(str(BLOQUEO), os.O_CREAT | os.O_EXCL | os.O_WRONLY)
                break
            except FileExistsError:
                intentos += 1
                if intentos > 100:
                    raise ErrorTablero(
                        f"No se pudo tomar el bloqueo {BLOQUEO}; "
                        "si no hay otro proceso, borra ese archivo."
                    )
                time.sleep(0.1)
        try:
            yield
        finally:
            os.close(fd)
            try:
                os.unlink(BLOQUEO)
            except FileNotFoundError:
                pass


# ---------------------------------------------------------------- utilidades

def _por_id(datos: dict) -> dict:
    todo = {}
    for clave in ("tareas", "riesgos", "ideas"):
        for item in datos.get(clave, []):
            todo[item["id"]] = item
    return todo


def _siguiente_id(items: list, prefijo: str) -> str:
    n = 0
    for it in items:
        try:
            n = max(n, int(it["id"].split("-")[1]))
        except (IndexError, ValueError):
            pass
    return f"{prefijo}-{n + 1:02d}"


def _renumerar(datos: dict, grupo: str) -> None:
    tareas = sorted((t for t in datos["tareas"] if t["grupo"] == grupo),
                    key=lambda t: (t.get("orden", 0), t["id"]))
    for i, t in enumerate(tareas, 1):
        t["orden"] = i


def _ciclos(tareas: list) -> list:
    deps = {t["id"]: list(t.get("dependencias", [])) for t in tareas}
    ciclos, color = [], {}

    def visitar(nodo, camino):
        color[nodo] = 1
        camino.append(nodo)
        for d in deps.get(nodo, []):
            if d not in deps:
                continue
            if color.get(d) == 1:
                ciclos.append(camino[camino.index(d):] + [d])
            elif color.get(d) is None:
                visitar(d, camino)
        camino.pop()
        color[nodo] = 2

    for t in deps:
        if color.get(t) is None:
            visitar(t, [])
    return ciclos


def _validar_valor(datos: dict, tipo: str, campo: str, valor):
    responsables = datos.get("responsables", [])
    frentes = [f["id"] for f in datos.get("frentes", [])]
    reglas = {
        ("tarea", "estado"): ESTADOS_TAREA,
        ("tarea", "prioridad"): PRIORIDADES,
        ("tarea", "grupo"): GRUPOS,
        ("tarea", "responsable"): responsables,
        ("tarea", "frente"): frentes,
        ("riesgo", "estado"): ESTADOS_RIESGO,
        ("riesgo", "impacto"): NIVELES,
        ("riesgo", "probabilidad"): NIVELES_PROB,
        ("riesgo", "responsable"): responsables,
        ("idea", "estado"): ESTADOS_IDEA,
    }
    permitidos = reglas.get((tipo, campo))
    if permitidos is not None and valor not in permitidos:
        raise ErrorTablero(f"Valor inválido para {tipo}.{campo}: {valor!r}. Permitidos: {permitidos}")
    if tipo == "tarea" and campo == "dependencias":
        if not isinstance(valor, list):
            raise ErrorTablero("dependencias debe ser una lista de ids")
        ids = {t["id"] for t in datos["tareas"]}
        faltan = [d for d in valor if d not in ids]
        if faltan:
            raise ErrorTablero(f"Dependencias inexistentes: {faltan}")
    if tipo == "tarea" and campo == "vence" and valor:
        try:
            date.fromisoformat(valor)
        except ValueError:
            raise ErrorTablero(f"vence debe ser AAAA-MM-DD: {valor!r}")
    if campo in ("titulo", "descripcion") and not str(valor).strip():
        raise ErrorTablero(f"{campo} no puede estar vacío")


def _tipo(id_: str) -> str:
    return {"T": "tarea", "R": "riesgo", "I": "idea"}.get(id_.split("-")[0], "")


# ---------------------------------------------------------------- operaciones

def aplicar(datos: dict, cambio: dict) -> list:
    por = cambio.get("por")
    if por not in ("usuario", "claude"):
        raise ErrorTablero('"por" debe ser "usuario" o "claude"')
    ops = cambio.get("ops")
    if ops is None:
        ops = [{k: v for k, v in cambio.items() if k != "por"}]
    if not isinstance(ops, list) or not ops:
        raise ErrorTablero("No hay operaciones")

    ahora = datetime.now().isoformat(timespec="seconds")
    registro = []
    for op in ops:
        nombre = op.get("op")
        if nombre == "tarea_agregar":
            t = dict(op.get("tarea") or {})
            desconocidos = set(t) - CAMPOS_TAREA
            if desconocidos:
                raise ErrorTablero(f"Campos desconocidos en tarea: {sorted(desconocidos)}")
            t.setdefault("grupo", "ruta_critica")
            t.setdefault("prioridad", "P3")
            t.setdefault("estado", "pendiente")
            t.setdefault("dependencias", [])
            t.setdefault("notas", "")
            for campo in ("titulo", "frente", "responsable"):
                if campo not in t:
                    raise ErrorTablero(f"Falta {campo} en la tarea nueva")
            for campo, valor in t.items():
                _validar_valor(datos, "tarea", campo, valor)
            t["id"] = _siguiente_id(datos["tareas"], "T")
            t["orden"] = 1 + max((x["orden"] for x in datos["tareas"] if x["grupo"] == t["grupo"]), default=0)
            t["creada"] = ahora[:10]
            datos["tareas"].append(dict(sorted(t.items(), key=lambda kv: kv[0] != "id")))
            registro.append({"op": nombre, "id": t["id"], "detalle": t["titulo"]})
        elif nombre == "riesgo_agregar":
            r = dict(op.get("riesgo") or {})
            desconocidos = set(r) - CAMPOS_RIESGO
            if desconocidos:
                raise ErrorTablero(f"Campos desconocidos en riesgo: {sorted(desconocidos)}")
            r.setdefault("estado", "activo")
            r.setdefault("impacto", "medio")
            r.setdefault("probabilidad", "media")
            r.setdefault("mitigacion", "")
            r.setdefault("responsable", "usuario")
            if "descripcion" not in r:
                raise ErrorTablero("Falta descripcion en el riesgo")
            for campo, valor in r.items():
                _validar_valor(datos, "riesgo", campo, valor)
            r["id"] = _siguiente_id(datos["riesgos"], "R")
            r["creado"] = ahora[:10]
            datos["riesgos"].append(r)
            registro.append({"op": nombre, "id": r["id"], "detalle": r["descripcion"]})
        elif nombre == "idea_agregar":
            i = dict(op.get("idea") or {})
            desconocidos = set(i) - CAMPOS_IDEA
            if desconocidos:
                raise ErrorTablero(f"Campos desconocidos en idea: {sorted(desconocidos)}")
            i.setdefault("estado", "nueva")
            i.setdefault("origen", "")
            if "descripcion" not in i:
                raise ErrorTablero("Falta descripcion en la idea")
            for campo, valor in i.items():
                _validar_valor(datos, "idea", campo, valor)
            i["id"] = _siguiente_id(datos["ideas"], "I")
            i["creada"] = ahora[:10]
            datos["ideas"].append(i)
            registro.append({"op": nombre, "id": i["id"], "detalle": i["descripcion"]})
        elif nombre == "campo":
            id_, campo, valor = op.get("id"), op.get("campo"), op.get("valor")
            item = _por_id(datos).get(id_)
            if item is None:
                raise ErrorTablero(f"No existe {id_}")
            tipo = _tipo(id_)
            permitidos = {"tarea": CAMPOS_TAREA, "riesgo": CAMPOS_RIESGO, "idea": CAMPOS_IDEA}[tipo]
            if campo not in permitidos:
                raise ErrorTablero(f"Campo no editable en {tipo}: {campo!r}")
            _validar_valor(datos, tipo, campo, valor)
            anterior = item.get(campo)
            if anterior == valor:
                continue
            item[campo] = valor
            if tipo == "tarea" and campo == "grupo":
                item["orden"] = 10 ** 6
                _renumerar(datos, anterior)
                _renumerar(datos, valor)
            if tipo == "tarea" and campo == "estado" and valor == "hecha":
                item["terminada"] = ahora[:10]
            registro.append({"op": nombre, "id": id_, "detalle": f"{campo}: {anterior!r} -> {valor!r}"})
        elif nombre == "mover":
            id_, pos = op.get("id"), op.get("posicion")
            t = next((x for x in datos["tareas"] if x["id"] == id_), None)
            if t is None:
                raise ErrorTablero(f"No existe la tarea {id_}")
            grupo = sorted((x for x in datos["tareas"] if x["grupo"] == t["grupo"]),
                           key=lambda x: x["orden"])
            if not isinstance(pos, int) or not 1 <= pos <= len(grupo):
                raise ErrorTablero(f"posicion debe estar entre 1 y {len(grupo)}")
            anterior = t["orden"]
            if anterior == pos:
                continue
            grupo.remove(t)
            grupo.insert(pos - 1, t)
            for i, x in enumerate(grupo, 1):
                x["orden"] = i
            registro.append({"op": nombre, "id": id_, "detalle": f"{t['grupo']}: {anterior} -> {pos}"})
        elif nombre == "nota":
            id_, texto = op.get("id"), str(op.get("texto", "")).strip()
            item = _por_id(datos).get(id_)
            if item is None or _tipo(id_) != "tarea":
                raise ErrorTablero(f"No existe la tarea {id_}")
            if not texto:
                raise ErrorTablero("La nota está vacía")
            linea = f"[{ahora[:10]} {por}] {texto}"
            item["notas"] = (item.get("notas", "") + "\n" + linea).strip()
            registro.append({"op": nombre, "id": id_, "detalle": texto})
        else:
            raise ErrorTablero(f"Operación desconocida: {nombre!r}")

    ciclos = _ciclos(datos["tareas"])
    if ciclos:
        raise ErrorTablero("El cambio crea dependencias circulares: "
                           + "; ".join(" -> ".join(c) for c in ciclos))
    for r in registro:
        datos["historial"].append({"fecha": ahora, "por": por, **r})
    return registro


def cambio(texto: str) -> list:
    try:
        cambio_ = json.loads(texto)
    except json.JSONDecodeError as e:
        raise ErrorTablero(f"JSON inválido: {e}")
    with bloqueo():
        datos = cargar()
        registro = aplicar(datos, cambio_)
        if registro:
            guardar(datos)
    return registro


# ---------------------------------------------------------------- análisis

def analizar(datos: dict) -> dict:
    tareas = datos["tareas"]
    por_id = {t["id"]: t for t in tareas}
    hoy = date.today().isoformat()
    vivas = [t for t in tareas if t["estado"] != "descartada"]

    avance = []
    for f in datos["frentes"]:
        ts = [t for t in vivas if t["frente"] == f["id"]]
        hechas = sum(1 for t in ts if t["estado"] == "hecha")
        avance.append((f, hechas, len(ts)))

    def lista(grupo):
        return sorted((t for t in vivas if t["grupo"] == grupo and t["estado"] != "hecha"),
                      key=lambda t: t["orden"])

    def deps_abiertas(t):
        return [d for d in t.get("dependencias", [])
                if por_id.get(d, {}).get("estado") not in ("hecha", "descartada")]

    ruta = lista("ruta_critica")
    proxima = next((t for t in ruta if t["estado"] in ("pendiente", "en_curso") and not deps_abiertas(t)), None)

    alertas = []
    for t in vivas:
        if t["estado"] == "hecha":
            continue
        if not t.get("responsable"):
            alertas.append(f"{t['id']} sin responsable")
        if t.get("vence") and t["vence"] < hoy:
            alertas.append(f"{t['id']} vencida (vence {t['vence']})")
        if t["estado"] == "en_curso" and deps_abiertas(t):
            alertas.append(f"{t['id']} está en curso con dependencias abiertas: {', '.join(deps_abiertas(t))}")
        if t["estado"] == "bloqueada" and not t.get("bloqueado_por"):
            alertas.append(f"{t['id']} bloqueada sin indicar por quién o por qué (campo bloqueado_por)")
    for t in vivas:
        if t["estado"] != "hecha":
            continue
        abiertas = deps_abiertas(t)
        if abiertas:
            alertas.append(f"{t['id']} está hecha pero depende de tareas abiertas: {', '.join(abiertas)}")
    # Orden: en la ruta crítica ninguna tarea va antes que sus dependencias.
    pos = {t["id"]: i for i, t in enumerate(ruta)}
    for t in ruta:
        for d in t.get("dependencias", []):
            if d in pos and pos[d] > pos[t["id"]]:
                alertas.append(f"{t['id']} está antes que su dependencia {d} en la ruta crítica")
    for c in _ciclos(tareas):
        alertas.append("Ciclo de dependencias: " + " -> ".join(c))

    bloqueadas = [t for t in vivas if t["estado"] == "bloqueada"]
    esperando = [(t, deps_abiertas(t)) for t in vivas
                 if t["estado"] == "pendiente" and deps_abiertas(t)]
    riesgos = [r for r in datos["riesgos"] if r["estado"] in ("activo", "materializado")]
    total = len(vivas)
    hechas = sum(1 for t in vivas if t["estado"] == "hecha")
    return {"avance": avance, "ruta": ruta, "paralelo": lista("paralelo"), "proxima": proxima,
            "bloqueadas": bloqueadas, "esperando": esperando, "riesgos": riesgos,
            "alertas": alertas, "total": total, "hechas": hechas, "deps_abiertas": deps_abiertas}


def _fila_tarea(t, a) -> str:
    deps = ", ".join(t.get("dependencias", [])) or "-"
    espera = a["deps_abiertas"](t)
    extra = f" (espera {', '.join(espera)})" if espera and t["estado"] != "bloqueada" else ""
    bloq = f" [bloqueada por: {t.get('bloqueado_por', '?')}]" if t["estado"] == "bloqueada" else ""
    return (f"  {t['orden']:>2}. {t['id']} {t['prioridad']} {t['estado']:<10} "
            f"{t['responsable']:<8} {t['titulo']}{bloq}{extra}  deps: {deps}")


def mostrar(datos: dict) -> str:
    a = analizar(datos)
    pct = round(100 * a["hechas"] / a["total"]) if a["total"] else 0
    out = [f"Tablero: {datos.get('proyecto', '')}  (revisión {datos.get('revision', 0)}, "
           f"actualizado {datos.get('actualizado', '?')})",
           f"Avance total: {a['hechas']}/{a['total']} tareas ({pct} %)", "", "Avance por frente:"]
    for f, h, n in a["avance"]:
        out.append(f"  {f['id']:<6} {f['nombre']:<40} {h}/{n}")
    p = a["proxima"]
    out += ["", "Próxima tarea de la ruta crítica: "
            + (f"{p['id']} {p['titulo']} ({p['responsable']})" if p else "ninguna disponible")]
    out += ["", "Ruta crítica (abiertas):"] + [_fila_tarea(t, a) for t in a["ruta"]]
    out += ["", "En paralelo (abiertas):"] + [_fila_tarea(t, a) for t in a["paralelo"]]
    out += ["", "Bloqueadas:"] + ([f"  {t['id']} {t['titulo']} -> {t.get('bloqueado_por', '?')}"
                                  for t in a["bloqueadas"]] or ["  ninguna"])
    out += ["", "Riesgos activos:"] + ([f"  {r['id']} [{r['impacto']}/{r['probabilidad']}] "
                                        f"{r['descripcion']} -> {r.get('mitigacion') or 'sin mitigación'}"
                                        for r in a["riesgos"]] or ["  ninguno"])
    ideas = [i for i in datos["ideas"] if i["estado"] == "nueva"]
    out += ["", "Ideas sin evaluar:"] + ([f"  {i['id']} {i['descripcion']}" for i in ideas] or ["  ninguna"])
    out += ["", "Alertas:"] + ([f"  - {x}" for x in a["alertas"]] or ["  ninguna"])
    return "\n".join(out)


def _md(texto) -> str:
    return str(texto).replace("|", "\\|").replace("\n", "<br>")


def render(datos: dict) -> str:
    a = analizar(datos)
    pct = round(100 * a["hechas"] / a["total"]) if a["total"] else 0
    L = ["# Tablero del proyecto", "",
         "> Vista generada desde `control/tablero.json` con "
         "`python3 .claude/skills/orquestador-proyecto/scripts/tablero.py render`. No se edita a mano.", "",
         f"Revisión {datos.get('revision', 0)}, actualizado {datos.get('actualizado', '?')}. "
         f"Avance: {a['hechas']}/{a['total']} tareas ({pct} %).", "",
         "## Avance por frente", "", "| Frente | Hechas | Total |", "|---|---|---|"]
    for f, h, n in a["avance"]:
        L.append(f"| {_md(f['nombre'])} | {h} | {n} |")
    p = a["proxima"]
    L += ["", "## Próxima tarea", "",
          f"**{p['id']}** {_md(p['titulo'])} ({p['responsable']})" if p else "Ninguna disponible."]

    def tabla(titulo, grupo):
        L.extend(["", f"## {titulo}", "",
                  "| # | Id | Tarea | Frente | Resp. | Prio. | Estado | Depende de |",
                  "|---|---|---|---|---|---|---|---|"])
        ts = sorted((t for t in datos["tareas"] if t["grupo"] == grupo), key=lambda t: t["orden"])
        for t in ts:
            estado = t["estado"]
            if estado == "bloqueada":
                estado += f" ({_md(t.get('bloqueado_por', '?'))})"
            titulo_t = f"~~{_md(t['titulo'])}~~" if t["estado"] in ("hecha", "descartada") else _md(t["titulo"])
            L.append(f"| {t['orden']} | {t['id']} | {titulo_t} | {t['frente']} | {t['responsable']} | "
                     f"{t['prioridad']} | {estado} | {', '.join(t.get('dependencias', [])) or '-'} |")

    tabla("Ruta crítica", "ruta_critica")
    tabla("En paralelo", "paralelo")
    L += ["", "## Riesgos", "", "| Id | Riesgo | Impacto | Prob. | Mitigación | Resp. | Estado |",
          "|---|---|---|---|---|---|---|"]
    for r in datos["riesgos"]:
        L.append(f"| {r['id']} | {_md(r['descripcion'])} | {r['impacto']} | {r['probabilidad']} | "
                 f"{_md(r.get('mitigacion', ''))} | {r['responsable']} | {r['estado']} |")
    L += ["", "## Ideas", "", "| Id | Idea | Origen | Estado |", "|---|---|---|---|"]
    for i in datos["ideas"]:
        L.append(f"| {i['id']} | {_md(i['descripcion'])} | {_md(i.get('origen', ''))} | {i['estado']} |")
    L += ["", "## Alertas", ""] + ([f"- {_md(x)}" for x in a["alertas"]] or ["Ninguna."])
    L += ["", "## Últimos cambios", "", "| Fecha | Por | Operación | Id | Detalle |", "|---|---|---|---|---|"]
    for h in datos["historial"][-15:][::-1]:
        L.append(f"| {h['fecha']} | {h['por']} | {h['op']} | {h.get('id', '')} | {_md(h.get('detalle', ''))} |")
    return "\n".join(L) + "\n"


def validar(datos: dict) -> list:
    errores = []
    ids = set()
    for clave, tipo in (("tareas", "tarea"), ("riesgos", "riesgo"), ("ideas", "idea")):
        for it in datos.get(clave, []):
            if it["id"] in ids:
                errores.append(f"Id repetido: {it['id']}")
            ids.add(it["id"])
            for campo, valor in it.items():
                try:
                    _validar_valor(datos, tipo, campo, valor)
                except ErrorTablero as e:
                    errores.append(f"{it['id']}: {e}")
    for g in GRUPOS:
        ordenes = sorted(t["orden"] for t in datos["tareas"] if t["grupo"] == g)
        if ordenes != list(range(1, len(ordenes) + 1)):
            errores.append(f"El orden del grupo {g} no es 1..n: {ordenes}")
    for c in _ciclos(datos["tareas"]):
        errores.append("Ciclo de dependencias: " + " -> ".join(c))
    return errores


# ---------------------------------------------------------------- interfaz web

PAGINA = r"""<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Tablero del proyecto</title>
<style>
 body{font-family:system-ui,sans-serif;margin:1rem;color:#222}
 h1{font-size:1.3rem} h2{font-size:1.1rem;margin-top:1.5rem}
 table{border-collapse:collapse;width:100%;font-size:.9rem}
 th,td{border:1px solid #ccc;padding:.3rem;vertical-align:top;text-align:left}
 th{background:#f3f3f3} tr.hecha td{color:#888} tr.descartada td{color:#bbb;text-decoration:line-through}
 tr.bloqueada{background:#fff1f0} select,input,textarea{font:inherit}
 #msg{position:sticky;top:0;padding:.4rem;background:#fffbe6;display:none}
 .err{background:#ffe0e0!important} button{cursor:pointer}
 fieldset{margin-top:1rem} label{display:inline-block;margin:.2rem .6rem .2rem 0}
</style></head><body>
<div id="msg"></div>
<h1 id="titulo">Tablero</h1>
<p id="resumen"></p>
<div id="tareas"></div>
<fieldset><legend>Agregar tarea</legend>
 <label>Título <input id="n_titulo" size="50"></label>
 <label>Frente <select id="n_frente"></select></label>
 <label>Grupo <select id="n_grupo"><option>ruta_critica</option><option>paralelo</option></select></label>
 <label>Responsable <select id="n_resp"></select></label>
 <label>Prioridad <select id="n_prio"><option>P1</option><option>P2</option><option selected>P3</option><option>P4</option></select></label>
 <label>Depende de (ids separados por coma) <input id="n_deps" size="20"></label>
 <button onclick="agregarTarea()">Agregar</button>
</fieldset>
<h2>Riesgos</h2><div id="riesgos"></div>
<fieldset><legend>Agregar riesgo</legend>
 <label>Descripción <input id="r_desc" size="50"></label>
 <label>Mitigación <input id="r_mit" size="40"></label>
 <button onclick="agregar('riesgo_agregar','riesgo',{descripcion:v('r_desc'),mitigacion:v('r_mit')})">Agregar</button>
</fieldset>
<h2>Ideas</h2><div id="ideas"></div>
<fieldset><legend>Agregar idea</legend>
 <label>Descripción <input id="i_desc" size="60"></label>
 <button onclick="agregar('idea_agregar','idea',{descripcion:v('i_desc'),origen:'interfaz'})">Agregar</button>
</fieldset>
<h2>Historial (últimos 30)</h2><div id="historial"></div>
<script>
const E={tarea:["pendiente","en_curso","bloqueada","hecha","descartada"],
 riesgo:["activo","mitigado","materializado","cerrado"],idea:["nueva","evaluada","convertida","descartada"],
 prio:["P1","P2","P3","P4"],grupo:["ruta_critica","paralelo"]};
let D=null, rev=null;
const v=id=>document.getElementById(id).value.trim();
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function msg(t,err){const m=document.getElementById("msg");m.textContent=t;m.className=err?"err":"";m.style.display=t?"block":"none";}
function sel(opts,val,on){return `<select onchange="${on}">`+opts.map(o=>`<option${o===val?" selected":""}>${esc(o)}</option>`).join("")+"</select>";}
async function cargar(){const r=await fetch("api/tablero");D=await r.json();rev=D.revision;pintar();}
async function enviar(ops){
 const r=await fetch("api/cambio",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({por:"usuario",ops})});
 const j=await r.json(); if(!r.ok){msg(j.error,true);} else {msg(j.registro.length?"Guardado: "+j.registro.map(x=>x.id+" "+x.detalle).join("; "):"Sin cambios");}
 await cargar();}
const campo=(id,c,val)=>enviar([{op:"campo",id,campo:c,valor:val}]);
const mover=(id,p)=>enviar([{op:"mover",id,posicion:p}]);
function deps(id,txt){campo(id,"dependencias",txt.split(",").map(s=>s.trim()).filter(Boolean));}
function bloqueo(id){const t=prompt("¿Bloqueada por quién o por qué?");if(t!==null)enviar([{op:"campo",id,campo:"bloqueado_por",valor:t},{op:"campo",id,campo:"estado",valor:"bloqueada"}]);}
function cambiaEstado(id,val){if(val==="bloqueada")bloqueo(id);else campo(id,"estado",val);}
function nota(id){const t=prompt("Nota:");if(t)enviar([{op:"nota",id,texto:t}]);}
function agregar(op,clave,obj){if(!obj.descripcion){msg("Falta la descripción",true);return;}enviar([{op,[clave]:obj}]);}
function agregarTarea(){const t={titulo:v("n_titulo"),frente:v("n_frente"),grupo:v("n_grupo"),responsable:v("n_resp"),prioridad:v("n_prio"),
 dependencias:v("n_deps").split(",").map(s=>s.trim()).filter(Boolean)};if(!t.titulo){msg("Falta el título",true);return;}enviar([{op:"tarea_agregar",tarea:t}]);}
function pintar(){
 document.getElementById("titulo").textContent="Tablero: "+D.proyecto;
 const vivas=D.tareas.filter(t=>t.estado!=="descartada"), h=vivas.filter(t=>t.estado==="hecha").length;
 document.getElementById("resumen").textContent=`Revisión ${D.revision} · ${h}/${vivas.length} tareas hechas · actualizado ${D.actualizado}`;
 const frentes=Object.fromEntries(D.frentes.map(f=>[f.id,f.nombre]));
 let html="";
 for(const g of E.grupo){
  const ts=D.tareas.filter(t=>t.grupo===g).sort((a,b)=>a.orden-b.orden);
  html+=`<h2>${g==="ruta_critica"?"Ruta crítica":"En paralelo"}</h2><table><tr><th>#</th><th>Id</th><th>Tarea</th><th>Frente</th><th>Responsable</th><th>Prio.</th><th>Estado</th><th>Depende de</th><th>Grupo</th><th>Notas</th></tr>`;
  for(const t of ts){
   html+=`<tr class="${t.estado}"><td>${t.orden}<br><button title="subir" onclick="mover('${t.id}',${t.orden-1})" ${t.orden===1?"disabled":""}>▲</button><button title="bajar" onclick="mover('${t.id}',${t.orden+1})" ${t.orden===ts.length?"disabled":""}>▼</button></td>
   <td>${t.id}</td><td>${esc(t.titulo)}${t.estado==="bloqueada"?"<br><b>Bloqueada por:</b> "+esc(t.bloqueado_por):""}</td>
   <td>${sel(D.frentes.map(f=>f.id),t.frente,`campo('${t.id}','frente',this.value)`)}<br><small>${esc(frentes[t.frente])}</small></td>
   <td>${sel(D.responsables,t.responsable,`campo('${t.id}','responsable',this.value)`)}</td>
   <td>${sel(E.prio,t.prioridad,`campo('${t.id}','prioridad',this.value)`)}</td>
   <td>${sel(E.tarea,t.estado,`cambiaEstado('${t.id}',this.value)`)}</td>
   <td><input size="10" value="${esc((t.dependencias||[]).join(", "))}" onchange="deps('${t.id}',this.value)"></td>
   <td>${sel(E.grupo,t.grupo,`campo('${t.id}','grupo',this.value)`)}</td>
   <td><small>${esc(t.notas).replace(/\n/g,"<br>")}</small><br><button onclick="nota('${t.id}')">+ nota</button></td></tr>`;
  }
  html+="</table>";
 }
 document.getElementById("tareas").innerHTML=html;
 for(const [id,opts] of [["n_frente",D.frentes.map(f=>f.id)],["n_resp",D.responsables]]){
  const s=document.getElementById(id);if(!s.options.length)s.innerHTML=opts.map(o=>`<option>${esc(o)}</option>`).join("");}
 document.getElementById("riesgos").innerHTML="<table><tr><th>Id</th><th>Riesgo</th><th>Impacto</th><th>Prob.</th><th>Mitigación</th><th>Responsable</th><th>Estado</th></tr>"+
  D.riesgos.map(r=>`<tr><td>${r.id}</td><td>${esc(r.descripcion)}</td><td>${sel(["bajo","medio","alto"],r.impacto,`campo('${r.id}','impacto',this.value)`)}</td>
  <td>${sel(["baja","media","alta"],r.probabilidad,`campo('${r.id}','probabilidad',this.value)`)}</td><td>${esc(r.mitigacion)}</td>
  <td>${sel(D.responsables,r.responsable,`campo('${r.id}','responsable',this.value)`)}</td><td>${sel(E.riesgo,r.estado,`campo('${r.id}','estado',this.value)`)}</td></tr>`).join("")+"</table>";
 document.getElementById("ideas").innerHTML="<table><tr><th>Id</th><th>Idea</th><th>Origen</th><th>Estado</th></tr>"+
  D.ideas.map(i=>`<tr><td>${i.id}</td><td>${esc(i.descripcion)}</td><td>${esc(i.origen)}</td><td>${sel(E.idea,i.estado,`campo('${i.id}','estado',this.value)`)}</td></tr>`).join("")+"</table>";
 document.getElementById("historial").innerHTML="<table><tr><th>Fecha</th><th>Por</th><th>Op.</th><th>Id</th><th>Detalle</th></tr>"+
  D.historial.slice(-30).reverse().map(x=>`<tr><td>${esc(x.fecha)}</td><td>${esc(x.por)}</td><td>${esc(x.op)}</td><td>${esc(x.id)}</td><td>${esc(x.detalle)}</td></tr>`).join("")+"</table>";
}
cargar();
setInterval(async()=>{try{const r=await fetch("api/tablero");const j=await r.json();if(j.revision!==rev){D=j;rev=j.revision;pintar();msg("El tablero cambió desde otra fuente; vista actualizada");}}catch(e){}},5000);
</script></body></html>
"""


class Manejador(BaseHTTPRequestHandler):
    def _responder(self, codigo: int, cuerpo, tipo="application/json; charset=utf-8"):
        datos = cuerpo if isinstance(cuerpo, bytes) else json.dumps(cuerpo, ensure_ascii=False).encode("utf-8")
        self.send_response(codigo)
        self.send_header("Content-Type", tipo)
        self.send_header("Content-Length", str(len(datos)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(datos)

    def do_GET(self):
        if self.path in ("/", "/index.html"):
            self._responder(200, PAGINA.encode("utf-8"), "text/html; charset=utf-8")
        elif self.path == "/api/tablero":
            self._responder(200, cargar())
        else:
            self._responder(404, {"error": "no encontrado"})

    def do_POST(self):
        if self.path != "/api/cambio":
            self._responder(404, {"error": "no encontrado"})
            return
        # Solo peticiones del propio origen (evita que otra página escriba en el tablero).
        origen = self.headers.get("Origin")
        host = self.headers.get("Host", "")
        if origen and origen not in (f"http://{host}",):
            self._responder(403, {"error": "origen no permitido"})
            return
        largo = int(self.headers.get("Content-Length", 0))
        if largo > 100_000:
            self._responder(413, {"error": "petición demasiado grande"})
            return
        try:
            cuerpo = json.loads(self.rfile.read(largo) or b"{}")
            cuerpo["por"] = "usuario"  # la interfaz siempre escribe como el usuario
            registro = cambio(json.dumps(cuerpo))
            with bloqueo():
                TABLERO_MD.write_text(render(cargar()), encoding="utf-8")
            self._responder(200, {"registro": registro})
        except (ErrorTablero, json.JSONDecodeError) as e:
            self._responder(400, {"error": str(e)})

    def log_message(self, *args):
        pass


def servir(puerto: int) -> None:
    servidor = ThreadingHTTPServer(("127.0.0.1", puerto), Manejador)
    print(f"Tablero en http://127.0.0.1:{puerto}/  (Ctrl+C para detener)")
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        pass


# ---------------------------------------------------------------- CLI

def main(argv: list) -> int:
    if not argv or argv[0] in ("-h", "--help", "ayuda"):
        print(__doc__)
        return 0
    cmd = argv[0]
    try:
        if cmd == "mostrar":
            print(mostrar(cargar()))
        elif cmd == "render":
            with bloqueo():
                TABLERO_MD.write_text(render(cargar()), encoding="utf-8")
            print(f"Escrito {TABLERO_MD.relative_to(RAIZ)}")
        elif cmd == "validar":
            errores = validar(cargar())
            print("\n".join(errores) if errores else "Sin errores")
            return 1 if errores else 0
        elif cmd == "cambio":
            if len(argv) < 2:
                raise ErrorTablero("Uso: tablero.py cambio '<json>'")
            registro = cambio(argv[1])
            for r in registro:
                print(f"{r['op']} {r['id']}: {r['detalle']}")
            if not registro:
                print("Sin cambios")
        elif cmd == "servir":
            puerto = 8765
            if "--puerto" in argv:
                puerto = int(argv[argv.index("--puerto") + 1])
            servir(puerto)
        else:
            raise ErrorTablero(f"Comando desconocido: {cmd}")
    except ErrorTablero as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
