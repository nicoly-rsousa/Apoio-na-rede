import { useVisibleSearch } from '../hooks/useVisibleSearch';
import { categoryForActivity } from '../data/categoryDiscovery';
import { CatalogSkeleton } from '../components/explore/CatalogSkeleton';
import { PlaceCatalog, type CatalogEntry } from '../components/explore/PlaceCatalog';
import { isPlacesQuotaError } from '../utils/placesError';
import { externalDiscoveryPlaces } from '../utils/discoveryPlaces';
import { normalizeSearchText } from '../utils/normalizeSearchText';
import { browserStorage } from '../lib/browserStorage';
import { ExplorerHero } from '../components/explore/ExplorerHero';
import { ExploreCategories } from '../components/explore/ExploreCategories';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Establishment, FilterState, DisabilityType, EstablishmentCategory, NearbyPlace } from '../types';
import { MAP_CATEGORIES } from '../data/mapCategories';
import { PlacesService } from '../services/placesService';
import { StorageService } from '../services/storageService';
import { useAccessibility } from '../context/AccessibilityContext';
import { DisabilityBadge } from '../components/accessibility/DisabilityBadge';
import { VoiceSearchButton } from '../components/accessibility/VoiceSearchButton';
import {
  Search,
  MapPin,
  SlidersHorizontal,
  RotateCcw,
  AlertCircle,
  LoaderCircle,
  Utensils,
  Stethoscope,
  Landmark,
  ShoppingBag,
  Building2,
  Bath,
  GraduationCap,
  Bus,
  Hotel,
} from 'lucide-react';

interface ExplorerViewProps {
  onSelectEstablishment: (establishment: Establishment) => void;
}

interface AddressSuggestion {
  externalPlace?: NearbyPlace;
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  kind?: 'address' | 'place';
  latitude?: number;
  longitude?: number;
  category?: EstablishmentCategory;
  typeLabel?: string;
}

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface PhotonFeature {
  properties?: Record<string, string | undefined>;
  geometry?: { coordinates?: number[] };
}

const CATEGORIES: { id: EstablishmentCategory | 'todas'; label: string }[] = [
  { id: 'todas', label: 'Todas as Categorias' },
  { id: 'alimentacao', label: 'Alimentação' },
  { id: 'saude', label: 'Saúde & Clínicas' },
  { id: 'lazer_cultura', label: 'Lazer & Cultura' },
  { id: 'comercio_loja', label: 'Comércio & Lojas' },
  { id: 'servico_publico', label: 'Serviço Público' },
  { id: 'banheiro_adaptado', label: 'Banheiro Adaptado' },
  { id: 'educacao', label: 'Educação' },
  { id: 'hospedagem', label: 'Hospedagem' },
  { id: 'transporte_mobilidade', label: 'Transporte' },
];

const CATAGUASES_CENTER: [number, number] = [-21.3924, -42.6896];
const ADDRESS_INDEX_CACHE_KEY = 'apoio_cataguases_urban_index_v4';


const categoryIcons: Record<EstablishmentCategory, React.ElementType> = {
  alimentacao: Utensils,
  saude: Stethoscope,
  lazer_cultura: Landmark,
  comercio_loja: ShoppingBag,
  servico_publico: Building2,
  banheiro_adaptado: Bath,
  educacao: GraduationCap,
  transporte_mobilidade: Bus,
  hospedagem: Hotel,
};

const inferCategory = (tags: Record<string, string>): EstablishmentCategory | undefined => {
  if (tags.amenity === 'toilets' && ['private', 'no', 'customers', 'permit'].includes(tags.access)) return undefined;
  if (tags.shop === 'chemist') return 'saude';
  if (['bakery', 'confectionery', 'pastry'].includes(tags.shop)) return 'alimentacao';
  if (tags.shop) return 'comercio_loja';
  if (tags.tourism === 'hotel' || tags.tourism === 'hostel' || tags.tourism === 'guest_house') return 'hospedagem';
  if (tags.amenity === 'toilets') return 'banheiro_adaptado';
  if (['hospital', 'clinic', 'doctors', 'dentist', 'pharmacy'].includes(tags.amenity)) return 'saude';
  if (['restaurant', 'cafe', 'fast_food', 'bar', 'food_court'].includes(tags.amenity)) return 'alimentacao';
  if (['school', 'college', 'university', 'kindergarten', 'library'].includes(tags.amenity)) return 'educacao';
  if (tags.public_transport || tags.highway === 'bus_stop' || ['bus_station', 'taxi', 'ferry_terminal'].includes(tags.amenity)) return 'transporte_mobilidade';
  if (tags.leisure || tags.tourism) return 'lazer_cultura';
  if (['townhall', 'post_office', 'police', 'courthouse', 'fire_station'].includes(tags.amenity)) return 'servico_publico';
  return categoryForActivity(tags.name ?? '') ?? undefined;
};

