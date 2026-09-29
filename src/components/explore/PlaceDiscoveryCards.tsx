import { ArrowUpRight, MapPin } from 'lucide-react';
import type { NearbyPlace } from '../../types';
import { MAP_CATEGORIES } from '../../data/mapCategories';
import { imageFallback } from '../../utils/imageFallback';

export function PlaceDiscoveryCards({ places, onSelect, loading = false, error = false, onRetry, onShowMap }: { places: NearbyPlace[]; onSelect: (place: NearbyPlace) => void; loading?: boolean; error?: boolean; onRetry?: () => void; onShowMap?: () => void }) {
  return <section className="discovery-places" aria-labelledby="discovery-places-title">
    <div className="section-heading"><div><span className="section-kicker">EM CATAGUASES</span><h2 id="discovery-places-title">Lugares para descobrir</h2></div><button type="button" onClick={onShowMap}>Ver no mapa <ArrowUpRight size={16} aria-hidden="true" /></button></div>
    <div role="status" className="mb-3 text-sm">
      {loading ? 'Buscando lugares desta categoria…' : error ? 'Não foi possível carregar sugestões do Google. Os cadastros locais disponíveis continuam abaixo.' : !places.length ? 'Nenhum lugar encontrado com os filtros atuais.' : `${places.length} lugares encontrados.`}
      {error && !loading && <button type="button" onClick={onRetry} className="ml-2 underline">Tentar carregar sugestões novamente</button>}
    </div>
    <div className="place-discovery-grid">{places.slice(0, 4).map(place => {
      const category = MAP_CATEGORIES[place.categoria];
      const Icon = category.icon;
      return <button key={place.id} type="button" className="place-discovery-card" onClick={() => onSelect(place)}>
        <div className="place-card-visual" style={{ '--place-color': category.color } as React.CSSProperties}>{place.foto ? <img src={place.foto} alt={`Foto de ${place.nome}`} loading="lazy" onError={imageFallback} className="absolute inset-0 h-full w-full object-cover" /> : <><span className="place-card-circle" /><Icon size={42} strokeWidth={1.3} aria-hidden="true" /></>}<span className="place-card-arrow"><ArrowUpRight size={16} aria-hidden="true" /></span></div>
        <div className="place-card-body"><h3>{place.nome}</h3><p>{category.label}</p><span><MapPin size={12} aria-hidden="true" />Cataguases, MG</span><strong>Consultar acessibilidade <ArrowUpRight size={13} aria-hidden="true" /></strong></div>
      </button>;
    })}</div>
  </section>;
}
