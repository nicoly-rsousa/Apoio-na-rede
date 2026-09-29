import React, { useEffect, useRef, useState } from 'react';
import { renderToString } from 'react-dom/server';
import { Navigation } from 'lucide-react';
import { Establishment, AccessibleRoute, NearbyPlace } from '../../types';
import { DisabilityBadge } from '../accessibility/DisabilityBadge';
import { VerifiedBadge } from '../establishments/VerifiedBadge';
import { MAP_CATEGORIES } from '../../data/mapCategories';
import { AccessibilitySummary } from '../accessibility/AccessibilitySummary';
import { loadGoogleMaps } from '../../lib/googleMaps';
const getCategoryIconSvg = (category: string) => {
  const Icon = MAP_CATEGORIES[category as keyof typeof MAP_CATEGORIES]?.icon ?? Navigation;
  return renderToString(<Icon size={18} color="white" />);
};
const getCategoryColor = (category: string) => MAP_CATEGORIES[category as keyof typeof MAP_CATEGORIES]?.color ?? '#2563eb';

interface GoogleMapProps {
  establishments?: Establishment[];
  selectedEstablishment?: Establishment | null;
  onSelectEstablishment?: (establishment: Establishment) => void;
  activeRoute?: AccessibleRoute | null;
  interactivePointSelection?: boolean;
  onPointSelected?: (lat: number, lng: number) => void;
  center?: [number, number];
  zoom?: number;
  heightClass?: string;
  searchedAddress?: { latitude: number; longitude: number; label: string } | null;
  nearbyPlaces?: NearbyPlace[];
  selectedPlace?: NearbyPlace | null;
  onSelectPlace?: (place: NearbyPlace) => void;
  onRequestRoute?: (place: NearbyPlace) => void;
  userLocation?: { latitude: number; longitude: number; accuracy: number } | null;
}


const EMPTY_ESTABLISHMENTS: Establishment[] = [];
const EMPTY_PLACES: NearbyPlace[] = [];

