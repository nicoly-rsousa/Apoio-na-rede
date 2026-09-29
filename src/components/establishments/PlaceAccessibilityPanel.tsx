import { useEffect, useState } from 'react';
import type { NearbyPlace, AccessibleRoute } from '../../types';
import { AccessibilityService, type PlaceAccessibilityResult } from '../../services/accessibilityService';
import { AccessibilitySummary } from '../accessibility/AccessibilitySummary';
import { MAP_CATEGORIES } from '../../data/mapCategories';
import { formatDistance } from '../../utils/formatDistance';

export function PlaceAccessibilityPanel({ place, onRoute, route, routeMessage, busy, compact = false }: {
  compact?: boolean;
  place: NearbyPlace; onRoute: () => void; route: AccessibleRoute | null; routeMessage: string; busy: boolean;
}) {
  const [result, setResult] = useState<PlaceAccessibilityResult | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setResult(null);
    setError(false);
    const request = place.place_id ? AccessibilityService.getByPlaceId(place.place_id)
      : Promise.resolve({ encontrado: false, verificado: false, local: null });
    request.then(value => { if (!cancelled) setResult(value); }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [place.place_id, attempt]);
  const category = MAP_CATEGORIES[place.categoria];
  const Icon = category.icon;
  if (compact) return <div aria-live="polite">{error ? <div role="alert"><p>Não foi possível consultar a acessibilidade.</p><button type="button" className="underline" onClick={() => setAttempt(value => value + 1)}>Tentar novamente</button></div> : !result ? <p role="status">Consultando acessibilidade…</p> : <AccessibilitySummary establishment={result.local} />}</div>;
  return <article className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
    <div className="flex items-center gap-2 text-xs font-bold"><Icon size={20} color={category.color} aria-hidden="true" />{category.label}</div>
    <h2 className="text-lg font-bold text-slate-900">{place.nome}</h2>
    <p className="text-sm text-slate-600">{place.endereco}</p>
    <div aria-live="polite">{error ? <div role="alert" className="text-sm text-rose-800"><p>Não foi possível consultar a acessibilidade. Isso não significa ausência de recursos.</p><button type="button" className="mt-2 underline" onClick={() => setAttempt(value => value + 1)}>Consultar novamente</button></div>
      : !result ? <p role="status">Consultando acessibilidade…</p> : <AccessibilitySummary establishment={result.local} />}</div>
    <button type="button" disabled={busy} onClick={onRoute} className="w-full rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Calculando trajeto…' : 'Como chegar'}</button>
    <p className="text-xs text-slate-500">Abre o Google Maps em uma nova aba para escolher a origem e o trajeto.</p>
    <div aria-live="polite" className="text-xs text-slate-600"><p>{routeMessage}</p>{route && <p className="mt-2 font-bold">{formatDistance(route.distancia_metros)} · aproximadamente {Math.max(1, Math.round((route.duracao_segundos ?? 0) / 60))} min a pé</p>}</div>
    {route && <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">Trajeto de pedestres não auditado. Rampas, inclinações, escadas e obstáculos ainda não foram verificados.</p>}
    <p className="text-xs text-slate-500">Local: {place.fonte === 'google' ? 'Google Maps' : 'OpenStreetMap'}. Acessibilidade: cadastros do Apoio na Rede.</p>
  </article>;
}
