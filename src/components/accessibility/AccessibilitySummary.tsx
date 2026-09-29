import type { Establishment } from '../../types';
import { ACCESSIBILITY_RESOURCES, resourceState } from '../../data/accessibilityResources';

const states = {
  sim: { label: 'Sim', symbol: '✓', style: 'bg-emerald-50 text-emerald-800' },
  nao: { label: 'Não', symbol: '✕', style: 'bg-rose-50 text-rose-800' },
  desconhecido: { label: 'Não verificado', symbol: '?', style: 'bg-slate-100 text-slate-700' },
};

export function AccessibilitySummary({ establishment }: { establishment?: Establishment | null }) {
  const criteria = establishment?.criteria ?? [];
  const hasInformation = criteria.some(item => item.presente === true || item.presente === false);
  return <section aria-label="Acessibilidade do estabelecimento" className="space-y-3">
    <h3 className="font-bold text-slate-900">Acessibilidade do local</h3>
    <p className="text-xs text-slate-600">{!hasInformation
      ? 'Este local ainda não possui informações de acessibilidade cadastradas.'
      : establishment?.status === 'verificado' ? 'Informações cadastradas e revisadas.' : 'Informações cadastradas; aguardando revisão.'}</p>
    <dl className="space-y-2 text-xs">{ACCESSIBILITY_RESOURCES.map(resource => {
      const state = states[resourceState(criteria, resource.id)];
      return <div key={resource.id} className="flex items-center justify-between gap-2"><dt>{resource.label}</dt><dd className={`rounded-lg px-2 py-1 font-semibold ${state.style}`}><span aria-hidden="true">{state.symbol} </span>{state.label}</dd></div>;
    })}</dl>
    {establishment?.verificado_em && <p className="text-xs text-slate-500">Última revisão: {new Date(establishment.verificado_em).toLocaleDateString('pt-BR')}</p>}
    <p className="text-xs text-slate-500">Os recursos do destino não confirmam a acessibilidade do trajeto.</p>
  </section>;
}