const distanceInMeters = (a: [number, number], b: [number, number]) => {
  const toRad = (value: number) => value * Math.PI / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

export const ExplorerView: React.FC<ExplorerViewProps> = () => {
  const searchInputRef = useVisibleSearch();
  const { accessibilityPreferences } = useAccessibility();
  const [showFilters, setShowFilters] = useState(false);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const routeRequestRef = useRef(0);
  const localRequestRef = useRef(0);
  const [showAllResults, setShowAllResults] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [cityAddressIndex, setCityAddressIndex] = useState<AddressSuggestion[]>([]);
  const [isLoadingAddressIndex, setIsLoadingAddressIndex] = useState(true);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [addressMessage, setAddressMessage] = useState('');
  const [searchedAddress, setSearchedAddress] = useState<{ latitude: number; longitude: number; label: string } | null>(null);
  const skipAddressLookupRef = useRef(false);
  const addressSelectionRef = useRef(0);
  const [selectedAddressLabel, setSelectedAddressLabel] = useState('');
  const [addressFilter, setAddressFilter] = useState<string | null>(null);
  const [placesSearchCenter, setPlacesSearchCenter] = useState<[number, number]>(CATAGUASES_CENTER);
  const [locationNotice, setLocationNotice] = useState('Permita sua localização para ordenar os locais próximos. Sem ela, usamos o centro de Cataguases.');
  const hasLocation = useRef(false);
  const [selectedPlace, setSelectedPlace] = useState<NearbyPlace | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [searchedPlaces, setSearchedPlaces] = useState<NearbyPlace[]>([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [placesError, setPlacesError] = useState(false);
  const [placesQuotaExceeded, setPlacesQuotaExceeded] = useState(false);
  const [placesAttempt, setPlacesAttempt] = useState(0);

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<EstablishmentCategory | 'todas'>('todas');
  const [selectedCity, setSelectedCity] = useState<string>('Cataguases');
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [selectedDisabilities, setSelectedDisabilities] = useState<DisabilityType[]>(accessibilityPreferences);
  const [includeUnknownPlaces, setIncludeUnknownPlaces] = useState(true);
  const visibleNearbyPlaces = useMemo(() => {
    const googlePlaces = searchQuery.trim().length >= 3 ? searchedPlaces : nearbyPlaces;
    const query = normalizeSearchText(searchQuery);
    const osmPlaces = cityAddressIndex.flatMap(address => address.externalPlace?.fonte === 'osm' ? [address.externalPlace] : [])
      .filter(place => !query || normalizeSearchText(`${place.nome} ${place.endereco}`).includes(query))
      .filter(place => !googlePlaces.some(other => normalizeSearchText(other.nome) === normalizeSearchText(place.nome)
        && distanceInMeters([place.latitude, place.longitude], [other.latitude, other.longitude]) < 100));
    return externalDiscoveryPlaces([...googlePlaces, ...osmPlaces], establishments, selectedCategory, onlyVerified, includeUnknownPlaces);
  }, [searchQuery, searchedPlaces, nearbyPlaces, cityAddressIndex, establishments, selectedCategory, onlyVerified, includeUnknownPlaces]);
  const catalogEntries = useMemo<CatalogEntry[]>(() => {
    if (selectedAddressLabel) return searchedAddress ? [{ addressLabel: selectedAddressLabel, place: { id: 'selected-address', nome: selectedAddressLabel, endereco: selectedAddressLabel, categoria: 'servico_publico', ...searchedAddress } }] : [];
    if (selectedPlace) return [{ place: selectedPlace, establishment: establishments.find(est => est.place_id && est.place_id === selectedPlace.place_id) }];
    return [...establishments.filter(establishment => selectedCategory === 'todas' || establishment.categoria === selectedCategory).map(establishment => ({ establishment })), ...visibleNearbyPlaces.map(place => ({ place }))];
  }, [selectedAddressLabel, searchedAddress, selectedPlace, establishments, visibleNearbyPlaces, selectedCategory]);
  useEffect(() => { setShowAllResults(false); }, [searchQuery, selectedCategory, onlyVerified, includeUnknownPlaces, selectedDisabilities]);
  const chooseCategory = (category: EstablishmentCategory | 'todas') => {
    setShowAllResults(false);
    setSelectedPlace(null);
    addressSelectionRef.current++;
    setSelectedAddressLabel(''); setAddressFilter(null);
    skipAddressLookupRef.current = false;
    setSearchQuery(''); setSearchedPlaces([]); setAddressSuggestions([]); setSearchedAddress(null);
    setAddressMessage(''); setSelectedCategory(category);
  };

  useEffect(() => {
    routeRequestRef.current++;
    setSelectedPlace(null);
    
    
    
    
  }, [selectedCategory, onlyVerified, selectedDisabilities, includeUnknownPlaces]);

  // Reaplica as preferências persistidas neste navegador.
  useEffect(() => {
    setSelectedDisabilities(accessibilityPreferences);
  }, [accessibilityPreferences]);



  const loadData = useCallback(async () => {
    const requestId = ++localRequestRef.current;
    setIsLoading(true);
    setLoadError(false);
    try {
      const filters: Partial<FilterState> = {
        searchQuery: addressFilter ?? searchQuery,
        category: selectedCategory,
        city: selectedCity,
        onlyVerified,
        selectedDisabilities,
      };
      const list = await StorageService.getEstablishments(filters);
      if (requestId !== localRequestRef.current) return;
      setEstablishments(list);
    } catch (err) {
      console.error(err);
      if (requestId === localRequestRef.current) setLoadError(true);
    } finally {
      if (requestId === localRequestRef.current) setIsLoading(false);
    }
  }, [searchQuery, addressFilter, selectedCategory, selectedCity, onlyVerified, selectedDisabilities]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!navigator.geolocation) {
      
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const nextLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        
        const insideCataguases = nextLocation.latitude >= -21.55 && nextLocation.latitude <= -21.20
          && nextLocation.longitude >= -42.90 && nextLocation.longitude <= -42.50;
        
        if (insideCataguases) {
          setLocationNotice('Sugestões ordenadas pela proximidade da sua localização.');
          const firstLocation = !hasLocation.current;
          setPlacesSearchCenter((previous) => firstLocation || distanceInMeters(previous, [nextLocation.latitude, nextLocation.longitude]) > 350
            ? [nextLocation.latitude, nextLocation.longitude]
            : previous);
          hasLocation.current = true;
        } else {
          setLocationNotice('Você está fora da área atendida. As sugestões usam o centro de Cataguases.');
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const loadNearbyPlaces = async () => {
      setIsLoadingPlaces(true);
      setPlacesError(false);
      
      try {
        const places = await PlacesService.nearby(placesSearchCenter, selectedCategory);
        if (controller.signal.aborted) return;
        setNearbyPlaces(places.slice(0, 500));
        setPlacesQuotaExceeded(false);
        
      } catch (error) {
        if (!controller.signal.aborted && (error as Error).name !== 'AbortError') {
          setPlacesError(true);
          setPlacesQuotaExceeded(isPlacesQuotaError(error));
          
        }
      } finally {
        if (!controller.signal.aborted) setIsLoadingPlaces(false);
      }
    };
    void loadNearbyPlaces();
    return () => controller.abort();
  }, [placesSearchCenter, selectedCategory, placesAttempt]);

  useEffect(() => {
    const cached = browserStorage.getItem(ADDRESS_INDEX_CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as { savedAt: number; addresses: AddressSuggestion[] };
        if (Date.now() - parsed.savedAt < 7 * 24 * 60 * 60 * 1000 && parsed.addresses.length) {
          setCityAddressIndex(parsed.addresses);
          setIsLoadingAddressIndex(false);
          return;
        }
      } catch {
        browserStorage.removeItem(ADDRESS_INDEX_CACHE_KEY);
      }
    }

    const controller = new AbortController();
    const loadAddressIndex = async () => {
      setIsLoadingAddressIndex(true);
      const query = '[out:json][timeout:60];area["boundary"="administrative"]["name"="Cataguases"]->.city;(way(area.city)["highway"]["name"];nwr(area.city)["addr:street"];nwr(area.city)["amenity"]["name"];nwr(area.city)["amenity"="toilets"];nwr(area.city)["highway"="bus_stop"];nwr(area.city)["public_transport"="platform"];nwr(area.city)["shop"]["name"];nwr(area.city)["tourism"]["name"];nwr(area.city)["leisure"]["name"];nwr(area.city)["office"]["name"];nwr(area.city)["craft"]["name"];nwr(area.city)["historic"]["name"];nwr(area.city)["natural"]["name"];nwr(area.city)["public_transport"]["name"];nwr(area.city)["place"~"suburb|neighbourhood|square"]["name"];nwr(area.city)["building"]["name"];);out center tags;';
      const endpoints = [
        'https://overpass-api.de/api/interpreter',
        'https://overpass.kumi.systems/api/interpreter',
        'https://overpass.nchc.org.tw/api/interpreter',
      ];
      try {
        let payload: { elements?: OverpassElement[] } | null = null;
        for (const endpoint of endpoints) {
          try {
            const response = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
              body: `data=${encodeURIComponent(query)}`,
              signal: controller.signal,
            });
            if (response.ok) {
              payload = await response.json();
              break;
            }
          } catch (error) {
            if ((error as Error).name === 'AbortError') throw error;
          }
        }
        if (!payload) throw new Error('Índice indisponível');

        const addresses = (payload.elements || []).flatMap((element) => {
          const tags = element.tags || {};
          const category = inferCategory(tags);
          const isPlace = Boolean(category);
          const isAddress = !isPlace;
          const title = isPlace ? tags.name || (tags.amenity === 'toilets' ? 'Banheiro público' : tags.highway === 'bus_stop' || tags.public_transport ? 'Ponto de transporte' : tags['addr:street']) : tags['addr:street'] || tags.name;
          if (!title) return [];
          const latitude = Number(element.lat ?? element.center?.lat);
          const longitude = Number(element.lon ?? element.center?.lon);
          const typeLabel = tags.shop ? 'Loja ou comércio'
            : tags.amenity ? 'Serviço ou equipamento urbano'
            : tags.tourism ? 'Turismo'
            : tags.leisure ? 'Lazer e espaço público'
            : tags.office ? 'Empresa ou escritório'
            : tags.public_transport || tags.highway === 'bus_stop' ? 'Transporte'
            : tags.place ? 'Bairro ou localidade'
            : tags.historic ? 'Patrimônio histórico'
            : tags.natural ? 'Área natural'
            : tags.building ? 'Edifício'
            : 'Logradouro';
          return [{
            externalPlace: isPlace && category && Number.isFinite(latitude) && Number.isFinite(longitude) ? {
              id: `osm-${element.type}-${element.id}`, fonte: 'osm', nome: title, categoria: category, latitude, longitude,
              endereco: [tags['addr:street'], tags['addr:housenumber'], tags['addr:suburb'], 'Cataguases - MG'].filter(Boolean).join(', '),
            } satisfies NearbyPlace : undefined,
            cep: tags['addr:postcode'] || '',
            logradouro: title,
            complemento: tags['addr:housenumber'] || '',
            bairro: tags['addr:suburb'] || tags['addr:neighbourhood'] || '',
            localidade: 'Cataguases',
            uf: 'MG',
            kind: isAddress ? 'address' : 'place',
            latitude: Number.isFinite(latitude) ? latitude : undefined,
            longitude: Number.isFinite(longitude) ? longitude : undefined,
            category,
            typeLabel,
          } satisfies AddressSuggestion];
        });
        const unique = addresses.filter((address, index, items) => {
          if (address.externalPlace) return items.findIndex(candidate => candidate.externalPlace?.id === address.externalPlace?.id) === index;
          const key = `${address.kind}|${address.logradouro}|${address.complemento}|${address.bairro}|${address.cep}`.toLowerCase();
          return items.findIndex((candidate) => `${candidate.kind}|${candidate.logradouro}|${candidate.complemento}|${candidate.bairro}|${candidate.cep}`.toLowerCase() === key) === index;
        }).sort((a, b) => a.logradouro.localeCompare(b.logradouro, 'pt-BR'));
        setCityAddressIndex(unique);
        browserStorage.setItem(ADDRESS_INDEX_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), addresses: unique }));
      } catch (error) {
        if ((error as Error).name !== 'AbortError') setAddressMessage('O índice urbano completo está temporariamente indisponível; a busca por endereços continua ativa.');
      } finally {
        if (!controller.signal.aborted) setIsLoadingAddressIndex(false);
      }
    };
    void loadAddressIndex();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (skipAddressLookupRef.current) {
      return;
    }

    const normalizedQuery = normalizeSearchText(searchQuery);
    setIsSearchingAddress(false);
    if (!normalizedQuery) {
      setAddressSuggestions([]);
      setAddressMessage('');
      return;
    }

    const localMatches = cityAddressIndex
      .filter((address) => normalizeSearchText(`${address.logradouro} ${address.complemento} ${address.bairro} ${address.cep} ${address.typeLabel || ''} ${address.localidade}`).includes(normalizedQuery))
      .sort((a, b) => {
        const aStarts = normalizeSearchText(a.logradouro).startsWith(normalizedQuery) ? 0 : 1;
        const bStarts = normalizeSearchText(b.logradouro).startsWith(normalizedQuery) ? 0 : 1;
        return aStarts - bStarts || a.logradouro.localeCompare(b.logradouro, 'pt-BR');
      });
    setAddressSuggestions(localMatches);
    setActiveSuggestion(-1);
    setAddressMessage(localMatches.length ? `${localMatches.length} locais correspondem ao texto digitado.` : 'Buscando em outras fontes…');

    const cepQuery = searchQuery.replace(/\D/g, '');
    const isCepQuery = cepQuery.length === 8;
    const streetQuery = searchQuery.replace(/\d+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!isCepQuery && normalizedQuery.length < 2) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsSearchingAddress(true);
      try {
        const searchSignal = AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]);
        const viaCepRequest = isCepQuery || streetQuery.length >= 3
          ? fetch(isCepQuery
            ? `https://viacep.com.br/ws/${cepQuery}/json/`
            : `https://viacep.com.br/ws/MG/Cataguases/${encodeURIComponent(streetQuery)}/json/`, { signal: searchSignal })
          : Promise.resolve(null);
        const photonRequest = fetch(`https://photon.komoot.io/api/?limit=50&lat=${CATAGUASES_CENTER[0]}&lon=${CATAGUASES_CENTER[1]}&q=${encodeURIComponent(`${searchQuery}, Cataguases, Minas Gerais`)}`, { signal: searchSignal });
        const [viaCepResult, photonResult, googleResult] = await Promise.allSettled([viaCepRequest, photonRequest, PlacesService.search(searchQuery)]);
        if (controller.signal.aborted) return;
        setSearchedPlaces(googleResult.status === 'fulfilled' ? googleResult.value : []);
        const googleSuggestions: AddressSuggestion[] = googleResult.status === 'fulfilled' ? googleResult.value.map(place => ({
          cep: '', logradouro: place.nome, complemento: '', bairro: place.endereco, localidade: 'Cataguases', uf: 'MG', kind: 'place',
          latitude: place.latitude, longitude: place.longitude, category: place.categoria, typeLabel: MAP_CATEGORIES[place.categoria].label, externalPlace: place,
        })) : [];

        let viaCepSuggestions: AddressSuggestion[] = [];
        if (viaCepResult.status === 'fulfilled' && viaCepResult.value?.ok) {
          const rawData: AddressSuggestion[] | AddressSuggestion = await viaCepResult.value.json();
          viaCepSuggestions = (Array.isArray(rawData) ? rawData : [rawData]).filter(
            (item) => item.localidade?.toLowerCase() === 'cataguases' && item.uf === 'MG'
          ).map((item) => ({ ...item, kind: 'address' as const, typeLabel: 'Endereço' }));
        }

        let photonSuggestions: AddressSuggestion[] = [];
        if (photonResult.status === 'fulfilled' && photonResult.value.ok) {
          const photonData = await photonResult.value.json();
          photonSuggestions = ((photonData.features || []) as PhotonFeature[]).flatMap((feature) => {
            const properties = feature.properties || {};
            const coordinates = feature.geometry?.coordinates || [];
            const longitude = Number(coordinates[0]);
            const latitude = Number(coordinates[1]);
            const cityText = `${properties.city || ''} ${properties.county || ''}`.toLowerCase();
            const insideCity = latitude >= -21.47 && latitude <= -21.31 && longitude >= -42.78 && longitude <= -42.61;
            if (!properties.name || !Number.isFinite(latitude) || !Number.isFinite(longitude) || (!cityText.includes('cataguases') && !insideCity)) return [];
            const tags = properties.osm_key ? { [properties.osm_key]: properties.osm_value || 'yes' } : {};
            const category = inferCategory(tags);
            return [{
              cep: properties.postcode || '',
              logradouro: properties.name,
              complemento: properties.housenumber || '',
              bairro: properties.district || properties.locality || properties.street || '',
              localidade: 'Cataguases',
              uf: 'MG',
              kind: 'place' as const,
              latitude,
              longitude,
              category,
              typeLabel: CATEGORIES.find((item) => item.id === category)?.label || 'Local',
            }];
          });
        }

        const combined = [...googleSuggestions, ...photonSuggestions, ...localMatches, ...viaCepSuggestions].filter((item, index, items) => {
          if (!item.logradouro) return false;
          const identity = (entry: AddressSuggestion) => entry.externalPlace?.id ?? `${entry.logradouro}|${entry.complemento}|${entry.bairro}`.toLowerCase();
          return items.findIndex(candidate => identity(candidate) === identity(item)) === index;
        });
        if (controller.signal.aborted || skipAddressLookupRef.current) return;
        setAddressSuggestions(combined);
        setActiveSuggestion(-1);
        setAddressMessage(combined.length ? `${combined.length} locais correspondem ao texto digitado.` : 'Nenhum endereço ou local encontrado em Cataguases.');
      } catch {
        if (!controller.signal.aborted && !skipAddressLookupRef.current) setAddressMessage('Não foi possível consultar os locais agora.');
      } finally {
        if (!controller.signal.aborted) setIsSearchingAddress(false);
      }
    }, 500);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [cityAddressIndex, searchQuery]);

  const toggleDisabilityFilter = (type: DisabilityType) => {
    setSelectedDisabilities((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleResetFilters = () => {
    addressSelectionRef.current++;
    skipAddressLookupRef.current = false;
    setSelectedAddressLabel(''); setAddressFilter(null); setSearchedPlaces([]);
    routeRequestRef.current++;
    setSelectedPlace(null);
    
    
    
    
    setSearchQuery('');
    setSelectedCategory('todas');
    setSelectedCity('Cataguases');
    setOnlyVerified(false);
    setSelectedDisabilities([]);
    setAddressSuggestions([]);
    setSearchedAddress(null);
    setAddressMessage('');
  };

  const disabilityKeys: DisabilityType[] = ['mobilidade', 'visual', 'auditiva', 'intelectual', 'invisivel'];
  const selectPlace = (place: NearbyPlace) => {
    routeRequestRef.current++;
    setSelectedPlace(place);
    
    setSearchedAddress(null);
    
    
    
  };


  const selectAddress = async (suggestion: AddressSuggestion) => {
    const selectionId = ++addressSelectionRef.current;
    routeRequestRef.current++;
    setSearchedAddress(null);
    setSelectedAddressLabel('');
    setIsSearchingAddress(false);
    setActiveSuggestion(-1);
    setSelectedPlace(null);
    if (suggestion.externalPlace) {
      skipAddressLookupRef.current = true;
      setSearchQuery(suggestion.externalPlace.nome);
      setAddressFilter(suggestion.externalPlace.nome);
      setSearchedPlaces([suggestion.externalPlace]);
      setAddressMessage('Local selecionado. Consulte a acessibilidade abaixo.');
      setAddressSuggestions([]);
      selectPlace(suggestion.externalPlace);
      return;
    }
    const typedNumber = suggestion.complemento;
    const displayAddress = `${suggestion.logradouro}${typedNumber ? `, ${typedNumber}` : ''} — ${suggestion.bairro || 'Cataguases'}, Cataguases - MG`;
    skipAddressLookupRef.current = true;
    setSearchQuery(displayAddress);
    setSelectedAddressLabel(displayAddress);
    setAddressFilter(suggestion.logradouro);
    setSearchedPlaces([]);
    setAddressSuggestions([]);
    
    
    
    setAddressMessage('Localizando o endereço…');

    try {
      if (Number.isFinite(suggestion.latitude) && Number.isFinite(suggestion.longitude)) {
        setSearchedAddress({ latitude: suggestion.latitude!, longitude: suggestion.longitude!, label: displayAddress });
        setAddressMessage(`Endereço selecionado: ${displayAddress}`);
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      const query = `${suggestion.logradouro}${typedNumber ? `, ${typedNumber}` : ''}, ${suggestion.bairro}, Cataguases, Minas Gerais, Brasil`;
      const nominatimResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&q=${encodeURIComponent(query)}`);
      const nominatimData = nominatimResponse.ok ? await nominatimResponse.json() : [];
      let latitude = Number(nominatimData[0]?.lat);
      let longitude = Number(nominatimData[0]?.lon);
      const isInsideCataguases = (lat: number, lng: number) => lat >= -21.55 && lat <= -21.20 && lng >= -42.90 && lng <= -42.50;

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !isInsideCataguases(latitude, longitude)) {
        const photonResponse = await fetch(`https://photon.komoot.io/api/?limit=1&lat=-21.3924&lon=-42.6896&q=${encodeURIComponent(query)}`);
        const photonData = photonResponse.ok ? await photonResponse.json() : null;
        const coordinates = photonData?.features?.[0]?.geometry?.coordinates;
        longitude = Number(coordinates?.[0]);
        latitude = Number(coordinates?.[1]);
      }

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !isInsideCataguases(latitude, longitude)) throw new Error('Coordenadas não encontradas');
      if (selectionId !== addressSelectionRef.current) return;
      setSearchedAddress({ latitude, longitude, label: displayAddress });
      setAddressMessage(`Endereço selecionado: ${displayAddress}`);
      document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch {
      if (selectionId !== addressSelectionRef.current) return;
      setAddressMessage('O logradouro existe em Cataguases, mas não foi possível posicioná-lo com precisão no mapa. Confira o CEP e o número.');
    }
  };

  const handleAddressKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!addressSuggestions.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveSuggestion((index) => Math.min(index + 1, addressSuggestions.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveSuggestion((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter' && activeSuggestion >= 0) {
      event.preventDefault();
      void selectAddress(addressSuggestions[activeSuggestion]);
    } else if (event.key === 'Escape') {
      setAddressSuggestions([]);
    }
  };

  return (
    <div className="explorer-shell max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 text-slate-800">
      <ExplorerHero />



      {/* Seção de Busca e Filtros */}
      <section
        id="search-filter-section"
        aria-label="Filtros e Busca de Estabelecimentos"
        className="explorer-search premium-surface rounded-2xl p-5 sm:p-7 mb-7 space-y-6"
      >
        {/* Barra de Busca + Reconhecimento de Voz */}
        <div className="search-controls flex gap-3">
          <div className="relative flex-1">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="text"
              id="main-search-input"
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => { addressSelectionRef.current++; skipAddressLookupRef.current = false; setSelectedAddressLabel(''); setAddressFilter(null); routeRequestRef.current++; setSearchQuery(e.target.value); setSearchedAddress(null); setSelectedPlace(null); setSearchedPlaces([]); }}
              onKeyDown={handleAddressKeyDown}
              placeholder="Busque ruas, lojas, empresas, praças, serviços ou CEPs"
              role="combobox"
              aria-label="Buscar endereços, empresas, comércio, serviços e espaços públicos em Cataguases"
              aria-autocomplete="list"
              aria-expanded={addressSuggestions.length > 0}
              aria-controls="address-suggestions"
              aria-activedescendant={activeSuggestion >= 0 ? `address-option-${activeSuggestion}` : undefined}
              autoComplete="off"
              className="w-full pl-11 pr-11 py-4 bg-white border border-blue-950/15 rounded-xl text-sm font-medium shadow-inner focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
            />
            {(isSearchingAddress || isLoadingAddressIndex) && <LoaderCircle size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-700 animate-spin" aria-hidden="true" />}
            {addressSuggestions.length > 0 && (
              <ul id="address-suggestions" role="listbox" aria-label="Locais sugeridos em Cataguases" className="absolute left-0 right-0 top-full z-30 mt-2 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                {addressSuggestions.map((suggestion, index) => {
                  const SuggestionIcon = suggestion.kind === 'place' && suggestion.category
                    ? categoryIcons[suggestion.category]
                    : MapPin;
                  return (
                    <li key={`${suggestion.kind}-${suggestion.logradouro}-${suggestion.complemento}-${suggestion.bairro}-${suggestion.cep}`} id={`address-option-${index}`} role="option" aria-selected={activeSuggestion === index}>
                      <button type="button" onMouseEnter={() => setActiveSuggestion(index)} onClick={() => void selectAddress(suggestion)} className={`w-full flex items-start gap-3 rounded-lg px-3 py-2.5 text-left ${activeSuggestion === index ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700"><SuggestionIcon size={16} aria-hidden="true" /></span>
                        <span className="min-w-0">
                          <strong className="block text-sm text-slate-900">{suggestion.logradouro}{suggestion.complemento ? `, ${suggestion.complemento}` : ''}</strong>
                          <span className="block text-xs text-slate-500">{suggestion.typeLabel || 'Endereço'} · {suggestion.bairro || 'Cataguases'}{suggestion.cep ? ` · CEP ${suggestion.cep}` : ''}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <button type="button" className="search-filter-toggle" aria-label="Mostrar filtros" aria-expanded={showFilters} aria-controls="advanced-search-filters" onClick={() => setShowFilters(value => !value)}><SlidersHorizontal size={22} aria-hidden="true" /></button>
          <VoiceSearchButton
            onTranscript={(text) => { addressSelectionRef.current++; skipAddressLookupRef.current = false; setSelectedAddressLabel(''); setAddressFilter(null); setSearchedAddress(null); setSelectedPlace(null); setSearchedPlaces([]); setSearchQuery(text); }}
            className="voice-search-control py-4 px-5"
          />
        </div>
        <p role="status" aria-live="polite" className="text-xs text-slate-500">
          {addressMessage || 'A busca inclui endereços, empresas, comércio, serviços e espaços públicos de Cataguases.'}
        </p>
        <p className="text-[11px] text-slate-400">Locais: Google Maps. Endereços: ViaCEP e OpenStreetMap.</p>

        <div id="advanced-search-filters" hidden={!showFilters} className="advanced-search-filters space-y-5">
        {/* Chips de Filtros Multi-Seleção por Deficiência */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <SlidersHorizontal size={14} className="text-blue-700" aria-hidden="true" />
              Recursos importantes para você
            </span>
            {selectedDisabilities.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedDisabilities([])}
                className="text-xs font-bold text-blue-700 hover:underline"
              >
                Limpar necessidades
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {disabilityKeys.map((type) => {
              const isSelected = selectedDisabilities.includes(type);
              return (
                <DisabilityBadge
                  key={type}
                  type={type}
                  size="md"
                  active={isSelected}
                  onClick={() => toggleDisabilityFilter(type)}
                />
              );
            })}
          </div>
        </div>

        {/* Filtros Secundários: Categoria, Cidade, Verificados */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label htmlFor="category-select" className="block text-xs font-bold text-slate-600 uppercase mb-1">
              Categoria
            </label>
            <select
              id="category-select"
              value={selectedCategory}
              onChange={(e) => chooseCategory(e.target.value as EstablishmentCategory | 'todas')}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-600"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="city-select" className="block text-xs font-bold text-slate-600 uppercase mb-1">
              Cidade
            </label>
            <select
              id="city-select"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-600"
            >
              <option value="Cataguases">Cataguases (MG)</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2.5 p-2.5 w-full bg-slate-50 border border-slate-300 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={onlyVerified}
                onChange={(e) => setOnlyVerified(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded-md focus:ring-blue-500"
              />
              <span className="text-xs font-bold text-slate-800">
                Somente locais verificados
              </span>
            </label>
          </div>
        </div>
        </div>
      </section>
      <ExploreCategories selected={selectedCategory} onSelect={chooseCategory} />
      <label className="mb-4 flex items-start gap-2 text-sm">
        <input type="checkbox" checked={includeUnknownPlaces} disabled={onlyVerified} onChange={event => setIncludeUnknownPlaces(event.target.checked)} />
        <span>Incluir lugares sem informações de acessibilidade. Seus recursos precisam ser consultados; a exibição não confirma que atendem às suas preferências.</span>
      </label>



      {/* Resultados do cat?logo */}
      <div id="results-section" tabIndex={-1} className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div role="status" aria-live="polite" className="text-sm font-bold text-slate-700">
          {isLoading ? (
            <span>Carregando estabelecimentos...</span>
          ) : (
            <span>
              {searchQuery.trim() ? 'Resultados da busca' : showAllResults ? 'Todos os locais encontrados' : 'Até 5 sugestões próximas'}
              {selectedCategory !== 'todas' ? ` · ${MAP_CATEGORIES[selectedCategory].label}` : ''}
              {searchQuery ? ` para "${searchQuery}"` : ''}
            </span>
          )}
        </div>

      </div>

      {/* Cartões do catálogo */}
      {!searchQuery.trim() && <p className="mb-4 text-sm" role="status">{locationNotice}</p>}
      {isLoadingPlaces && !isLoading && catalogEntries.length > 0 && !selectedPlace && !selectedAddressLabel && <p role="status" className="mb-4 text-sm">Buscando locais…</p>}
      {placesError && !selectedPlace && !selectedAddressLabel && <p role="status" className="mb-4 text-sm">{placesQuotaExceeded ? 'O limite de consultas do Google foi atingido. As sugestões próximas voltarão quando a cota for renovada. Os cadastros disponíveis no catálogo continuam acessíveis.' : <>Não foi possível carregar locais do Google Maps. <button type="button" className="underline" onClick={() => setPlacesAttempt(value => value + 1)}>Tentar novamente</button></>}</p>}
      {loadError && catalogEntries.length === 0 ? (
        <section role="alert" className="bg-white border border-rose-200 rounded-2xl px-6 py-10 text-center mb-12">
          <AlertCircle size={28} className="mx-auto text-rose-600 mb-3" aria-hidden="true" />
          <h2 className="text-lg font-bold text-slate-900 mb-1">Não foi possível carregar os locais</h2>
          <p className="text-sm text-slate-500 mb-5">Verifique sua conexão e tente novamente.</p>
          <button type="button" onClick={loadData} className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-sm font-bold transition-colors">
            Tentar novamente
          </button>
        </section>
      ) : (isLoading || isLoadingPlaces) && catalogEntries.length === 0 ? (
        <CatalogSkeleton />
      ) : catalogEntries.length === 0 ? (
        <section className="bg-white rounded-2xl px-6 py-12 text-center border border-slate-200 mb-12">
          <Search size={28} className="mx-auto mb-3 text-slate-400" aria-hidden="true" />
          <h2 className="text-lg font-bold text-slate-900 mb-1">Nenhum local encontrado</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-5">Tente um termo mais amplo ou remova alguns filtros para ampliar os resultados.</p>
          <button type="button" onClick={handleResetFilters} className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-sm font-bold transition-colors">
            <RotateCcw size={15} aria-hidden="true" />
            Limpar filtros
          </button>
        </section>
      ) : (
        <>
          <PlaceCatalog entries={catalogEntries} center={placesSearchCenter} limit={showAllResults ? undefined : 5} />
          {(catalogEntries.length > 5 || showAllResults) && <button
            type="button"
            className="premium-button rounded-xl px-5 py-3 mb-12 font-bold"
            onClick={() => {
              setShowAllResults(previous => !previous);
              document.getElementById('results-section')?.scrollIntoView({ block: 'start', behavior: 'instant' });
            }}
          >{showAllResults ? 'Voltar às 5 sugestões' : `Ver todos os ${catalogEntries.length} locais${selectedCategory !== 'todas' ? ` de ${MAP_CATEGORIES[selectedCategory].label}` : ''}`}</button>}
        </>
      )}
    </div>
  );
};
