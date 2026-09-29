import test from 'node:test';
import assert from 'node:assert/strict';
import { resourceState } from '../src/data/accessibilityResources.ts';
import { fetchWalkingRoute } from '../src/services/routeService.ts';

const criterion = (presente, extra = {}) => ({ id: 'criterion', establishment_id: 'place', tipo_deficiencia: 'mobilidade', criterio: 'Rampa', recurso: 'rampa', presente, ...extra });

test('missing information and null never mean no', () => {
  assert.equal(resourceState([], 'rampa'), 'desconhecido');
  assert.equal(resourceState([criterion(null)], 'rampa'), 'desconhecido');
});
test('explicit yes and no remain distinct', () => {
  assert.equal(resourceState([criterion(true)], 'rampa'), 'sim');
  assert.equal(resourceState([criterion(false)], 'rampa'), 'nao');
});
test('conflicting reports require verification', () => {
  assert.equal(resourceState([criterion(true), criterion(false)], 'rampa'), 'desconhecido');
});
test('one resource does not imply another resource', () => {
  assert.equal(resourceState([criterion(true)], 'cadeira_rodas'), 'desconhecido');
});
test('recognizes exact legacy criteria without guessing by substring', () => {
  assert.equal(resourceState([criterion(false, { recurso: undefined, criterio: 'Rampa de acesso suave conforme NBR 9050 (sem degraus na entrada)' })], 'rampa'), 'nao');
  assert.equal(resourceState([criterion(true, { recurso: undefined, criterio: 'Rampa do prédio vizinho' })], 'rampa'), 'desconhecido');
});

test('route service rejects invalid geometry and keeps coordinate order', async t => {
  const origin = { latitude: -21.39, longitude: -42.68 };
  const destination = { ...origin, id: 'place', nome: 'Destino' };
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ routes: [{ distance: 123, duration: 90, geometry: { coordinates: [[-42.68, -21.39], [-42.69, -21.40]] } }] })));
  const route = await fetchWalkingRoute(origin, destination);
  assert.deepEqual(route.coordinates, [[-21.39, -42.68], [-21.40, -42.69]]);
  fetchMock.mock.mockImplementation(async () => new Response(JSON.stringify({ routes: [{ distance: 123, duration: 90, geometry: { coordinates: [[null, 1], [2, 3]] } }] })));
  await assert.rejects(fetchWalkingRoute(origin, destination));
  fetchMock.mock.mockImplementation(async () => new Response('', { status: 503 }));
  await assert.rejects(fetchWalkingRoute(origin, destination));
});
