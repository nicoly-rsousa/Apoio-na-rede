import test from 'node:test';
import assert from 'node:assert/strict';
import { categoryForTypes, MAP_CATEGORIES } from '../src/data/mapCategories.ts';
import { categoryForActivity, CATEGORY_QUERIES } from '../src/data/categoryDiscovery.ts';

test('primary activity wins over secondary activities', () => {
  assert.equal(categoryForTypes(['supermarket', 'bakery', 'store'], 'supermarket'), 'comercio_loja');
  assert.equal(categoryForTypes(['hotel', 'restaurant'], 'hotel'), 'hospedagem');
  assert.equal(categoryForTypes(['pharmacy', 'store'], 'pharmacy'), 'saude');
  assert.equal(categoryForTypes(['book_store', 'store'], 'book_store'), 'comercio_loja');
});

test('specific types map consistently without a primary activity', () => {
  for (const [type, expected] of Object.entries({pizza_restaurant:'alimentacao', pharmacy:'saude',
    museum:'lazer_cultura', car_dealer:'comercio_loja', city_hall:'servico_publico',
    public_bathroom:'banheiro_adaptado', primary_school:'educacao', bus_stop:'transporte_mobilidade', hostel:'hospedagem'})) {
    assert.equal(categoryForTypes([type, 'point_of_interest', 'establishment']), expected, type);
  }
});

test('addresses and unknown places are not invented shops', () => {
  for (const types of [[], ['street_address'], ['route'], ['premise'], ['point_of_interest', 'establishment']]) {
    assert.equal(categoryForTypes(types), null);
  }
});

test('nearby query stays within the Google limit of 50 included types', () => {
  assert.ok(new Set(Object.values(MAP_CATEGORIES).flatMap(category => category.types)).size <= 50);
});

test('activity names recover incomplete classifications across discovery categories', () => {
  for (const [name, expected] of Object.entries({
    'Creche Municipal Vila Reis': 'educacao', 'Colégio Cataguases': 'educacao',
    'SENAI Cataguases': 'educacao', 'Pousada das Flores': 'hospedagem',
    'Terminal Rodoviário': 'transporte_mobilidade', 'Ponto de Táxi Centro': 'transporte_mobilidade',
    'Banheiro Público da Praça': 'banheiro_adaptado', 'Sanitários Públicos': 'banheiro_adaptado',
  })) assert.equal(categoryForActivity(name), expected, name);
});

test('bathrooms are not assumed from names of unrelated establishments or addresses', () => {
  assert.notEqual(categoryForActivity('Shopping Central'), 'banheiro_adaptado');
  assert.notEqual(categoryForActivity('Loja de Banheiros e Revestimentos'), 'banheiro_adaptado');
  assert.equal(categoryForActivity('Rua das Flores 100'), null);
  for (const category of Object.keys(MAP_CATEGORIES)) assert.ok(CATEGORY_QUERIES[category].length >= 2);
});
