import { MAP_CATEGORIES } from '../../data/mapCategories';
import type { EstablishmentCategory } from '../../types';

export function MapLegend({ selected, onSelect }: { selected: EstablishmentCategory | 'todas'; onSelect: (category: EstablishmentCategory | 'todas') => void }) {
  return <details className="mt-3 rounded-2xl border border-slate-200 bg-white p-4" open>
    <summary className="cursor-pointer text-sm font-bold text-slate-800">Categorias no mapa</summary>
    <div className="mt-3 flex flex-wrap gap-2" aria-label="Filtrar categoria no mapa">
      <button type="button" aria-pressed={selected === 'todas'} onClick={() => onSelect('todas')} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold">Todas</button>
      {Object.entries(MAP_CATEGORIES).map(([id, category]) => {
        const Icon = category.icon;
        return <button key={id} type="button" aria-pressed={selected === id} onClick={() => onSelect(id as EstablishmentCategory)} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${selected === id ? 'border-blue-700 bg-blue-50 font-bold' : 'border-slate-200'}`}>
          <span className="rounded-full p-1.5 text-white" style={{ backgroundColor: category.color }}><Icon size={14} aria-hidden="true" /></span>{category.label}
        </button>;
      })}
    </div>
    <p className="mt-3 text-xs text-slate-500">Cor e ícone indicam a categoria. Consulte cada local para ver recursos presentes, ausentes ou não verificados.</p>
  </details>;
}
