import React from 'react';
import { DisabilityType } from '../../types';
import { Accessibility, Eye, Ear, Brain, HeartPulse } from 'lucide-react';

interface DisabilityBadgeProps {
  type: DisabilityType;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  active?: boolean;
  onClick?: () => void;
}

export const DISABILITY_INFO: Record<
  DisabilityType,
  { label: string; shortLabel: string; description: string; icon: React.ElementType; color: string; activeBg: string }
> = {
  mobilidade: {
    label: 'Mobilidade Reduzida / Cadeirante',
    shortLabel: 'Mobilidade',
    description: 'Rampas, elevadores, portas largas, banheiros adaptados',
    icon: Accessibility,
    color: 'text-blue-900 bg-white border-blue-950/15 hover:bg-blue-50',
    activeBg: 'bg-blue-950 text-white border-blue-950 shadow-sm',
  },
  visual: {
    label: 'Deficiência Visual / Baixa Visão',
    shortLabel: 'Visual',
    description: 'Piso tátil, Braille, audiodescrição, cão-guia aceito',
    icon: Eye,
    color: 'text-blue-900 bg-white border-blue-950/15 hover:bg-blue-50',
    activeBg: 'bg-blue-950 text-white border-blue-950 shadow-sm',
  },
  auditiva: {
    label: 'Deficiência Auditiva / Libras',
    shortLabel: 'Auditiva',
    description: 'Atendimento em Libras, alertas visuais, suporte por texto',
    icon: Ear,
    color: 'text-blue-900 bg-white border-blue-950/15 hover:bg-blue-50',
    activeBg: 'bg-blue-950 text-white border-blue-950 shadow-sm',
  },
  intelectual: {
    label: 'Intelectual / Neurodivergência / TEA',
    shortLabel: 'Intelectual / TEA',
    description: 'Linguagem simples, baixo ruído sensorial, equipe acolhedora',
    icon: Brain,
    color: 'text-blue-900 bg-white border-blue-950/15 hover:bg-blue-50',
    activeBg: 'bg-blue-950 text-white border-blue-950 shadow-sm',
  },
  invisivel: {
    label: 'Deficiência Invisível / Doença Crônica',
    shortLabel: 'Invisível / Crônica',
    description: 'Cordão de Girassol aceito, assento e fila prioritária sem constrangimento',
    icon: HeartPulse,
    color: 'text-blue-900 bg-white border-blue-950/15 hover:bg-blue-50',
    activeBg: 'bg-blue-950 text-white border-blue-950 shadow-sm',
  },
};

export const DisabilityBadge: React.FC<DisabilityBadgeProps> = ({
  type,
  size = 'md',
  showLabel = true,
  active = false,
  onClick,
}) => {
  const info = DISABILITY_INFO[type];
  if (!info) return null;

  const Icon = info.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-sm gap-1.5',
    lg: 'px-3.5 py-1.5 text-base gap-2 font-medium',
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 18,
  };

  const baseStyle = `inline-flex items-center rounded-full border transition-all duration-150 font-semibold shadow-sm ${
    sizeClasses[size]
  } ${active ? info.activeBg : info.color} ${onClick ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2' : ''}`;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        aria-label={`${info.label}: ${active ? 'Filtro ativado' : 'Filtro desativado'}`}
        className={baseStyle}
        title={info.description}
      >
        <Icon size={iconSizes[size]} aria-hidden="true" />
        {showLabel && <span>{info.shortLabel}</span>}
      </button>
    );
  }

  return (
    <span className={baseStyle} title={info.description}>
      <Icon size={iconSizes[size]} aria-hidden="true" />
      {showLabel && <span>{info.shortLabel}</span>}
      <span className="sr-only">({info.label})</span>
    </span>
  );
};
