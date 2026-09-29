import type { EstablishmentCategory } from '../types';

// Separate activities recover places that are missing a precise Google type.
export const CATEGORY_QUERIES: Record<EstablishmentCategory, string[]> = {
  alimentacao: ['restaurantes', 'lanchonetes e padarias', 'cafeterias e sorveterias'],
  saude: ['hospitais e postos de saúde', 'clínicas e consultórios', 'farmácias e laboratórios'],
  lazer_cultura: ['praças e parques', 'museus e centros culturais', 'cinemas e espaços esportivos'],
  comercio_loja: ['lojas e supermercados', 'comércio e mercados', 'oficinas e concessionárias'],
  servico_publico: ['serviços públicos e prefeitura', 'correios e delegacias'],
  banheiro_adaptado: ['banheiros públicos', 'sanitários públicos'],
  educacao: ['escolas e colégios', 'creches e educação infantil', 'faculdades e cursos técnicos'],
  transporte_mobilidade: ['rodoviária e terminais de ônibus', 'pontos de ônibus', 'pontos de táxi e transporte de passageiros'],
  hospedagem: ['hotéis', 'pousadas e hospedarias', 'hostels e alojamentos'],
};

export function categoryForActivity(name: string): EstablishmentCategory | null {
  const text = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const rules: [EstablishmentCategory, RegExp][] = [
    ['banheiro_adaptado', /\b(banheiros? publicos?|sanitarios? publicos?|toaletes? publicos?)\b/],
    ['educacao', /\b(escola|colegio|creche|cemei|emei|cem|universidade|faculdade|instituto federal|senai|senac|autoescola|auto escola|curso tecnico|cursos tecnicos)\b/],
    ['transporte_mobilidade', /\b(rodoviaria|terminal rodoviario|terminal de onibus|ponto de onibus|ponto de taxi|taxi|estacao ferroviaria|transporte de passageiros)\b/],
    ['hospedagem', /\b(hotel|hoteis|pousada|hospedaria|hostel|albergue|motel|apart hotel|alojamento)\b/],
    ['saude', /\b(hospital|ubs|upa|posto de saude|unidade de saude|clinica|consultorio|farmacia|drogaria|laboratorio de analises|odontologia|dentista|fisioterapia)\b/],
    ['alimentacao', /\b(restaurante|pizzaria|lanchonete|padaria|confeitaria|cafeteria|sorveteria|hamburgueria|churrascaria|pastelaria)\b/],
    ['lazer_cultura', /\b(praca|parque|museu|cinema|teatro|centro cultural|estadio|ginasio|clube)\b/],
    ['servico_publico', /\b(prefeitura|delegacia|correios|forum|camara municipal|secretaria municipal|cras|creas|detran|cartorio)\b/],
    ['comercio_loja', /\b(loja|supermercado|mercado|mercearia|livraria|papelaria|oficina|concessionaria)\b/],
  ];
  return rules.find(([, pattern]) => pattern.test(text))?.[0] ?? null;
}
