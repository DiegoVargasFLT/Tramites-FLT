/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { getSupabase } from '../lib/supabase';
import { IndicadorResponsable, IndicadorEntidad } from '../types';
import { RefreshCw, BarChart3 } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const BRAND_COLORS = {
  'Pendiente': '#74C6D3', // Río Verde
  'En Trámite': '#D97706', // Ámbar (Antes amarillo)
  'Cumplido': '#025850',   // Verde Nocturno
  'Vencido': '#AD1924'     // Rojo Hibisco
};

export const AnalyticsDashboard = ({ activeFilter, onChartClick }: { activeFilter?: string | null, onChartClick?: (filter: string | null) => void }) => {
  const [data, setData] = useState<IndicadorResponsable[]>([]);
  const [entityData, setEntityData] = useState<IndicadorEntidad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIndicadores();
  }, []);

  const fetchIndicadores = async () => {
    const supabase = getSupabase();
    if (!supabase) {
      console.warn("Supabase no configurado.");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data: tramitesRes, error: tramiteErr } = await supabase
        .from('tramites')
        .select(`
          estado,
          perfiles:perfiles(nombre_completo),
          entidades:Entidades(Entidad)
        `);
      
      if (tramiteErr) {
        console.error("Error al cargar datos para indicadores:", tramiteErr);
      } else if (tramitesRes && tramitesRes.length > 0) {
        const respMap: Record<string, any> = {};
        const entMap: Record<string, any> = {};

        tramitesRes.forEach((t: any) => {
          const respName = t.perfiles?.nombre_completo || 'Sin asignar';
          const entName = t.entidades?.Entidad || 'Sin entidad';
          const estado = t.estado || 'Pendiente';

          const respKey = `${respName}-${estado}`;
          if (!respMap[respKey]) respMap[respKey] = { responsable: respName, estado, cantidad_tramites: 0 };
          respMap[respKey].cantidad_tramites += 1;

          const entKey = `${entName}-${estado}`;
          if (!entMap[entKey]) entMap[entKey] = { entidad: entName, estado, cantidad_tramites: 0 };
          entMap[entKey].cantidad_tramites += 1;
        });

        setData(Object.values(respMap));
        setEntityData(Object.values(entMap));
      }
    } catch (e) {
      console.error("Excepción en fetchIndicadores:", e);
    }
    setLoading(false);
  };

  // Filtrar datos según el estado seleccionado
  const filteredData = activeFilter 
    ? data.filter(item => item.estado === activeFilter)
    : data;
    
  const filteredEntityData = activeFilter
    ? entityData.filter(item => item.estado === activeFilter)
    : entityData;

  // Transformar datos para el gráfico de barras agrupado por responsable
  const chartData = filteredData.reduce((acc: any[], current) => {
    let entry = acc.find(item => item.responsable === current.responsable);
    if (!entry) {
      entry = { responsable: current.responsable };
      acc.push(entry);
    }
    entry[current.estado] = current.cantidad_tramites;
    return acc;
  }, []);

  // Transformar datos para el gráfico de barras agrupado por entidad
  const entityChartData = filteredEntityData.reduce((acc: any[], current) => {
    let entry = acc.find(item => item.entidad === current.entidad);
    if (!entry) {
      entry = { entidad: current.entidad };
      acc.push(entry);
    }
    entry[current.estado] = current.cantidad_tramites;
    return acc;
  }, []);

  // Datos para el gráfico de torta (Resumen Global)
  const globalSummary = data.reduce((acc: any[], current) => {
    let entry = acc.find(item => item.name === current.estado);
    if (!entry) {
      entry = { name: current.estado, value: 0 };
      acc.push(entry);
    }
    entry.value += current.cantidad_tramites;
    return acc;
  }, []);

  const handleBarClick = (data: any) => {
    if (onChartClick) {
       // Si hay un filtro activo, clicking another bar will toggle or change it
       // But usually, clicking a specific bar segment is hard to catch directly in Recharts 
       // unless we use onClick in the Bar component.
    }
  };

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
      <div className="h-80 bg-slate-100 rounded-2xl" />
      <div className="h-80 bg-slate-100 rounded-2xl" />
    </div>
  );

  if (data.length === 0 && entityData.length === 0) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center mb-8">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-slate-50 rounded-full text-slate-300">
             <BarChart3 size={48} />
          </div>
          <div>
            <h3 className="text-azul-oceano font-bold text-lg">No hay datos suficientes para las gráficas</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto mt-2">
              Asegúrate de que existan trámites registrados en la base de datos de Supabase para visualizar las estadísticas.
            </p>
          </div>
          <button 
            onClick={fetchIndicadores}
            className="mt-4 px-6 py-2 bg-torca-azul text-white rounded-xl text-sm font-bold shadow-lg shadow-torca-azul/20 hover:opacity-90 transition-all flex items-center gap-2"
          >
            <RefreshCw size={16} /> Reintentar Carga
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mb-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Barras por Responsable (Horizontal) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-sm font-bold text-azul-oceano uppercase tracking-widest mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-torca-azul rounded-full"></span>
            Gestión por Responsable
          </h3>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={chartData} margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E2E8F0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10, fontWeight: 600 }} />
                <YAxis 
                  dataKey="responsable" 
                  type="category"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748B', fontSize: 10, fontWeight: 700 }}
                  width={100}
                />
                <Tooltip 
                  cursor={{ fill: '#F8FAFC' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }} />
                <Bar 
                  dataKey="Pendiente" 
                  stackId="a" 
                  fill={BRAND_COLORS['Pendiente']} 
                  barSize={15} 
                  onClick={() => onChartClick?.('Pendiente')}
                  className="cursor-pointer"
                />
                <Bar 
                  dataKey="En Trámite" 
                  stackId="a" 
                  fill={BRAND_COLORS['En Trámite']} 
                  barSize={15} 
                  onClick={() => onChartClick?.('En Trámite')}
                  className="cursor-pointer"
                />
                <Bar 
                  dataKey="Cumplido" 
                  stackId="a" 
                  fill={BRAND_COLORS['Cumplido']} 
                  barSize={15} 
                  onClick={() => onChartClick?.('Cumplido')}
                  className="cursor-pointer"
                />
                <Bar 
                  dataKey="Vencido" 
                  stackId="a" 
                  fill={BRAND_COLORS['Vencido']} 
                  radius={[0, 4, 4, 0]} 
                  barSize={15} 
                  onClick={() => onChartClick?.('Vencido')}
                  className="cursor-pointer"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Barras por Entidad (Horizontal) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-sm font-bold text-azul-oceano uppercase tracking-widest mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-rio-verde rounded-full"></span>
            Gestión por Entidad
          </h3>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={entityChartData} margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E2E8F0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10, fontWeight: 600 }} />
                <YAxis 
                  dataKey="entidad" 
                  type="category"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748B', fontSize: 10, fontWeight: 700 }}
                  width={100}
                />
                <Tooltip 
                  cursor={{ fill: '#F8FAFC' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }} />
                <Bar 
                  dataKey="Pendiente" 
                  stackId="b" 
                  fill={BRAND_COLORS['Pendiente']} 
                  barSize={15} 
                  onClick={() => onChartClick?.('Pendiente')}
                  className="cursor-pointer"
                />
                <Bar 
                  dataKey="En Trámite" 
                  stackId="b" 
                  fill={BRAND_COLORS['En Trámite']} 
                  barSize={15} 
                  onClick={() => onChartClick?.('En Trámite')}
                  className="cursor-pointer"
                />
                <Bar 
                  dataKey="Cumplido" 
                  stackId="b" 
                  fill={BRAND_COLORS['Cumplido']} 
                  barSize={15} 
                  onClick={() => onChartClick?.('Cumplido')}
                  className="cursor-pointer"
                />
                <Bar 
                  dataKey="Vencido" 
                  stackId="b" 
                  fill={BRAND_COLORS['Vencido']} 
                  radius={[0, 4, 4, 0]} 
                  barSize={15} 
                  onClick={() => onChartClick?.('Vencido')}
                  className="cursor-pointer"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 max-w-md mx-auto">
        <h3 className="text-sm font-bold text-azul-oceano uppercase tracking-widest mb-6 leading-tight">
          Resumen Global por Estado
          {activeFilter && <span className="block text-[9px] text-torca-azul mt-1">Filtrado por: {activeFilter}</span>}
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={globalSummary}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                onClick={(entry) => onChartClick?.(String(entry.name))}
                className="cursor-pointer"
              >
                {globalSummary.map((entry: any, index: number) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={BRAND_COLORS[entry.name as keyof typeof BRAND_COLORS] || '#CBD5E1'}
                    stroke={activeFilter === entry.name ? '#1F3B6F' : 'none'}
                    strokeWidth={activeFilter === entry.name ? 3 : 0}
                    opacity={activeFilter && activeFilter !== entry.name ? 0.3 : 1}
                  />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
