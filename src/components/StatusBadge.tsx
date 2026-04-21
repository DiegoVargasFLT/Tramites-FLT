/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EstadoTramite } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const statusConfig: Record<EstadoTramite, { color: string; bg: string; dot: string }> = {
  'Pendiente': { 
    color: 'text-azul-oceano', 
    bg: 'bg-rio-verde/10', 
    dot: 'bg-rio-verde shadow-[0_0_8px_#74C6D3]' 
  },
  'En Trámite': { 
    color: 'text-amber-900', 
    bg: 'bg-luz-solar/10', 
    dot: 'bg-luz-solar shadow-[0_0_8px_#D97706]' 
  },
  'Cumplido': { 
    color: 'text-verde-nocturno', 
    bg: 'bg-verde-nocturno/10', 
    dot: 'bg-verde-nocturno shadow-[0_0_8px_#025850]' 
  },
  'Vencido': { 
    color: 'text-rojo-hibisco', 
    bg: 'bg-rojo-hibisco/10', 
    dot: 'bg-rojo-hibisco shadow-[0_0_8px_#AD1924]' 
  }
};

export const StatusBadge = ({ estado }: { estado: EstadoTramite }) => {
  const config = statusConfig[estado];
  
  return (
    <div className={cn(
      "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider",
      config.bg,
      config.color
    )}>
      <span className={cn("w-2 h-2 rounded-full", config.dot)} />
      {estado}
    </div>
  );
};