export const GoogleMap: React.FC<GoogleMapProps> = ({
  establishments = EMPTY_ESTABLISHMENTS, selectedEstablishment, onSelectEstablishment,
  activeRoute, interactivePointSelection = false, onPointSelected,
  center = [-21.3924, -42.6896], zoom = 14, heightClass = 'h-[550px]',
  searchedAddress, nearbyPlaces = EMPTY_PLACES, userLocation, selectedPlace, onSelectPlace, onRequestRoute,
}) => {
  const container = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const hasApiKey = Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim());
  const point = selectedPlace ?? searchedAddress ?? selectedEstablishment;
  const lat = point?.latitude ?? center[0];
  const lng = point?.longitude ?? center[1];
  const centerLat = center[0];
  const centerLng = center[1];
  const resultCoordinates = JSON.stringify([...establishments, ...nearbyPlaces]
    .filter(item => Number.isFinite(item.latitude) && Number.isFinite(item.longitude))
    .map(item => [item.latitude, item.longitude]));
  const initialView = useRef({ center: { lat, lng }, zoom });
  const selectRef = useRef(onSelectEstablishment);
  selectRef.current = onSelectEstablishment;
  const selectPlaceRef = useRef(onSelectPlace);
  selectPlaceRef.current = onSelectPlace;
  const routeRef = useRef(onRequestRoute);
  routeRef.current = onRequestRoute;

  useEffect(() => {
    let cancelled = false;
    let instance: google.maps.Map | undefined;
    setError('');
    loadGoogleMaps().then(() => {
      if (cancelled || !container.current) return;
      instance = new google.maps.Map(container.current, {
        ...initialView.current,
        mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID',
        colorScheme: 'DARK',
        mapTypeControl: false, streetViewControl: false, clickableIcons: false,
        gestureHandling: 'greedy',
      });
      setMap(instance);
    }).catch(() => {
      if (!cancelled) setError('Não foi possível carregar o mapa. Verifique a conexão ou a configuração do serviço.');
    });
    return () => {
      cancelled = true;
      if (instance) google.maps.event.clearInstanceListeners(instance);
    };
  }, [attempt]);

  useEffect(() => {
    if (!map) return;
    if (activeRoute && activeRoute.coordenadas.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      activeRoute.coordenadas.forEach(([lat, lng]) => bounds.extend({ lat, lng }));
      map.fitBounds(bounds, 36);
      const listener = google.maps.event.addListenerOnce(map, 'idle', () => {
        if ((map.getZoom() ?? 0) > 17) map.setZoom(17);
      });
      return () => listener.remove();
    } else {
      map.setCenter({ lat, lng });
      map.setZoom(zoom);
    }
  }, [map, lat, lng, zoom, activeRoute]);

  useEffect(() => {
    if (!map || !interactivePointSelection || !onPointSelected) return;
    const listener = map.addListener('click', (event: google.maps.MapMouseEvent) => {
      if (event.latLng) onPointSelected(event.latLng.lat(), event.latLng.lng());
    });
    return () => listener.remove();
  }, [map, interactivePointSelection, onPointSelected]);

  useEffect(() => {
    if (!map || point || activeRoute || interactivePointSelection) return;
    const coordinates = JSON.parse(resultCoordinates) as [number, number][];
    if (!coordinates.length) return;
    const bounds = new google.maps.LatLngBounds();
    coordinates.forEach(([lat, lng]) => bounds.extend({ lat, lng }));
    map.fitBounds(bounds, 48);
    const listener = google.maps.event.addListenerOnce(map, 'idle', () => {
      if ((map.getZoom() ?? 0) > 16) map.setZoom(16);
    });
    return () => listener.remove();
  }, [map, resultCoordinates, point, activeRoute, interactivePointSelection]);

  useEffect(() => {
    if (!map) return;
    const markers: google.maps.marker.AdvancedMarkerElement[] = [];
    const overlays: (google.maps.Polyline | google.maps.Circle)[] = [];
    const listeners: google.maps.MapsEventListener[] = [];
    const popup = new google.maps.InfoWindow();
    function addMarker(latitude: number, longitude: number, title: string, category?: string, selected = false, content?: React.ReactNode, onClick?: () => void, onRoute?: () => void) {
      const element = document.createElement('div');
      const size = selected ? 44 : 36;
      element.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:${getCategoryColor(category ?? '')};border:3px solid ${selected ? '#70e2d1' : 'white'};box-shadow:0 3px 10px #0837463d`;
      element.innerHTML = getCategoryIconSvg(category ?? '');
      const marker = new google.maps.marker.AdvancedMarkerElement({ map, position: { lat: latitude, lng: longitude }, title, content: element, gmpClickable: true, zIndex: selected ? 10 : 1 });
      markers.push(marker);
      if (content) {
        const node = document.createElement('div');
        // React escapes all place names and addresses before generating HTML.
        node.innerHTML = renderToString(<div>{content}</div>);
        if (onClick) {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'mt-3 rounded-xl bg-blue-700 px-3 py-2 text-xs font-bold text-white';
          button.textContent = 'Consultar local';
          button.onclick = onClick;
          node.append(button);
        }
        if (onRoute) {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'mt-2 block w-full rounded-xl bg-blue-700 px-3 py-2 text-xs font-bold text-white';
          button.textContent = 'Como chegar';
          button.onclick = onRoute;
          node.append(button);
        }
        const open = () => { popup.setContent(node); popup.open({ map, anchor: marker }); };
        listeners.push(marker.addListener('click', () => { open(); onClick?.(); }));
        if (selected) open();
      }
    }
    establishments.forEach(est => {
      const supported = [...new Set(est.criteria?.filter(c => c.presente).map(c => c.tipo_deficiencia) ?? [])];
      addMarker(est.latitude, est.longitude, est.nome, est.categoria, selectedEstablishment?.id === est.id,
        <div className="max-w-[260px] p-1 text-slate-800">
          <VerifiedBadge status={est.status} />
          <h3 className="my-2 text-sm font-bold">{est.nome}</h3>
          <p className="mb-2 text-xs">{est.endereco} - {est.bairro || est.cidade}</p>
          <AccessibilitySummary establishment={est} />
          <div className="mb-3 flex gap-1">{supported.slice(0, 4).map(type => <DisabilityBadge key={type} type={type} size="sm" showLabel={false} />)}</div>
        </div>, selectRef.current ? () => selectRef.current?.(est) : undefined);
    });
    const visiblePlaces = selectedPlace && !nearbyPlaces.some(place => place.id === selectedPlace.id) ? [...nearbyPlaces, selectedPlace] : nearbyPlaces;
    visiblePlaces.forEach(place => addMarker(place.latitude, place.longitude, place.nome, place.categoria, selectedPlace?.id === place.id,
      <div className="max-w-[240px] text-slate-800"><h3 className="font-bold">{place.nome}</h3><p>{place.endereco}</p><p className="mt-2 text-xs">Selecione o local para consultar os recursos de acessibilidade cadastrados.</p><p className="mt-2 text-xs">{place.fonte === 'google' ? 'Google Maps' : 'OpenStreetMap'}</p></div>, () => selectPlaceRef.current?.(place), () => routeRef.current?.(place)));
    if (searchedAddress) addMarker(searchedAddress.latitude, searchedAddress.longitude, searchedAddress.label, undefined, false, <p>{searchedAddress.label}</p>);
    if (interactivePointSelection) addMarker(centerLat, centerLng, 'Localização selecionada', undefined, true);
    if (userLocation) {
      addMarker(userLocation.latitude, userLocation.longitude, 'Você está aqui', undefined, false, <p>Você está aqui</p>);
      overlays.push(new google.maps.Circle({ map, center: { lat: userLocation.latitude, lng: userLocation.longitude }, radius: userLocation.accuracy, strokeColor: '#087b72', strokeWeight: 1, fillColor: '#70e2d1', fillOpacity: 0.13, clickable: false }));
    }
    if (activeRoute?.coordenadas.length) {
      const path = activeRoute.coordenadas.map(([lat, lng]) => ({ lat, lng }));
      overlays.push(new google.maps.Polyline({ map, path, strokeColor: '#0b9b8c', strokeWeight: 6, strokeOpacity: activeRoute.auditada === false ? 0 : 0.9, clickable: false,
        icons: activeRoute.auditada === false ? [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 0.9, strokeColor: '#0b9b8c', scale: 3 }, offset: '0', repeat: '16px' }] : undefined,
      }));
      addMarker(path[0].lat, path[0].lng, 'Início da rota');
    }
    return () => {
      popup.close();
      listeners.forEach(listener => listener.remove());
      markers.forEach(marker => { marker.map = null; });
      overlays.forEach(overlay => overlay.setMap(null));
    };
  }, [map, establishments, selectedEstablishment, selectedPlace, nearbyPlaces, searchedAddress, userLocation, activeRoute, interactivePointSelection, centerLat, centerLng]);

  return <div className={`relative w-full ${heightClass} overflow-hidden rounded-3xl border border-slate-200 shadow-inner`}>
    <div ref={container} className="h-full w-full" aria-label="Mapa de estabelecimentos" />
    {!map && <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-50 p-6 text-center text-slate-700" role="status">
      <p>{!hasApiKey ? 'O mapa está aguardando configuração pelo responsável pelo site.' : error || 'Carregando Google Maps…'}</p>
      {error && hasApiKey && <button type="button" className="rounded-xl bg-blue-700 px-4 py-2 text-white" onClick={() => setAttempt(value => value + 1)}>Tentar novamente</button>}
    </div>}
  </div>;
};
