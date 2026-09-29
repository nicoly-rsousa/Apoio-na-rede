import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSearchText } from '../src/utils/normalizeSearchText.ts';
import { validateRegistration, validCoordinates, validPhotoUrl } from '../src/utils/registrationValidation.ts';
import { browserStorage, readStoredArray } from '../src/lib/browserStorage.ts';

const registration = { nome: 'Café', descricao: 'Descrição', endereco: 'Rua, 12', cidade: 'Cataguases', estado: 'MG', latitude: -21.3924, longitude: -42.6896, fotos: [] };
test('search treats accents, case and repeated spaces equally', () => {
  assert.equal(normalizeSearchText('  CAFÉ   São João '), normalizeSearchText('cafe sao joao'));
});
test('registration rejects every missing required field and invalid UF', () => {
  for (const field of ['nome', 'descricao', 'endereco', 'cidade', 'estado']) assert.throws(() => validateRegistration({ ...registration, [field]: ' ' }));
  assert.throws(() => validateRegistration({ ...registration, estado: 'ZZ' }));
  assert.doesNotThrow(() => validateRegistration(registration));
});
test('registration rejects invalid coordinates and photo protocols', () => {
  for (const [lat, lng] of [[NaN, 1], [1, Infinity], [91, 0], [0, -181]]) assert.equal(validCoordinates(lat, lng), false);
  assert.throws(() => validateRegistration({ ...registration, latitude: NaN }));
  for (const url of ['invalid-photo-url', 'javascript:alert(1)', 'file:///photo.png', 'data:image/png;base64,x']) assert.equal(validPhotoUrl(url), false);
  assert.equal(validPhotoUrl('https://example.com/photo.png'), true);
  assert.throws(() => validateRegistration({ ...registration, fotos: ['invalid'] }));
});
test('storage failures preserve session data without throwing', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('Blocked storage'); } });
  try {
    assert.equal(browserStorage.getItem('unavailable-test'), null);
    assert.doesNotThrow(() => browserStorage.setItem('session-test', '[1]'));
    assert.deepEqual(readStoredArray('session-test'), [1]);
    browserStorage.setItem('session-test', '[2]');
    assert.deepEqual(readStoredArray('session-test'), [2]);
    assert.equal(browserStorage.isTemporary(), true);
    browserStorage.setItem('malformed-test', '{broken');
    assert.deepEqual(readStoredArray('malformed-test', ['fallback']), ['fallback']);
    browserStorage.setItem('object-test', '{}');
    assert.deepEqual(readStoredArray('object-test'), []);
    assert.doesNotThrow(() => browserStorage.removeItem('session-test'));
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else delete globalThis.localStorage;
  }
});
