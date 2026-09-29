import type { Establishment, EstablishmentCategory, NearbyPlace } from '../types';

export function externalDiscoveryPlaces(places: NearbyPlace[], locals: Establishment[], category: EstablishmentCategory | 'todas', onlyVerified: boolean, includeUnknown: boolean): NearbyPlace[] {
  if (onlyVerified || !includeUnknown) return [];
  return places.filter(place => (category === 'todas' || place.categoria === category)
    && !locals.some(local => !!place.place_id && local.place_id === place.place_id));
}

export function discoveryCards(locals: Establishment[], external: NearbyPlace[]): NearbyPlace[] {
  return [...locals.map(local => ({ id: local.id, place_id: local.place_id, nome: local.nome,
    categoria: local.categoria, endereco: local.endereco, latitude: local.latitude, longitude: local.longitude, foto: local.fotos?.[0] })), ...external];
}
