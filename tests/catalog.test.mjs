import test from 'node:test';
import assert from 'node:assert/strict';
import { directionsUrl } from '../src/utils/directionsUrl.ts';
import { resourceState } from '../src/data/accessibilityResources.ts';

test('directions preserve destination and place ID without requiring an origin', () => {
  const url = new URL(directionsUrl({ latitude: -21.39, longitude: -42.69, place_id: 'place & id' }));
  assert.equal(url.pathname, '/maps/dir/');
  assert.equal(url.searchParams.get('destination'), '-21.39,-42.69');
  assert.equal(url.searchParams.get('destination_place_id'), 'place & id');
  assert.equal(url.searchParams.has('origin'), false);
  assert.equal(new URL(directionsUrl({ latitude: 0, longitude: 0 })).searchParams.has('destination_place_id'), false);
});

test('Libras recognizes registration and legacy records without inferring from other resources', () => {
  for (const criterio of ['Atendentes capacitados em Libras (Língua Brasileira de Sinais)', 'Atendente capacitado em Libras']) {
    assert.equal(resourceState([{ criterio, presente: true }], 'libras'), 'sim');
  }
  assert.equal(resourceState([{ criterio: 'Cardápio em vídeo com Libras e legendas', presente: true }], 'libras'), 'desconhecido');
});
