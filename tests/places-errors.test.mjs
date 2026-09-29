import test from 'node:test';
import assert from 'node:assert/strict';
import { isPlacesQuotaError } from '../src/utils/placesError.ts';

test('quota failures are distinguished from network and authorization failures', () => {
  assert.equal(isPlacesQuotaError({ code: 'RESOURCE_EXHAUSTED' }), true);
  assert.equal(isPlacesQuotaError(new Error('Quota exceeded for SearchNearbyRequest per day')), true);
  assert.equal(isPlacesQuotaError({ code: 'REQUEST_DENIED' }), false);
  assert.equal(isPlacesQuotaError(new TypeError('Failed to fetch')), false);
  assert.equal(isPlacesQuotaError(null), false);
});
