export function formatDistance(meters: number) {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`;
}
