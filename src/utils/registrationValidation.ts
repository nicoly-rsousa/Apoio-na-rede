export function validPhotoUrl(value: string): boolean {
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol); }
  catch { return false; }
}
export function validCoordinates(latitude: number, longitude: number): boolean {
  return Number.isFinite(latitude) && Number.isFinite(longitude)
    && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;
}
export function validateRegistration(data: {nome: string; descricao: string; endereco: string; cidade: string; estado: string; latitude: number; longitude: number; fotos: string[]}) {
  if (![data.nome, data.descricao, data.endereco, data.cidade].every(value => value.trim())) throw new Error('Preencha nome, descrição, endereço e cidade.');
  if (!/^(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)$/.test(data.estado)) throw new Error('Informe uma UF válida.');
  if (!validCoordinates(data.latitude, data.longitude)) throw new Error('Informe coordenadas válidas para o local.');
  if (!data.fotos.every(validPhotoUrl)) throw new Error('Informe URLs de fotos válidas (HTTP ou HTTPS).');
}
