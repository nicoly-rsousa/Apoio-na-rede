import { getSupabase } from '../lib/supabase';
import { StorageService } from './storageService';
import type { Establishment } from '../types';

export interface PlaceAccessibilityResult {
  encontrado: boolean;
  verificado: boolean;
  local: Establishment | null;
}

export const AccessibilityService = {
  async getByPlaceId(placeId: string): Promise<PlaceAccessibilityResult> {
    if (!placeId.trim()) throw new Error('Identificador do local ausente');
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.rpc('get_place_accessibility', { requested_place_id: placeId });
      if (error) throw new Error('Não foi possível consultar a acessibilidade no banco.');
      if (!data || typeof data.encontrado !== 'boolean') throw new Error('Resposta inválida do banco.');
      return data as PlaceAccessibilityResult;
    }
    // Exact provider identity only. A similar name or address is not a match.
    const list = await StorageService.getEstablishments();
    const local = list.find(item => item.place_id === placeId && item.status !== 'rejeitado') ?? null;
    return { encontrado: local !== null, verificado: local?.status === 'verificado', local };
  },
};
