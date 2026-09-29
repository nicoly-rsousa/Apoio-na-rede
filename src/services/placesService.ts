import { loadGoogleMaps } from '../lib/googleMaps';
import { categoryForTypes, MAP_CATEGORIES } from '../data/mapCategories';
import { CATEGORY_QUERIES, categoryForActivity } from '../data/categoryDiscovery';
import type { EstablishmentCategory, NearbyPlace } from '../types';

const fields = ['id', 'displayName', 'formattedAddress', 'location', 'types', 'primaryType'];
const bounds = { south: -21.47, north: -21.31, west: -42.78, east: -42.61 };

function convert(place: google.maps.places.Place): NearbyPlace[] {
  if (!place.id || !place.location || !place.displayName) return [];
  const latitude = place.location.lat();
  const longitude = place.location.lng();
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];
  const typedCategory = categoryForTypes(place.types ?? [], place.primaryType);
  const activityCategory = categoryForActivity(place.displayName);
  const genericType = !place.primaryType || ['store', 'establishment', 'point_of_interest'].includes(place.primaryType);
  const categoria = genericType ? activityCategory ?? typedCategory : typedCategory ?? activityCategory;
  if (!categoria) return [];
  if (latitude < bounds.south || latitude > bounds.north || longitude < bounds.west || longitude > bounds.east) return [];
  return [{ id: `google-${place.id}`, place_id: place.id, fonte: 'google', nome: place.displayName,
    endereco: place.formattedAddress || 'Endereço não informado', latitude, longitude, categoria }];
}

async function library() {
  await loadGoogleMaps();
  return await google.maps.importLibrary('places') as google.maps.PlacesLibrary;
}

const nearbyRequests = new Map<string, Promise<NearbyPlace[]>>();
const nearbyCache = new Map<string, { expires: number; places: NearbyPlace[] }>();

export const PlacesService = {
  async photos(placeId: string) {
    const { Place } = await library();
    const place = new Place({ id: placeId });
    await place.fetchFields({ fields: ['photos'] });
    return (place.photos ?? []).map(photo => ({
      url: photo.getURI({ maxWidth: 800, maxHeight: 500 }),
      authors: photo.authorAttributions.map(author => ({ nome: author.displayName, url: author.uri })),
    }));
  },
  async search(text: string): Promise<NearbyPlace[]> {
    if (text.trim().length < 3) return [];
    const { Place } = await library();
    const { places } = await Place.searchByText({ textQuery: `${text}, Cataguases MG`, fields,
      locationRestriction: bounds, maxResultCount: 20, language: 'pt-BR', region: 'br' });
    return places.flatMap(convert);
  },
  nearby(center: [number, number], category: EstablishmentCategory | 'todas'): Promise<NearbyPlace[]> {
    const requestKey = JSON.stringify([center, category]);
    const cached = nearbyCache.get(requestKey);
    if (cached && cached.expires > Date.now()) return Promise.resolve(cached.places);
    const pending = nearbyRequests.get(requestKey);
    if (pending) return pending;
    const request = (async () => {
    const { Place, SearchNearbyRankPreference } = await library();
    const types = category === 'todas' ? [...new Set(Object.values(MAP_CATEGORIES).flatMap(item => item.types))] : MAP_CATEGORIES[category].types;
    const requests = [Place.searchNearby({ fields, includedTypes: types, maxResultCount: 20,
      locationRestriction: { center: { lat: center[0], lng: center[1] }, radius: 7000 },
      rankPreference: SearchNearbyRankPreference.DISTANCE, language: 'pt-BR', region: 'br' })];
    if (category !== 'todas') {
      for (const activity of CATEGORY_QUERIES[category]) {
        requests.push(Place.searchByText({ textQuery: `${activity} em Cataguases MG`, fields,
          locationRestriction: bounds, maxResultCount: 20, language: 'pt-BR', region: 'br' }));
      }
    }
    const responses = await Promise.allSettled(requests);
    const successes = responses.filter(result => result.status === 'fulfilled');
    if (!successes.length) throw (responses[0] as PromiseRejectedResult).reason;
    const results = successes.flatMap(result => result.value.places.flatMap(convert))
      .filter(place => category === 'todas' || place.categoria === category);
    const unique = [...new Map(results.map(place => [place.place_id, place])).values()];
    const failure = responses.find(result => result.status === 'rejected');
    if (!unique.length && failure?.status === 'rejected') throw failure.reason;
    // Reuse successful discovery during navigation without repeatedly spending quota.
    if (responses.every(result => result.status === 'fulfilled') && unique.length) {
      if (nearbyCache.size >= 30) nearbyCache.delete(nearbyCache.keys().next().value!);
      nearbyCache.set(requestKey, { expires: Date.now() + 5 * 60_000, places: unique });
    }
    return unique;
    })().finally(() => nearbyRequests.delete(requestKey));
    nearbyRequests.set(requestKey, request);
    return request;
  },
};
