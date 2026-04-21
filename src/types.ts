export type EstadoTramite = 'Pendiente' | 'En Trámite' | 'Cumplido' | 'Vencido';

export interface Perfil {
  id: string;
  nombre_completo: string;
}

export interface Entidad {
  id: string;
  Entidad: string;
}

export interface Tramite {
  id: string;
  nombre: string;
  fecha_radicacion: string;
  fecha_estimada: string;
  responsable_id: string;
  entidad_id: string; // Relación con la nueva tabla
  observacion: string;
  estado: EstadoTramite;
  perfiles?: Perfil; // Joined data de perfiles
  entidades?: Entidad; // Joined data de entidades
}

export interface IndicadorResponsable {
  responsable: string;
  estado: EstadoTramite;
  cantidad_tramites: number;
}

export interface IndicadorEntidad {
  entidad: string;
  estado: EstadoTramite;
  cantidad_tramites: number;
}
