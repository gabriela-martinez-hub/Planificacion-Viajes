// Botón de check-in por geolocalización o manual (T-20, plan.md 6.4).
//
// Flujo:
//  - Sin sesión: no se muestra (el check-in requiere cuenta).
//  - Sin conexión: el botón se desactiva y muestra el motivo (plan.md 6.4).
//  - Sin consentimiento de datos: al intentar, abre el modal; tras aceptar,
//    continúa.
//  - Con ubicación: pide la posición (maximumAge: 0) y llama a la RPC
//    registrar_checkin. El servidor decide si queda verificado.
//  - Registro manual: llama a la RPC con p_manual = true; el servidor crea el
//    check-in no verificado, sin coordenadas.
//
// La verificación real la decide SIEMPRE el servidor; aquí solo orquestamos.

import { useState } from 'react';
import { t } from '@/i18n';
import { useAuth } from '@/features/auth/use-auth';
import { useConexion } from '@/lib/use-conexion';
import {
  obtenerPosicionActual,
  ErrorGeolocalizacion,
} from '@/lib/geolocalizacion';
import { useConsentimiento } from '@/features/privacidad/use-consentimiento';
import { ModalConsentimiento } from '@/features/privacidad/ModalConsentimiento';
import { useRegistrarCheckin, useRegistrarCheckinManual } from './use-checkins';

export interface LugarCheckin {
  /** Id de la atracción o del municipio (casco urbano). */
  id: string;
  nombre: string;
  lat: number;
  lon: number;
}

interface Props {
  lugar: LugarCheckin;
}

type Mensaje = { tono: 'ok' | 'aviso' | 'error'; texto: string } | null;

export function BotonCheckin({ lugar }: Props) {
  const { usuario } = useAuth();
  const enLinea = useConexion();
  const consentimiento = useConsentimiento(usuario !== null);
  const registrar = useRegistrarCheckin();
  const registrarManual = useRegistrarCheckinManual();

  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState<Mensaje>(null);
  // Acción pendiente mientras se pide el consentimiento: 'geo' o 'manual'.
  const [pendiente, setPendiente] = useState<'geo' | 'manual' | null>(null);

  // Sin sesión, el check-in no aplica (requiere cuenta).
  if (!usuario) return null;

  const tieneConsentimiento = (consentimiento.data ?? null) !== null;

  async function hacerCheckinGeo() {
    setMensaje(null);
    setOcupado(true);
    try {
      const pos = await obtenerPosicionActual();
      const fila = await registrar.mutateAsync({
        lugarId: lugar.id,
        lat: pos.lat,
        lon: pos.lon,
        precisionM: pos.precisionM,
        idCliente: crypto.randomUUID(),
      });
      if (fila.verificado) {
        setMensaje({
          tono: 'ok',
          texto: t('checkin.hechoVerificado', { lugar: lugar.nombre }),
        });
      } else {
        setMensaje({
          tono: 'aviso',
          texto:
            fila.distancia_m !== null
              ? `${t('checkin.fueraDeRadio')} ${t('checkin.distanciaAlLugar', {
                  metros: fila.distancia_m,
                })}`
              : t('checkin.fueraDeRadio'),
        });
      }
    } catch (e) {
      setMensaje({ tono: 'error', texto: mensajeError(e) });
    } finally {
      setOcupado(false);
    }
  }

  async function hacerCheckinManual() {
    setMensaje(null);
    setOcupado(true);
    try {
      await registrarManual.mutateAsync({
        lugarId: lugar.id,
        idCliente: crypto.randomUUID(),
      });
      setMensaje({
        tono: 'aviso',
        texto: t('checkin.hechoManual', { lugar: lugar.nombre }),
      });
    } catch (e) {
      setMensaje({ tono: 'error', texto: mensajeError(e) });
    } finally {
      setOcupado(false);
    }
  }

  // Punto de entrada: asegura consentimiento antes de la acción pedida.
  function intentar(accion: 'geo' | 'manual') {
    if (!tieneConsentimiento) {
      setPendiente(accion);
      return;
    }
    void (accion === 'geo' ? hacerCheckinGeo() : hacerCheckinManual());
  }

  function alAceptarConsentimiento() {
    const accion = pendiente;
    setPendiente(null);
    void (accion === 'manual' ? hacerCheckinManual() : hacerCheckinGeo());
  }

  const deshabilitado =
    ocupado || registrar.isPending || registrarManual.isPending || !enLinea;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => intentar('geo')}
          disabled={deshabilitado}
          className="rounded-md bg-selva-700 px-4 py-2 text-sm font-medium text-crema-claro hover:bg-selva-800 disabled:opacity-60"
        >
          {ocupado ? t('checkin.registrando') : t('checkin.conUbicacion')}
        </button>
        <button
          type="button"
          onClick={() => intentar('manual')}
          disabled={deshabilitado}
          className="rounded-md border border-tinta-300 px-4 py-2 text-sm text-tinta-700 hover:bg-crema-oscuro disabled:opacity-60"
        >
          {t('checkin.manualAccion')}
        </button>
      </div>

      {!enLinea && (
        <p className="text-sm text-ambar-700" role="status">
          {t('checkin.sinConexion')}
        </p>
      )}

      {mensaje && (
        <p
          className={
            mensaje.tono === 'ok'
              ? 'text-sm text-selva-700'
              : mensaje.tono === 'aviso'
                ? 'text-sm text-ambar-700'
                : 'text-sm text-red-700'
          }
          role={mensaje.tono === 'error' ? 'alert' : 'status'}
        >
          {mensaje.texto}
        </p>
      )}

      {pendiente !== null && (
        <ModalConsentimiento
          alAceptar={alAceptarConsentimiento}
          alCancelar={() => setPendiente(null)}
        />
      )}
    </div>
  );
}

/** Traduce un error de geolocalización o genérico a un texto del i18n. */
function mensajeError(e: unknown): string {
  if (e instanceof ErrorGeolocalizacion) {
    switch (e.motivo) {
      case 'permiso_denegado':
        return t('checkin.errorPermiso');
      case 'no_soportada':
        return t('checkin.errorNoSoportada');
      case 'contexto_inseguro':
        return t('checkin.errorContextoInseguro');
      case 'tiempo_agotado':
        return t('checkin.errorTiempo');
      default:
        return t('checkin.errorNoDisponible');
    }
  }
  return t('comun.errorGenerico');
}
