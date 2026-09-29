import type { AccessibilityCriteria } from '../types';

export const ACCESSIBILITY_RESOURCES = [
  { id: 'libras', label: 'Atendimento em Libras', legacy: 'Atendentes capacitados em Libras (Língua Brasileira de Sinais)' },
  { id: 'entrada_acessivel', label: 'Entrada acessível', legacy: 'Entrada acessível sem degraus ou com acesso alternativo' },
  { id: 'rampa', label: 'Rampa', legacy: 'Rampa de acesso suave conforme NBR 9050 (sem degraus na entrada)' },
  { id: 'elevador', label: 'Elevador', legacy: 'Elevador acessível para cadeira de rodas' },
  { id: 'corrimao', label: 'Corrimão', legacy: 'Corrimão nas rampas e escadas' },
  { id: 'banheiro_pcd', label: 'Banheiro PCD', legacy: 'Banheiro adaptado com barras de apoio e espaço de giro de 1,50m' },
  { id: 'vaga_pcd', label: 'Vaga PCD', legacy: 'Vaga de estacionamento reservada e sinalizada em frente ao local' },
  { id: 'piso_tatil', label: 'Piso tátil', legacy: 'Piso tátil direcional e de alerta desde o acesso externo' },
  { id: 'cadeira_rodas', label: 'Circulação em cadeira de rodas', legacy: 'Circulação interna acessível para cadeira de rodas' },
] as const;

export function resourceState(criteria: AccessibilityCriteria[], id: string): 'sim' | 'nao' | 'desconhecido' {
  const resource = ACCESSIBILITY_RESOURCES.find(item => item.id === id);
  const matches = criteria.filter(item => item.recurso === id || (!item.recurso && (item.criterio === resource?.legacy || (id === 'libras' && item.criterio === 'Atendente capacitado em Libras'))));
  const yes = matches.some(item => item.presente === true);
  const no = matches.some(item => item.presente === false);
  // Conflicting reports are not confirmation in either direction.
  return yes === no ? 'desconhecido' : yes ? 'sim' : 'nao';
}
