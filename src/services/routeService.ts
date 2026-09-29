export interface RouteDestination { id: string; nome: string; latitude: number; longitude: number; cidade?: string }

interface WalkingResponse {
  routes?: { geometry?: { coordinates?: number[][] }; distance: number; duration: number }[];
}

export async function fetchWalkingRoute(origin: { latitude: number; longitude: number }, destination: RouteDestination) {
  const endpoint = `https://routing.openstreetmap.de/routed-foot/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson&steps=true`;
  const response = await fetch(endpoint, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error('Serviço de rotas indisponível');
  const data = await response.json() as WalkingResponse;
  const result = data.routes?.[0];
  const points = result?.geometry?.coordinates;
  if (!result || !points || points.length < 2 || !Number.isFinite(result.distance) || !Number.isFinite(result.duration)
    || points.some(point => point.length < 2 || !Number.isFinite(point[0]) || !Number.isFinite(point[1]))) throw new Error('Rota não encontrada');
  return { distance: result.distance, duration: result.duration, coordinates: points.map(([lng, lat]): [number, number] => [lat, lng]) };
}
