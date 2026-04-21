/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { getSupabase } from '../lib/supabase';
import { Tramite, EstadoTramite, Perfil, Entidad } from '../types';
import { StatusBadge } from './StatusBadge';
import { Edit2, Save, X, Plus, Trash2, Calendar, User, Search, RefreshCw, Download, Clock, Settings } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export const ProcedureTable = ({ onDataChange }: { onDataChange?: () => void }) => {
  const [tramites, setTramites] = useState<Tramite[]>([]);
  const [perfiles, setPerfiles] = useState<Perfil[]>([]);
  const [entidades, setEntidades] = useState<Entidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Tramite>>({});
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showResponsable, setShowResponsable] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Advanced Filters
  const [filters, setFilters] = useState({
    responsable: '',
    estado: '',
    entidad: '',
    fecha_radicacion: '',
    fecha_estimada: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const supabase = getSupabase();
    if (!supabase) {
      console.warn("Supabase no configurado.");
      setLoading(false);
      setError("Faltan las credenciales de Supabase. Asegúrate de configurar SUPABASE_URL y SUPABASE_ANON_KEY en los Secretos.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log("Ejecutando consultas en Supabase...");
      const [tramitesRes, perfilesRes, entidadesRes] = await Promise.all([
        supabase.from('tramites').select(`
          *,
          perfiles:perfiles(id, nombre_completo),
          entidades:Entidades(id, Entidad)
        `).order('fecha_radicacion', { ascending: false }),
        supabase.from('perfiles').select('id, nombre_completo').order('nombre_completo'),
        supabase.from('Entidades').select('id, Entidad').order('Entidad')
      ]);

      console.log("Resultado Trámites:", tramitesRes);
      console.log("Resultado Perfiles:", perfilesRes);
      console.log("Resultado Entidades:", entidadesRes);

      if (tramitesRes.error) {
        console.error("Error cargando trámites:", tramitesRes.error);
        setError(`Error de base de datos: ${tramitesRes.error.message}`);
        // Intento de fallback si el join complejo falla
        const simpleTramites = await supabase.from('tramites').select('*').order('fecha_radicacion', { ascending: false });
        if (!simpleTramites.error) {
          console.log("Fallback: Cargados trámites simples sin relación.");
          setTramites(simpleTramites.data || []);
        }
      } else {
        setTramites(tramitesRes.data || []);
      }

      if (perfilesRes.error) console.error("Error cargando perfiles:", perfilesRes.error);
      else setPerfiles(perfilesRes.data || []);

      if (entidadesRes.error) console.error("Error cargando entidades:", entidadesRes.error);
      else setEntidades(entidadesRes.data || []);
      
    } catch (err) {
      console.error("Excepción crítica en fetchData:", err);
    }
    setLoading(false);
  };

  const startEdit = (tramite: Tramite) => {
    setEditingId(tramite.id);
    setEditForm(tramite);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    
    const supabase = getSupabase();
    if (!supabase) {
        setTramites(prev => prev.map(t => t.id === editingId ? { ...t, ...editForm } as Tramite : t));
        setEditingId(null);
        return;
    }

    setLoading(true);
    const cleanData = {
      nombre: editForm.nombre,
      entidad_id: editForm.entidad_id, 
      observacion: editForm.observacion,
      fecha_radicacion: editForm.fecha_radicacion,
      fecha_estimada: editForm.fecha_estimada,
      responsable_id: editForm.responsable_id,
      estado: editForm.estado
    };

    try {
      const { error } = await supabase
        .from('tramites')
        .update(cleanData)
        .eq('id', editingId);

      if (error) {
        alert(`Error al guardar: ${error.message}`);
      } else {
        setEditingId(null);
        await fetchData();
        if (onDataChange) onDataChange();
      }
    } catch (err) {
      console.error("Excepción en saveEdit:", err);
    }
    setLoading(false);
  };

  const createTramite = async () => {
    const supabase = getSupabase();
    
    const newTramiteData: Partial<Tramite> = {
      nombre: 'Nuevo Trámite',
      estado: 'Pendiente' as EstadoTramite,
      entidad_id: entidades.length > 0 ? entidades[0].id : undefined,
      fecha_radicacion: new Date().toISOString().split('T')[0],
      fecha_estimada: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      observacion: '',
      responsable_id: undefined
    };

    if (!supabase) {
      const id = 'temp-' + Date.now();
      const newLocal = { ...newTramiteData, id, perfiles: { id: '', nombre_completo: 'Sin definir' } } as Tramite;
      setTramites(prev => [newLocal, ...prev]);
      startEdit(newLocal);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tramites')
        .insert([newTramiteData])
        .select(`*, perfiles:perfiles(id, nombre_completo), entidades:Entidades(id, Entidad)`);
      
      if (error) {
        alert(`Error al crear: ${error.message}`);
      } else if (data && data[0]) {
        setTramites(prev => [data[0], ...prev]);
        startEdit(data[0]);
        if (onDataChange) onDataChange();
      } else {
        await fetchData();
        if (onDataChange) onDataChange();
      }
    } catch (err) {
      console.error("Excepción en createTramite:", err);
    }
    setLoading(false);
  };

  const deleteTramite = async (id: string) => {
    // Registro de depuración exhaustivo
    console.group("OPERACIÓN DE ELIMINACIÓN");
    console.log("Timestamp:", new Date().toLocaleTimeString());
    console.log("ID a eliminar:", id);
    
    if (!id) {
       console.error("ERROR: No se recibió ID válido.");
       alert("Error de sistema: No se pudo identificar el trámite.");
       console.groupEnd();
       return;
    }

    if (!confirm('🗑️ ¿Confirmas la eliminación definitiva de este trámite?')) {
       console.log("Acción cancelada por el usuario.");
       console.groupEnd();
       return;
    }
    
    const supabase = getSupabase();
    console.log("Estado de Supabase configurado:", !!supabase);

    setIsDeleting(id);
    
    // Almacenamos copia para posible rollback
    const deletedItem = tramites.find(t => t.id === id);
    console.log("Trámite encontrado localmente:", !!deletedItem);

    // Actualización optimista de la lista
    setTramites(prev => prev.filter(p => p.id !== id));
    console.log("UI actualizada optimísticamente (Trámite oculto)");

    if (!supabase) {
      console.warn("MODO DEMO: Supabase no detectado. Cambios solo locales.");
      setIsDeleting(null);
      console.groupEnd();
      return;
    }

    try {
      console.log("Enviando comando DELETE a la tabla 'tramites' para el ID:", id);
      const { error, status, statusText } = await supabase
        .from('tramites')
        .delete()
        .eq('id', id);
      
      console.log("Respuesta servidor:", { status, statusText });

      if (error) {
        console.error("ERROR SUPABASE:", error);
        alert(`Fallo al eliminar en base de datos.\nCódigo: ${error.code}\nMensaje: ${error.message}\nConsulte con soporte técnico.`);
        
        // ROLLBACK: Restaurar si hay fallo
        if (deletedItem) {
          console.log("Realizando rollback de los datos...");
          setTramites(prev => [...prev, deletedItem].sort((a, b) => 
            new Date(b.fecha_radicacion).getTime() - new Date(a.fecha_radicacion).getTime())
          );
        }
      } else {
        console.log("ELIMINACIÓN EXITOSA CONFIRMADA.");
        if (onDataChange) onDataChange();
      }
    } catch (err) {
      console.error("EXCEPCIÓN INESPERADA:", err);
      alert("Ocurrió un error inesperado al intentar eliminar el registro.");
      await fetchData();
    } finally {
      setIsDeleting(null);
      console.groupEnd();
    }
  };

  const filteredTramites = tramites.filter(t => {
    const searchLower = searchTerm.toLowerCase();
    const matchesName = t.nombre.toLowerCase().includes(searchLower);
    const matchesObs = t.observacion?.toLowerCase().includes(searchLower);
    const matchesRespMain = t.perfiles?.nombre_completo?.toLowerCase().includes(searchLower);
    const matchesEstadoMain = t.estado.toLowerCase().includes(searchLower);
    
    // Advanced filters
    const matchesRespFilter = filters.responsable ? t.responsable_id === filters.responsable : true;
    const matchesEstadoFilter = filters.estado ? t.estado === filters.estado : true;
    const matchesEntidadFilter = filters.entidad ? t.entidad_id === filters.entidad : true;
    const matchesRadicFilter = filters.fecha_radicacion ? t.fecha_radicacion === filters.fecha_radicacion : true;
    const matchesEstimFilter = filters.fecha_estimada ? t.fecha_estimada === filters.fecha_estimada : true;
    
    return (matchesName || matchesObs || matchesRespMain || matchesEstadoMain) && 
           matchesRespFilter && matchesEstadoFilter && matchesEntidadFilter && matchesRadicFilter && matchesEstimFilter;
  });

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Trámites');

    // Definir columnas
    worksheet.columns = [
      { header: 'Nombre Trámite', key: 'nombre', width: 40 },
      { header: 'Entidad', key: 'entidad', width: 20 },
      { header: 'Fecha Radicación', key: 'fecha_radicacion', width: 20 },
      { header: 'Fecha Estimada', key: 'fecha_estimada', width: 20 },
      { header: 'Responsable', key: 'responsable', width: 25 },
      { header: 'Estado', key: 'estado', width: 15 },
      { header: 'Observaciones', key: 'observaciones', width: 50 },
    ];

    // Estilo para el encabezado
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1F3B6F' }, // Azul Océano de la marca
      };
      cell.font = {
        color: { argb: 'FFFFFFFF' },
        bold: true,
        size: 11
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    headerRow.height = 25;

    // Agregar datos
    filteredTramites.forEach((t) => {
      const row = worksheet.addRow({
        nombre: t.nombre,
        entidad: t.entidades?.Entidad || 'Sin entidad',
        fecha_radicacion: formatDate(t.fecha_radicacion),
        fecha_estimada: formatDate(t.fecha_estimada),
        responsable: t.perfiles?.nombre_completo || 'Sin asignar',
        estado: t.estado,
        observaciones: t.observacion || ''
      });

      // Estilo para las celdas de datos (bordes)
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
        };
        cell.alignment = { vertical: 'middle', wrapText: true };
      });
      row.height = 30;
    });

    // Generar buffer y guardar
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Reporte_Lagos_Torca_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: es });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-azul-oceano mb-1">Sábana de Trámites</h2>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Gestión integral de requerimientos</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowResponsable(!showResponsable)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${showResponsable ? 'bg-slate-100 text-slate-600' : 'bg-torca-azul text-white animate-pulse'}`}
            title={showResponsable ? "Ocultar Responsable" : "Mostrar Responsable"}
          >
            <User size={16} /> <span className="hidden sm:inline">{showResponsable ? 'Ocultar Resp.' : 'Mostrar Resp.'}</span>
          </button>
          <button 
            onClick={exportToExcel} 
            className="flex items-center gap-2 px-4 py-2 bg-verde-nocturno text-white rounded-xl text-sm font-bold hover:bg-opacity-90 transition-all shadow-md"
            title="Exportar a Excel"
          >
            <Download size={16} /> <span className="hidden sm:inline">Excel</span>
          </button>
          <button 
            onClick={fetchData} 
            className="p-2 text-slate-400 hover:text-torca-azul transition-colors hover:bg-slate-100 rounded-xl"
            title="Refrescar datos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar trámite..."
              className="pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-torca-azul transition-all w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-xl transition-all ${showFilters ? 'bg-torca-azul text-white' : 'text-slate-400 hover:bg-slate-100 flex items-center gap-1.5 px-3'}`}
            title="Filtros avanzados"
          >
            <Settings size={18} />
            {!showFilters && <span className="text-xs font-bold">Filtros</span>}
          </button>
          <button 
            onClick={createTramite}
            className="flex items-center gap-2 px-5 py-2 bg-azul-oceano text-white rounded-xl text-sm font-bold hover:bg-violeta-aereo transition-colors shadow-lg shadow-azul-oceano/20"
          >
            <Plus className="w-4 h-4" /> Nuevo
          </button>
        </div>
      </div>

      {showFilters && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Responsable</label>
            <select 
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none"
              value={filters.responsable}
              onChange={e => setFilters({...filters, responsable: e.target.value})}
            >
              <option value="">Cualquiera</option>
              {perfiles.map(p => <option key={p.id} value={p.id}>{p.nombre_completo}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Estado</label>
            <select 
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none"
              value={filters.estado}
              onChange={e => setFilters({...filters, estado: e.target.value})}
            >
              <option value="">Cualquiera</option>
              <option value="Cumplido">Cumplido</option>
              <option value="En Trámite">En Trámite</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Vencido">Vencido</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Radicación</label>
            <input 
              type="date"
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none"
              value={filters.fecha_radicacion}
              onChange={e => setFilters({...filters, fecha_radicacion: e.target.value})}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Entidad</label>
            <select 
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none"
              value={filters.entidad}
              onChange={e => setFilters({...filters, entidad: e.target.value})}
            >
              <option value="">Cualquiera</option>
              {entidades.map(ent => <option key={ent.id} value={ent.id}>{ent.Entidad}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Acción</label>
            <button 
              onClick={() => setFilters({ responsable: '', estado: '', entidad: '', fecha_radicacion: '', fecha_estimada: '' })}
              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-rojo-hibisco hover:bg-rojo-hibisco/5 transition-colors"
            >
              Limpiar Filtros
            </button>
          </div>
        </motion.div>
      )}

      {error && (
        <div className="mx-6 mb-4 p-4 bg-rojo-hibisco/10 border border-rojo-hibisco/20 rounded-xl flex items-center gap-3 text-rojo-hibisco text-sm font-medium">
          <Settings className="w-5 h-5" />
          <p>{error}</p>
          <button 
            onClick={fetchData}
            className="ml-auto px-3 py-1 bg-white border border-rojo-hibisco/20 rounded-lg shadow-sm hover:bg-rojo-hibisco/5 transition-all text-xs"
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="overflow-x-auto pb-4">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-slate-50/50 text-[11px] font-bold uppercase tracking-widest text-[#1F3B6F]/50 border-b border-slate-100">
              <th className={`px-6 py-5 transition-all duration-300 ${showResponsable ? 'w-[20%]' : 'w-[25%]'}`}>Trámite</th>
              <th className="px-6 py-5 w-[110px]">Entidad</th>
              <th className="px-6 py-5 w-[130px]">Radicación</th>
              <th className="px-6 py-5 w-[130px]">Estimado</th>
              {showResponsable && <th className="px-6 py-5 w-[180px]">Responsable</th>}
              <th className="px-6 py-5 w-[110px]">Estado</th>
              <th className="px-6 py-5 min-w-[140px] max-w-[200px]">Observaciones</th>
              <th className="px-6 py-5 text-right w-[100px]">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {filteredTramites.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                        <Search size={24} />
                      </div>
                      <h3 className="text-slate-600 font-bold">No se encontraron trámites</h3>
                      <p className="text-slate-400 text-sm max-w-sm">
                        No hay registros que coincidan con los criterios de búsqueda actuales.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredTramites.map((tramite) => (
                <motion.tr 
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  key={tramite.id} 
                  className="group hover:bg-slate-50/80 transition-colors border-b border-slate-50 last:border-0"
                >
                  <td className="px-6 py-5">
                    {editingId === tramite.id ? (
                      <div className="min-w-[180px]">
                        <input 
                          className="w-full p-2.5 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-torca-azul outline-none font-bold"
                          value={editForm.nombre || ''}
                          onChange={e => setEditForm({ ...editForm, nombre: e.target.value })}
                        />
                      </div>
                    ) : (
                      <div className="max-w-xs font-bold text-[#1F3B6F] text-sm leading-snug">
                        {tramite.nombre}
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-5">
                    {editingId === tramite.id ? (
                      <div className="min-w-[120px]">
                        <select 
                          className="w-full p-2 text-sm border border-slate-200 rounded-lg outline-none bg-white font-bold"
                          value={editForm.entidad_id || ''}
                          onChange={e => setEditForm({ ...editForm, entidad_id: e.target.value })}
                        >
                          <option value="">Sin definir</option>
                          {entidades.map(ent => (
                            <option key={ent.id} value={ent.id}>{ent.Entidad}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <span className="px-2.5 py-1 bg-slate-100 text-[#1F3B6F] rounded-md text-[10px] font-black uppercase tracking-wider border border-slate-200">
                        {tramite.entidades?.Entidad || 'N/A'}
                      </span>
                    )}
                  </td>
                  
                  <td className="px-6 py-5">
                    {editingId === tramite.id ? (
                       <input 
                        type="date"
                        className="bg-slate-100 border-none rounded-lg p-2 text-xs font-bold"
                        value={editForm.fecha_radicacion || ''}
                        onChange={e => setEditForm({ ...editForm, fecha_radicacion: e.target.value })}
                       />
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-[#1F3B6F] font-bold">
                        <Calendar className="w-3.5 h-3.5 text-rio-verde" />
                        <span>{formatDate(tramite.fecha_radicacion)}</span>
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-5">
                    {editingId === tramite.id ? (
                       <input 
                        type="date"
                        className="bg-slate-100 border-none rounded-lg p-2 text-xs font-bold"
                        value={editForm.fecha_estimada || ''}
                        onChange={e => setEditForm({ ...editForm, fecha_estimada: e.target.value })}
                       />
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-[#1F3B6F]/70 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-rio-verde opacity-70" />
                        <span>{formatDate(tramite.fecha_estimada)}</span>
                      </div>
                    )}
                  </td>

                   {showResponsable && (
                    <td className="px-6 py-5">
                      {editingId === tramite.id ? (
                        <select 
                          className="w-full min-w-[150px] p-2.5 text-sm border border-slate-200 rounded-lg outline-none bg-white font-medium"
                          value={editForm.responsable_id || ''}
                          onChange={e => setEditForm({ ...editForm, responsable_id: e.target.value })}
                        >
                          <option value="">Sin asignar</option>
                          {perfiles.map(p => (
                            <option key={p.id} value={p.id}>{p.nombre_completo}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex items-center gap-3 text-sm text-slate-700 min-w-[140px]">
                          <div className="w-8 h-8 rounded-xl bg-torca-azul/10 flex items-center justify-center text-azul-oceano shadow-sm border border-torca-azul/20">
                             <User className="w-4.5 h-4.5" />
                          </div>
                          <span className="font-bold text-[#1F3B6F] text-xs leading-none">{tramite.perfiles?.nombre_completo || 'Sin asignar'}</span>
                        </div>
                      )}
                    </td>
                   )}

                  <td className="px-6 py-5">
                    {editingId === tramite.id ? (
                      <select 
                        className="w-full p-2.5 text-sm border border-slate-200 rounded-lg outline-none bg-white font-black uppercase text-[10px] tracking-wider"
                        value={editForm.estado}
                        onChange={e => setEditForm({ ...editForm, estado: e.target.value as EstadoTramite })}
                      >
                        <option value="Cumplido">Cumplido</option>
                        <option value="En Trámite">En Trámite</option>
                        <option value="Pendiente">Pendiente</option>
                        <option value="Vencido">Vencido</option>
                      </select>
                    ) : (
                      <StatusBadge estado={tramite.estado} />
                    )}
                  </td>

                  <td className="px-6 py-5">
                    {editingId === tramite.id ? (
                      <textarea 
                        className="w-full p-2.5 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-torca-azul outline-none min-h-[80px] min-w-[200px]"
                        placeholder="Escribe las observaciones aquí..."
                        value={editForm.observacion || ''}
                        onChange={e => setEditForm({ ...editForm, observacion: e.target.value })}
                      />
                    ) : (
                      <div className="relative group/tooltip">
                        <div 
                          className="text-[11px] text-slate-600 truncate cursor-help hover:text-torca-azul transition-colors max-w-[160px]"
                        >
                          {tramite.observacion || <span className="text-slate-300 italic text-[10px]">Sin observaciones</span>}
                        </div>
                        {tramite.observacion && (
                          <div className="absolute z-50 top-0 right-full mr-4 invisible group-hover/tooltip:visible opacity-0 group-hover/tooltip:opacity-100 transition-all duration-200 w-[280px]">
                            <div className="bg-slate-900/95 text-white text-[10px] p-4 rounded-xl shadow-2xl whitespace-pre-wrap border border-slate-700/50 leading-relaxed backdrop-blur-md max-h-[300px] overflow-y-auto custom-scrollbar">
                              <div className="font-bold text-rio-verde mb-2 uppercase tracking-tighter text-[9px] border-b border-white/10 pb-1">Detalle de Observación</div>
                              {tramite.observacion}
                            </div>
                            <div className="absolute top-4 left-full border-8 border-transparent border-l-slate-900/95"></div>
                          </div>
                        )}
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                       {editingId === tramite.id ? (
                        <>
                          <button onClick={saveEdit} className="p-2 text-verde-nocturno hover:bg-verde-nocturno/10 rounded-lg transition-colors">
                            <Save className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingId(null)} className="p-2 text-rojo-hibisco hover:bg-rojo-hibisco/10 rounded-lg transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </>
                       ) : (
                        <>
                          <button 
                            disabled={isDeleting === tramite.id}
                            onClick={(e) => {
                                e.stopPropagation();
                                startEdit(tramite);
                            }} 
                            className="p-2 text-slate-400 hover:text-azul-oceano hover:bg-azul-oceano/10 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                             disabled={isDeleting === tramite.id}
                             className="hidden"
                          >
                            {isDeleting === tramite.id ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                                <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </>
                       )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        
        {!loading && filteredTramites.length === 0 && (
          <div className="p-12 text-center text-slate-400">
            No se encontraron trámites que coincidan con la búsqueda.
          </div>
        )}
        
        {loading && (
          <div className="p-12 text-center text-torca-azul animate-pulse font-bold uppercase tracking-widest text-sm">
            Cargando Sábana de Datos...
          </div>
        )}
      </div>
    </div>
  );
};
