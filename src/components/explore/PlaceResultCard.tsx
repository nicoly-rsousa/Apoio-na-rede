import { HybridMapPreview } from './HybridMapPreview';
import { Navigation } from 'lucide-react';
import type { Establishment, NearbyPlace } from '../../types';
import { directionsUrl } from '../../utils/directionsUrl';
import { AccessibilityIcons } from '../accessibility/AccessibilityIcons';

export function PlaceResultCard({ place, establishment, addressLabel }: { place?: NearbyPlace; establishment?: Establishment; addressLabel?: string }) {
  const name = establishment?.nome ?? place?.nome ?? addressLabel ?? '';
  const address = establishment?.endereco ?? place?.endereco ?? addressLabel;
  const destination = establishment ?? place;
  return <article className="premium-card rounded-2xl overflow-hidden" aria-label={addressLabel ? 'Endereço selecionado' : name}>
    <HybridMapPreview latitude={destination?.latitude} longitude={destination?.longitude} name={name} />
    <p className="px-5 pt-2 text-xs text-slate-500">Vista aérea e localização do estabelecimento.</p>
    {place?.fonte === 'osm' && <p className="px-5 pt-1 text-xs text-slate-500">Dados do local: <a className="underline" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© colaboradores do OpenStreetMap</a>.</p>}
    <div className="p-5 space-y-4">
      <div><h2 className="text-lg font-bold">{name}</h2>{address !== name && <p className="mt-1 text-sm text-slate-600">{address}</p>}</div>
      {establishment && <AccessibilityIcons establishment={establishment} />}
      <div className="flex flex-wrap gap-3">
        <a href={destination ? directionsUrl(destination) : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(name)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white"><Navigation size={16} aria-hidden="true" />Como chegar</a>
      </div>
    </div>
  </article>;
}
