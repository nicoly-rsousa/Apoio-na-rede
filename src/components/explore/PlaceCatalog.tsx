import type { Establishment, NearbyPlace } from '../../types';
import { PlaceResultCard } from './PlaceResultCard';

export interface CatalogEntry { place?: NearbyPlace; establishment?: Establishment; addressLabel?: string }
export function PlaceCatalog({ entries, center, limit }: { entries: CatalogEntry[]; center: [number, number]; limit?: number }) {
  const distance = (entry: CatalogEntry) => {
    const point = entry.establishment ?? entry.place;
    return point ? (point.latitude - center[0]) ** 2 + ((point.longitude - center[1]) * Math.cos(center[0] * Math.PI / 180)) ** 2 : Infinity;
  };
  const results = [...entries].sort((a, b) => distance(a) - distance(b)).slice(0, limit);
  return <section className="mb-12">
    <p role="status" className="mb-4 text-sm">{results.length} {results.length === 1 ? 'local disponível' : 'locais disponíveis'}.</p>
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">{results.map(entry => <PlaceResultCard key={(entry.establishment ?? entry.place)?.id ?? entry.addressLabel} {...entry} />)}</div>
  </section>;
}
