import { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../../lib/googleMaps';

export function HybridMapPreview({ latitude, longitude, name }: { latitude?: number; longitude?: number; name: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const hostElement = host.current;
    if (!hostElement) return;
    // Each initialization owns its DOM, including during StrictMode cleanup.
    const container = document.createElement('div');
    container.style.cssText = 'width:100%;height:100%';
    hostElement.replaceChildren(container);
    let cancelled = false;
    let map: google.maps.Map | undefined;
    let marker: google.maps.marker.AdvancedMarkerElement | undefined;
    let readyListener: google.maps.MapsEventListener | undefined;
    const timeout = window.setTimeout(() => {
      if (!cancelled) { setFailed(true); setLoading(false); }
    }, 15000);
    setFailed(false);
    setLoading(true);
    const fail = () => {
      if (cancelled) return;
      clearTimeout(timeout);
      setFailed(true);
      setLoading(false);
    };
    async function load() {
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) { fail(); return; }
      try {
        await loadGoogleMaps();
        if (cancelled || !container.isConnected) return;
        const position = { lat: latitude!, lng: longitude! };
        map = new google.maps.Map(container, {
          center: position, zoom: 18, mapTypeId: 'hybrid', mapId: 'DEMO_MAP_ID',
          streetViewControl: false, mapTypeControl: false, fullscreenControl: false,
          gestureHandling: 'cooperative', clickableIcons: false,
        });
        readyListener = google.maps.event.addListenerOnce(map, 'tilesloaded', () => {
          if (cancelled) return;
          clearTimeout(timeout);
          setLoading(false);
          setFailed(false);
        });
        marker = new google.maps.marker.AdvancedMarkerElement({ map, position, title: name });
      } catch { fail(); }
    }
    void load();
    return () => {
      cancelled = true;
      clearTimeout(timeout);
      // Google can invalidate a map after a quota/authentication failure.
      // Cleanup must still finish without throwing into React's unmount phase.
      const cleanup = [
        () => readyListener?.remove(),
        () => { if (marker) marker.map = null; },
        () => { if (map) google.maps.event.clearInstanceListeners(map); },
      ];
      for (const dispose of cleanup) {
        try { dispose(); } catch { /* The provider has already invalidated this instance. */ }
      }
      container.remove();
    };
  }, [latitude, longitude, name, attempt]);
  return <div className="relative h-56">
    <div ref={host} className="w-full h-full" aria-label={`Mapa aéreo de ${name}`} />
    {loading && !failed && <div role="status" className="absolute inset-0 bg-slate-100 flex items-center justify-center text-sm pointer-events-none">Carregando mapa…</div>}
    {failed && Number.isFinite(latitude) && Number.isFinite(longitude) ? <iframe
      key={attempt}
      title={`Localização de ${name} no Google Maps`}
      src={`https://www.google.com/maps?q=${latitude},${longitude}&t=k&z=18&output=embed`}
      className="absolute inset-0 w-full h-full border-0"
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      allowFullScreen
    /> : failed && <div role="status" className="absolute inset-0 bg-slate-100 flex flex-col items-center justify-center gap-2 text-sm"><p>Localização indisponível. Use “Como chegar” para abrir o local.</p><button type="button" className="underline" onClick={() => setAttempt(value => value + 1)}>Tentar novamente</button></div>}
  </div>;
}
