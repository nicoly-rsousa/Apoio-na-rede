import test from 'node:test';
import assert from 'node:assert/strict';
import { externalDiscoveryPlaces, discoveryCards } from '../src/utils/discoveryPlaces.ts';
const cafe = { id: 'google-cafe', place_id: 'cafe', nome: 'Café', categoria: 'alimentacao', latitude: -21.39, longitude: -42.69 };
const school = { ...cafe, id: 'school', place_id: 'school', categoria: 'educacao' };
test('category results remain available when accessibility is unknown', () => {
  assert.deepEqual(externalDiscoveryPlaces([cafe, school], [], 'alimentacao', false, true), [cafe]);
  assert.deepEqual(externalDiscoveryPlaces([cafe], [], 'alimentacao', true, true), []);
  assert.deepEqual(externalDiscoveryPlaces([cafe], [], 'alimentacao', false, false), []);
});
test('local records appear in discovery cards without Google results', () => {
  const local = { ...cafe, id: 'local', endereco: 'Rua 1' };
  assert.equal(discoveryCards([local], []).length, 1);
  const external = externalDiscoveryPlaces([cafe, school], [local], 'todas', false, true);
  assert.deepEqual(external, [school]);
  assert.equal(discoveryCards([local], external).length, 2);
});
