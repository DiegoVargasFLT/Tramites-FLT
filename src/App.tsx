/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Logo } from './components/Logo';
import { ProcedureTable } from './components/ProcedureTable';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { ProfilesModule } from './components/ProfilesModule';
import { isSupabaseConfigured, testSupabaseConnection, getSupabase } from './lib/supabase';
import { 
  LayoutDashboard, 
  FileText, 
  Users,
  Settings, 
  Bell, 
  UserCircle,
  HelpCircle,
  LogOut,
  CalendarDays,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Database,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'table' | 'profiles' | 'settings'>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [stats, setStats] = useState({ pendientes: 0, tramite: 0, cumplidos: 0, vencidos: 0 });
  const [connectionStatus, setConnectionStatus] = useState<{ checked: boolean; success: boolean; message: string }>({ 
    checked: false, success: false, message: '' 
  });
  const configured = isSupabaseConfigured();

  const fetchStats = async () => {
    const supabase = getSupabase();
    let summaryData;

    if (!supabase) {
      summaryData = { pendientes: 5, tramite: 8, cumplidos: 12, vencidos: 7 };
    } else {
      try {
        const { data, error } = await supabase.from('vista_indicadores').select('*');
        if (error) {
          console.error("Error cargando estadísticas desde vista:", error);
          if (error.code === '42501' || error.message.includes('RLS')) {
            setConnectionStatus(prev => ({ ...prev, message: 'Falla de Permisos RLS (Authenticated)' }));
          }
        } else if (data) {
          summaryData = data.reduce((acc, current) => {
            const cant = Number(current.cantidad_tramites || 0);
            if (current.estado === 'Pendiente') acc.pendientes += cant;
            else if (current.estado === 'En Trámite') acc.tramite += cant;
            else if (current.estado === 'Cumplido') acc.cumplidos += cant;
            else if (current.estado === 'Vencido') acc.vencidos += cant;
            return acc;
          }, { pendientes: 0, tramite: 0, cumplidos: 0, vencidos: 0 });
        }
      } catch (e) {
        console.error("Excepción en App stats fetch:", e);
      }
    }
    
    if (summaryData) setStats(summaryData);
    
    const result = await testSupabaseConnection();
    setConnectionStatus({ checked: true, ...result });
  };

  useEffect(() => {
    fetchStats();
  }, [configured, activeTab]);

  // Limpiar filtro al hacer clic en el contenedor principal (espacio en blanco)
  const handleMainClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setActiveFilter(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-azul-oceano overflow-hidden h-screen">
      {/* Sidebar */}
      <aside className={`bg-[#1F3B6F] text-white flex flex-col hidden lg:flex border-r border-white/5 shadow-[rgba(0,0,0,0.2)_10px_0px_50px_-15px] z-20 transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'w-20' : 'w-80'}`}>
        <div className={`p-6 flex items-center ${sidebarCollapsed ? 'justify-center p-4' : 'justify-between'}`}>
          {!sidebarCollapsed && <Logo variant="white" size="sm" />}
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`p-2 hover:bg-white/10 rounded-xl transition-all ${sidebarCollapsed ? '' : 'text-white/40'}`}
          >
            <LayoutDashboard size={20} className={sidebarCollapsed ? 'text-white' : ''} />
          </button>
        </div>
        
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {configured && !sidebarCollapsed && (
            <div className="mb-8 px-3">
               <div className={`p-4 rounded-2xl border flex flex-col gap-2.5 transition-all duration-500 ${connectionStatus.success ? 'bg-verde-nocturno/20 border-verde-nocturno/30' : 'bg-luz-solar/20 border-luz-solar/30'} shadow-inner`}>
                  <div className="flex items-center gap-3">
                    {connectionStatus.success ? (
                      <ShieldCheck className="text-rio-verde shrink-0" size={18} />
                    ) : (
                      <ShieldAlert className="text-luz-solar animate-pulse shrink-0" size={18} />
                    )}
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-1 text-white">
                        {connectionStatus.success ? 'Enlace Directo' : 'Sincronizando...'}
                      </span>
                      <span className="text-[9px] text-white/40 truncate font-bold tracking-wide">{connectionStatus.message || 'Canal seguro...'}</span>
                    </div>
                  </div>
                </div>
            </div>
          )}
          
          <div className="space-y-1">
            <button 
              onClick={() => setActiveTab('dashboard')}
              title="Dashboard"
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeTab === 'dashboard' ? 'bg-[#61B1E3] text-white shadow-lg shadow-[#61B1E3]/20' : 'text-white/60 hover:text-white hover:bg-white/5'} ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
            >
              <LayoutDashboard size={20} className="shrink-0" />
              {!sidebarCollapsed && <span>Dashboard</span>}
            </button>
            <button 
              onClick={() => setActiveTab('table')}
              title="Sábana de Trámites"
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeTab === 'table' ? 'bg-[#61B1E3] text-white shadow-lg shadow-[#61B1E3]/20' : 'text-white/60 hover:text-white hover:bg-white/5'} ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
            >
              <FileText size={20} className="shrink-0" />
              {!sidebarCollapsed && <span>Sábana de Trámites</span>}
            </button>
              {/* <button 
                onClick={() => setActiveTab('profiles')}
                title="Directorio Maestro"
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeTab === 'profiles' ? 'bg-[#61B1E3] text-white shadow-lg shadow-[#61B1E3]/20' : 'text-white/60 hover:text-white hover:bg-white/5'} ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
              >
                <Users size={20} className="shrink-0" />
                {!sidebarCollapsed && <span>Directorio Maestro</span>}
              </button> */}
            </div>
          
          <div className={`pt-8 pb-4 ${sidebarCollapsed ? 'flex justify-center' : ''}`}>
             {!sidebarCollapsed ? (
               <span className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Mantenimiento</span>
             ) : (
               <div className="w-4 h-px bg-white/10"></div>
             )}
          </div>
          
          <button 
            onClick={() => setActiveTab('settings')}
            title="Configuración"
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${activeTab === 'settings' ? 'bg-[#61B1E3] text-white shadow-lg shadow-[#61B1E3]/20' : 'text-white/60 hover:text-white hover:bg-white/5'} ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
          >
            <Settings size={20} className="shrink-0" />
            {!sidebarCollapsed && <span>Configuración</span>}
          </button>
        </nav>

        <div className="p-6 border-t border-white/5">
           <div className="px-6 py-4 bg-white/5 rounded-2xl border border-white/5">
              <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Versión de Plataforma</p>
              <p className="text-xs font-bold text-white/60">v2.4.0 • Producción</p>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Header */}
         <header className="h-24 bg-white border-b border-slate-100 flex items-center justify-between px-12 shadow-sm z-10">
            <div className="lg:hidden">
               <Logo size="sm" />
            </div>
            
            <div className="hidden lg:block">
               <div className="flex items-center gap-5">
                  <div className="w-2 h-10 bg-[#61B1E3] rounded-full shadow-lg shadow-[#61B1E3]/30"></div>
                  <div>
                    <h1 className="text-2xl font-black tracking-tight text-[#1F3B6F] leading-none mb-1">
                      {activeTab === 'dashboard' ? 'RESUMEN EJECUTIVO' : 
                       activeTab === 'table' ? 'SÁBANA DE TRÁMITES' : 
                       activeTab === 'profiles' ? 'DIRECTORIO MAESTRO' : 'AJUSTES DE PLATAFORMA'}
                    </h1>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Lagos de Torca • Control de Gestión</p>
                  </div>
               </div>
            </div>

            <div className="flex items-center gap-8">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`w-11 h-11 flex items-center justify-center rounded-2xl transition-all relative border ${showNotifications ? 'bg-[#61B1E3] text-white border-[#61B1E3]' : 'text-slate-400 hover:text-[#61B1E3] hover:bg-[#61B1E3]/5 border-transparent hover:border-[#61B1E3]/20'}`}
                  >
                     <Bell size={22} />
                     {stats.vencidos > 0 && (
                       <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-rojo-hibisco rounded-full border-2 border-white"></span>
                     )}
                  </button>
                  
                  {showNotifications && (
                    <div className="absolute top-28 right-24 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                       <h4 className="text-xs font-black text-[#1F3B6F] uppercase tracking-widest mb-4">Notificaciones</h4>
                       <div className="space-y-3">
                          {stats.vencidos > 0 ? (
                            <div className="p-3 bg-rojo-hibisco/5 border border-rojo-hibisco/10 rounded-xl flex items-start gap-3">
                               <AlertTriangle className="text-rojo-hibisco w-4 h-4 mt-0.5" />
                               <div>
                                  <p className="text-xs font-bold text-rojo-hibisco">Trámites Vencidos</p>
                                  <p className="text-[10px] text-slate-500 font-medium">Hay {stats.vencidos} trámites que requieren atención inmediata.</p>
                               </div>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 text-center py-4 italic">No hay alertas pendientes</p>
                          )}
                       </div>
                    </div>
                  )}

                  <button 
                    onClick={() => { setShowHelp(!showHelp); setShowNotifications(false); }}
                    className={`w-11 h-11 flex items-center justify-center rounded-2xl transition-all border ${showHelp ? 'bg-[#61B1E3] text-white border-[#61B1E3]' : 'text-slate-400 hover:text-[#61B1E3] hover:bg-[#61B1E3]/5 border-transparent hover:border-[#61B1E3]/20'}`}
                  >
                     <HelpCircle size={22} />
                  </button>

                  {showHelp && (
                    <div className="absolute top-28 right-12 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                       <h4 className="text-xs font-black text-[#1F3B6F] uppercase tracking-widest mb-4">Centro de Ayuda</h4>
                       <div className="space-y-1">
                          <button className="w-full text-left p-3 hover:bg-slate-50 rounded-xl transition-colors flex items-center justify-between group">
                             <span className="text-xs font-bold text-slate-600">Manual de Usuario</span>
                             <FileText size={14} className="text-slate-300 group-hover:text-[#61B1E3]" />
                          </button>
                          <button className="w-full text-left p-3 hover:bg-slate-50 rounded-xl transition-colors flex items-center justify-between group">
                             <span className="text-xs font-bold text-slate-600">Soporte Técnico</span>
                             <HelpCircle size={14} className="text-slate-300 group-hover:text-[#61B1E3]" />
                          </button>
                       </div>
                    </div>
                  )}
               </div>
               
               <div className="h-10 w-px bg-slate-100"></div>
               
               <div className="px-5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl shadow-inner">
                 <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Panel Administrativo</span>
               </div>
            </div>
         </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto p-12 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent h-full" onClick={handleMainClick}>
          
          <div className="max-w-screen-2xl mx-auto h-full">
            <div className="space-y-8">
              {/* Quick Stats Banner */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                 <button 
                   onClick={(e) => { e.stopPropagation(); setActiveFilter(activeFilter === 'Pendiente' ? null : 'Pendiente'); }}
                   className={`p-5 rounded-2xl border flex flex-col transition-all text-left ${activeFilter === 'Pendiente' ? 'bg-rio-verde text-white shadow-xl shadow-rio-verde/30 border-rio-verde scale-105 z-10' : 'bg-rio-verde/10 border-rio-verde/20 hover:bg-rio-verde/20'}`}
                 >
                    <div className="flex items-center justify-between mb-2">
                      <Clock className={`${activeFilter === 'Pendiente' ? 'text-white' : 'text-rio-verde'} w-5 h-5`} />
                      <span className={`text-[10px] font-black uppercase tracking-widest ${activeFilter === 'Pendiente' ? 'text-white/80' : 'text-rio-verde'}`}>+ Live</span>
                    </div>
                    <div className={`text-2xl font-black ${activeFilter === 'Pendiente' ? 'text-white' : 'text-azul-oceano'}`}>{stats.pendientes}</div>
                    <div className={`text-[10px] font-bold uppercase tracking-wider ${activeFilter === 'Pendiente' ? 'text-white/70' : 'text-slate-500'}`}>Pendientes</div>
                 </button>

                 <button 
                   onClick={(e) => { e.stopPropagation(); setActiveFilter(activeFilter === 'En Trámite' ? null : 'En Trámite'); }}
                   className={`p-5 rounded-2xl border flex flex-col transition-all text-left ${activeFilter === 'En Trámite' ? 'bg-luz-solar text-white shadow-xl shadow-luz-solar/30 border-luz-solar scale-105 z-10' : 'bg-luz-solar/10 border-luz-solar/20 hover:bg-luz-solar/20'}`}
                 >
                    <div className="flex items-center justify-between mb-2">
                      <CalendarDays className={`${activeFilter === 'En Trámite' ? 'text-white' : 'text-luz-solar'} w-5 h-5`} />
                      <span className={`text-[10px] font-black uppercase tracking-widest ${activeFilter === 'En Trámite' ? 'text-white/80' : 'text-luz-solar'}`}>En curso</span>
                    </div>
                    <div className={`text-2xl font-black ${activeFilter === 'En Trámite' ? 'text-white' : 'text-azul-oceano'}`}>{stats.tramite}</div>
                    <div className={`text-[10px] font-bold uppercase tracking-wider ${activeFilter === 'En Trámite' ? 'text-white/70' : 'text-slate-500'}`}>En Trámite</div>
                 </button>

                 <button 
                   onClick={(e) => { e.stopPropagation(); setActiveFilter(activeFilter === 'Cumplido' ? null : 'Cumplido'); }}
                   className={`p-5 rounded-2xl border flex flex-col transition-all text-left ${activeFilter === 'Cumplido' ? 'bg-verde-nocturno text-white shadow-xl shadow-verde-nocturno/30 border-verde-nocturno scale-105 z-10' : 'bg-verde-nocturno/10 border-verde-nocturno/20 hover:bg-verde-nocturno/20'}`}
                 >
                    <div className="flex items-center justify-between mb-2">
                      <CheckCircle2 className={`${activeFilter === 'Cumplido' ? 'text-white' : 'text-verde-nocturno'} w-5 h-5`} />
                      <span className={`text-[10px] font-black uppercase tracking-widest ${activeFilter === 'Cumplido' ? 'text-white/80' : 'text-verde-nocturno'}`}>Éxito</span>
                    </div>
                    <div className={`text-2xl font-black ${activeFilter === 'Cumplido' ? 'text-white' : 'text-azul-oceano'}`}>{stats.cumplidos}</div>
                    <div className={`text-[10px] font-bold uppercase tracking-wider ${activeFilter === 'Cumplido' ? 'text-white/70' : 'text-slate-500'}`}>Cumplidos</div>
                 </button>

                 <button 
                   onClick={(e) => { e.stopPropagation(); setActiveFilter(activeFilter === 'Vencido' ? null : 'Vencido'); }}
                   className={`p-5 rounded-2xl border flex flex-col transition-all text-left ${activeFilter === 'Vencido' ? 'bg-rojo-hibisco text-white shadow-xl shadow-rojo-hibisco/30 border-rojo-hibisco scale-105 z-10' : 'bg-rojo-hibisco/10 border-rojo-hibisco/20 hover:bg-rojo-hibisco/20'}`}
                 >
                    <div className="flex items-center justify-between mb-2">
                      <AlertTriangle className={`${activeFilter === 'Vencido' ? 'text-white' : 'text-rojo-hibisco'} w-5 h-5`} />
                      <span className={`text-[10px] font-black uppercase tracking-widest ${activeFilter === 'Vencido' ? 'text-white/80' : 'text-rojo-hibisco'}`}>Crítico</span>
                    </div>
                    <div className={`text-2xl font-black ${activeFilter === 'Vencido' ? 'text-white' : 'text-azul-oceano'}`}>{stats.vencidos}</div>
                    <div className={`text-[10px] font-bold uppercase tracking-wider ${activeFilter === 'Vencido' ? 'text-white/70' : 'text-slate-500'}`}>Vencidos</div>
                 </button>
              </div>

              {activeTab === 'dashboard' && (
                <AnalyticsDashboard activeFilter={activeFilter} onChartClick={setActiveFilter} />
              )}
              {activeTab === 'table' && <ProcedureTable onDataChange={fetchStats} />}
              {activeTab === 'profiles' && <ProfilesModule onDataChange={fetchStats} />}
              
              {activeTab === 'settings' && (
                <div className="bg-white p-12 rounded-[32px] border border-slate-100 shadow-sm max-w-4xl mx-auto">
                  <div className="flex items-center gap-4 mb-8">
                      <div className="w-16 h-16 bg-[#61B1E3]/10 rounded-3xl flex items-center justify-center text-[#61B1E3]">
                        <Settings size={32} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-[#1F3B6F] tracking-tight">AJUSTES DE PLATAFORMA</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Configuración técnica y preferencias</p>
                      </div>
                  </div>
                  
                  <div className="space-y-6">
                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                        <h3 className="text-sm font-black text-[#1F3B6F] uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Database size={16} className="text-[#61B1E3]" />
                            Base de Datos
                        </h3>
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-slate-600 font-medium">Estado de conexión con Supabase</p>
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${connectionStatus.success ? 'bg-verde-nocturno text-white' : 'bg-rojo-hibisco text-white'}`}>
                              {connectionStatus.success ? 'Conectado' : 'Error'}
                            </span>
                        </div>
                      </div>

                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                        <h3 className="text-sm font-black text-[#1F3B6F] uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Bell size={16} className="text-[#61B1E3]" />
                            Notificaciones
                        </h3>
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-slate-600 font-medium">Alertas automáticas por correo</p>
                            <button className="w-12 h-6 bg-slate-300 rounded-full relative transition-colors">
                              <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                            </button>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-slate-100 flex justify-end">
                        <button 
                          onClick={() => setActiveTab('dashboard')}
                          className="px-8 py-3 bg-[#1F3B6F] text-white font-black rounded-xl text-xs uppercase tracking-widest hover:scale-105 transition-transform"
                        >
                          Guardar Cambios
                        </button>
                      </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
