import { Utensils, Stethoscope, Landmark, ShoppingBag, Building2, Bath, GraduationCap, Bus, Hotel } from 'lucide-react';
import type { EstablishmentCategory } from '../types';

export const MAP_CATEGORIES = {
  alimentacao: { label: 'Alimentação', color: '#c2410c', icon: Utensils, types: ['restaurant', 'cafe', 'bakery', 'bar', 'meal_takeaway', 'coffee_shop', 'ice_cream_shop'] },
  saude: { label: 'Saúde & Clínicas', color: '#0369a1', icon: Stethoscope, types: ['hospital', 'pharmacy', 'doctor', 'dentist'] },
  lazer_cultura: { label: 'Lazer & Cultura', color: '#7e22ce', icon: Landmark, types: ['park', 'museum', 'movie_theater', 'tourist_attraction', 'art_gallery', 'cultural_center', 'sports_complex'] },
  comercio_loja: { label: 'Comércio & Lojas', color: '#047857', icon: ShoppingBag, types: ['supermarket', 'shopping_mall', 'store'] },
  servico_publico: { label: 'Serviço Público', color: '#334155', icon: Building2, types: ['city_hall', 'post_office', 'police', 'courthouse'] },
  banheiro_adaptado: { label: 'Banheiros (adaptação a verificar)', color: '#0e7490', icon: Bath, types: ['public_bathroom'] },
  educacao: { label: 'Educação', color: '#a16207', icon: GraduationCap, types: ['school', 'university', 'library', 'preschool', 'primary_school', 'secondary_school'] },
  transporte_mobilidade: { label: 'Transporte', color: '#be185d', icon: Bus, types: ['bus_station', 'transit_station', 'train_station', 'bus_stop', 'taxi_stand'] },
  hospedagem: { label: 'Hospedagem', color: '#4338ca', icon: Hotel, types: ['hotel', 'lodging', 'hostel', 'guest_house', 'bed_and_breakfast', 'motel'] },
} satisfies Record<EstablishmentCategory, { label: string; color: string; icon: typeof Utensils; types: string[] }>;

const additionalTypes: Partial<Record<EstablishmentCategory, string[]>> = {
  alimentacao: ['food_court', 'cafeteria', 'snack_bar', 'meal_delivery', 'juice_shop', 'acai_shop'],
  saude: ['medical_lab', 'physiotherapist', 'dental_clinic', 'medical_clinic', 'drugstore'],
  comercio_loja: ['grocery_store', 'market', 'car_dealer', 'car_repair', 'car_wash', 'shopping_mall', 'wholesaler'],
  lazer_cultura: ['stadium', 'zoo', 'aquarium', 'amusement_park', 'historical_landmark', 'performing_arts_theater'],
  servico_publico: ['local_government_office', 'fire_station', 'government_office'],
  transporte_mobilidade: ['bus_stop', 'taxi_stand', 'subway_station', 'airport', 'light_rail_station', 'ferry_terminal'],
  hospedagem: ['motel', 'hostel', 'guest_house', 'bed_and_breakfast', 'resort_hotel', 'campground'],
};

function categoryForType(type: string): EstablishmentCategory | null {
  for (const [category, definition] of Object.entries(MAP_CATEGORIES)) {
    if ((definition.types as string[]).includes(type) || additionalTypes[category as EstablishmentCategory]?.includes(type)) return category as EstablishmentCategory;
  }
  if (type.endsWith('_restaurant')) return 'alimentacao';
  if (type.endsWith('_store')) return 'comercio_loja';
  return null;
}

export function categoryForTypes(types: string[], primaryType?: string | null): EstablishmentCategory | null {
  // A supermarket with a bakery is still primarily a supermarket.
  const primary = primaryType ? categoryForType(primaryType) : null;
  if (primary) return primary;
  // Without a recognized primary type, prefer specific services over generic store.
  const order: EstablishmentCategory[] = ['saude', 'alimentacao', 'banheiro_adaptado', 'educacao', 'hospedagem', 'transporte_mobilidade', 'lazer_cultura', 'servico_publico', 'comercio_loja'];
  return order.find(category => types.some(type => categoryForType(type) === category)) ?? null;
}
