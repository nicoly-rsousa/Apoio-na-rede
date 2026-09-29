import { importLibrary, setOptions } from '@googlemaps/js-api-loader';

let loading: Promise<void> | undefined;

export function loadGoogleMaps(): Promise<void> {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();
  if (!key) return Promise.reject(new Error('VITE_GOOGLE_MAPS_API_KEY não configurada'));
  if (!loading) {
    setOptions({ key, v: 'weekly', language: 'pt-BR', region: 'BR' });
    loading = Promise.all([importLibrary('maps'), importLibrary('marker')])
      .then(() => undefined)
      .catch(error => { loading = undefined; throw error; });
  }
  return loading;
}
