import { Accessibility, ArrowUpDown, DoorOpen, Fence, Footprints, Hand, ParkingSquare, Toilet, TrendingUp } from 'lucide-react';
import type { Establishment } from '../../types';
import { ACCESSIBILITY_RESOURCES, resourceState } from '../../data/accessibilityResources';

const resourceIcons = {
  libras: Hand,
  entrada_acessivel: DoorOpen,
  rampa: TrendingUp,
  elevador: ArrowUpDown,
  corrimao: Fence,
  banheiro_pcd: Toilet,
  vaga_pcd: ParkingSquare,
  piso_tatil: Footprints,
  cadeira_rodas: Accessibility,
};

export function AccessibilityIcons({ establishment }: { establishment: Establishment }) {
  const resources = ACCESSIBILITY_RESOURCES.filter(resource => resourceState(establishment.criteria ?? [], resource.id) === 'sim');

  if (!resources.length) return null;

  return <ul className="flex flex-wrap gap-2" aria-label="Recursos de acessibilidade cadastrados como disponíveis">
    {resources.map(resource => {
      const Icon = resourceIcons[resource.id];
      return <li key={resource.id} title={resource.label} className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
        <Icon size={22} aria-hidden="true" />
        <span className="sr-only">{resource.label}</span>
      </li>;
    })}
  </ul>;
}
