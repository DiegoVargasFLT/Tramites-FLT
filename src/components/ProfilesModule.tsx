/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { getSupabase } from '../lib/supabase';
import { Perfil, Entidad } from '../types';
import { User, Plus, Trash2, Edit2, Save, X, Search, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ProfilesModule = ({ onDataChange }: { onDataChange?: () => void }) => {
  const [perfiles, setPerfiles] = useState<Perfil[]>([]);
  const [entidades, setEntidades] = useState<Entidad[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'perfiles' | 'entidades'>('perfiles');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const supabase = getSupabase();
    setLoading(true);
    
    if (!supabase) {
      setPerfiles([
        { id: '1', nombre_completo: 'Ana Martínez' },
        { id: '2', nombre_completo: 'Carlos Ruiz' }
      ]);
      setEntidades([
        { id: '1', Entidad: 'Secretaría de Planeación' },
        { id: '2', Entidad: 'IDU' }
      ]);
      setLoading(false);
      return;
    }

    try {
      const [pRes, eRes] = await Promise.all([
        supabase.from('perfiles').select('*').order('nombre_completo'),
        supabase.from('Entidades').select('*').order('Entidad')
      ]);
      
      if (pRes.data) setPerfiles(pRes.data);
      if (eRes.data) setEntidades(eRes.data);
    } catch (err) {
      console.error("Error cargando directorio:", err);
    }
    setLoading(false);
  };

  const createEntry = async () => {
    if (loading) return;
    setSearchTerm('');
    
    const supabase = getSupabase();
    const isProfile = activeSubTab === 'perfiles';
    const tableName = isProfile ? 'perfiles' : 'Entidades';
    const fieldName = isProfile ? 'nombre_completo' : 'Entidad';
    const defaultValue = isProfile ? 'Nuevo Responsable' : 'Nueva Entidad';
    
    const tempId = 'temp-' + Date.now();
    const newLocal = isProfile 
      ? { id: tempId, nombre_completo: defaultValue } as Perfil
      : { id: tempId, Entidad: defaultValue } as Entidad;

    if (isProfile) setPerfiles(prev => [newLocal as Perfil, ...prev]);
    else setEntidades(prev => [newLocal as Entidad, ...prev]);
    
    setEditingId(tempId);
    setEditForm({ ...newLocal });

    if (!supabase) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(tableName)
        .insert([{ [fieldName]: defaultValue }])
        .select();

      if (error) {
        if (isProfile) setPerfiles(prev => prev.filter(p => p.id !== tempId));
        else setEntidades(prev => prev.filter(e => e.id !== tempId));
        setEditingId(null);
        alert(`Error: ${error.message}`);
      } else if (data && data[0]) {
        // Actualizar el temporal con el real de Supabase preservando lo que el usuario esté escribiendo
        setPerfiles(prev => isProfile ? prev.map(p => p.id === tempId ? data[0] : p) : prev);
        setEntidades(prev => !isProfile ? prev.map(e => e.id === tempId ? data[0] : e) : prev);
        
        setEditingId(data[0].id);
        
        // Usamos un callback para obtener el valor más reciente del formulario
        setEditForm((prevForm: any) => {
          const latestValue = prevForm[fieldName];
          
          // Si el usuario ya cambió el nombre por defecto mientras se insertaba,
          // necesitamos disparar un update con ese valor real.
          if (latestValue !== defaultValue) {
            console.log("Detectado cambio durante creación, sincronizando...", latestValue);
            supabase.from(tableName).update({ [fieldName]: latestValue }).eq('id', data[0].id)
              .then(({ error }) => {
                if (!error && onDataChange) onDataChange();
              });
          }
          
          return { ...data[0], [fieldName]: latestValue };
        });
        
        if (onDataChange) onDataChange();
      }
    } catch (err) {
      console.error("Error en creación:", err);
    }
    setLoading(false);
  };

  const deleteEntry = async (id: string) => {
    const isProfile = activeSubTab === 'perfiles';
    const tableName = isProfile ? 'perfiles' : 'Entidades';
    const label = isProfile ? 'responsable' : 'entidad';
    
    if (!confirm(`¿Estás seguro de eliminar este ${label}? Esto podría afectar a los trámites asociados.`)) return;
    
    if (isProfile) setPerfiles(prev => prev.filter(p => p.id !== id));
    else setEntidades(prev => prev.filter(e => e.id !== id));

    const supabase = getSupabase();
    if (!supabase) return;

    setLoading(true);
    try {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) {
        alert(`Error al eliminar: ${error.message}`);
        await fetchData();
      } else {
        if (onDataChange) onDataChange();
      }
    } catch (err) {
      console.error("Excepción al eliminar:", err);
      await fetchData();
    }
    setLoading(false);
  };

  const startEdit = (entry: any) => {
    setEditingId(entry.id);
    setEditForm({ ...entry });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const isProfile = activeSubTab === 'perfiles';
    const tableName = isProfile ? 'perfiles' : 'Entidades';
    const fieldName = isProfile ? 'nombre_completo' : 'Entidad';
    
    const latestValue = editForm[fieldName];
    if (!latestValue || latestValue.trim() === '') {
       alert("El nombre no puede estar vacío.");
       return;
    }
    
    const updatedData = { [fieldName]: latestValue.trim() };

    const supabase = getSupabase();
    if (!supabase) {
      if (isProfile) setPerfiles(prev => prev.map(p => p.id === editingId ? { ...p, ...updatedData } as Perfil : p));
      else setEntidades(prev => prev.map(e => e.id === editingId ? { ...e, ...updatedData } as Entidad : e));
      setEditingId(null);
      return;
    }

    setLoading(true);
    try {
      console.log(`Guardando edición en ${tableName} [ID: ${editingId}]:`, updatedData);
      const { error } = await supabase
        .from(tableName)
        .update(updatedData)
        .eq('id', editingId);

      if (error) {
        console.error("Error al guardar en Supabase:", error);
        alert(`Error al guardar: ${error.message}`);
      } else {
        console.log("Guardado exitoso en Supabase.");
        if (isProfile) setPerfiles(prev => prev.map(p => p.id === editingId ? { ...p, ...updatedData } as Perfil : p));
        else setEntidades(prev => prev.map(e => e.id === editingId ? { ...e, ...updatedData } as Entidad : e));
        setEditingId(null);
        if (onDataChange) onDataChange();
      }
    } catch (err) {
      console.error("Excepción en saveEdit:", err);
    }
    setLoading(false);
  };

  const filteredData = (activeSubTab === 'perfiles' ? perfiles : entidades).filter((item: any) => {
    const val = activeSubTab === 'perfiles' ? item.nombre_completo : item.Entidad;
    return val?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-8 border-b border-slate-50 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-[#1F3B6F] tracking-tight">DIRECTORIO MAESTRO</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Gestión centralizada de personal y entidades</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchData} 
              className="p-3 text-slate-400 hover:text-torca-azul transition-colors hover:bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100"
              title="Refrescar"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder={`Buscar ${activeSubTab === 'perfiles' ? 'responsable' : 'entidad'}...`}
                className="pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-torca-azul transition-all w-64 font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={createEntry}
              className="flex items-center gap-2 px-6 py-2.5 bg-azul-oceano text-white rounded-xl text-sm font-bold hover:bg-violeta-aereo transition-all shadow-lg shadow-azul-oceano/20 hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" /> Nuevo
            </button>
          </div>
        </div>

        {/* Tabs de Selección */}
        <div className="flex p-1 bg-slate-50 rounded-2xl w-fit">
           <button 
             onClick={() => { setActiveSubTab('perfiles'); setEditingId(null); }}
             className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeSubTab === 'perfiles' ? 'bg-white text-azul-oceano shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
           >
              Personal
           </button>
           <button 
             onClick={() => { setActiveSubTab('entidades'); setEditingId(null); }}
             className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeSubTab === 'entidades' ? 'bg-white text-azul-oceano shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
           >
              Entidades
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-8 bg-slate-50/30">
        <AnimatePresence mode="popLayout">
          {filteredData.map((item: any) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl p-6 border border-slate-100 hover:border-torca-azul transition-all group relative shadow-sm hover:shadow-xl hover:shadow-torca-azul/5"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-4 bg-slate-50 rounded-2xl text-torca-azul transition-colors group-hover:bg-torca-azul group-hover:text-white">
                  <User className="w-6 h-6" />
                </div>
                <div className="flex gap-2">
                  {editingId === item.id ? (
                    <>
                      <button onClick={saveEdit} className="p-2.5 bg-verde-nocturno text-white rounded-xl hover:scale-110 transition-transform shadow-lg shadow-verde-nocturno/20">
                        <Save size={16} />
                      </button>
                      <button onClick={() => setEditingId(null)} className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-all">
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(item)} className="p-2.5 text-slate-400 hover:text-torca-azul hover:bg-slate-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => deleteEntry(item.id)} className="p-2.5 text-slate-400 hover:text-rojo-hibisco hover:bg-slate-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {editingId === item.id ? (
                <input
                  type="text"
                  value={activeSubTab === 'perfiles' ? (editForm.nombre_completo || '') : (editForm.Entidad || '')}
                  onChange={(e) => setEditForm({ 
                    ...editForm, 
                    [activeSubTab === 'perfiles' ? 'nombre_completo' : 'Entidad']: e.target.value 
                  })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit();
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  onBlur={() => {
                    // Solo auto-guardar si ya tenemos un ID real de la base de datos
                    if (editingId && !editingId.toString().startsWith('temp-')) {
                       saveEdit();
                    }
                  }}
                  className="w-full bg-slate-50 border-2 border-torca-azul rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-0 outline-none animate-pulse-subtle"
                  placeholder="Escribe el nombre..."
                  autoFocus
                  onFocus={(e) => {
                    // Select all text if it's the default value
                    if (e.target.value === 'Nueva Entidad' || e.target.value === 'Nuevo Responsable') {
                      e.target.select();
                    }
                  }}
                />
              ) : (
                <>
                  <h3 className="text-azul-oceano font-bold text-lg mb-1 leading-tight">
                    {activeSubTab === 'perfiles' ? item.nombre_completo : item.Entidad}
                  </h3>
                  <div className="text-[9px] uppercase tracking-[0.2em] text-slate-400 font-black">
                    {activeSubTab === 'perfiles' ? 'Responsable Asignado' : 'Entidad Vinculada'}
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {filteredData.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center flex flex-col items-center gap-4">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                <Search size={40} />
             </div>
             <div>
                <p className="text-slate-500 font-bold">No se encontraron resultados</p>
                <p className="text-xs text-slate-400 font-medium">Intenta con otro término de búsqueda</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
