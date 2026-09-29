export type DisabilityType = 'mobilidade' | 'visual' | 'auditiva' | 'intelectual' | 'invisivel';

export type EstablishmentStatus = 'pendente' | 'verificado' | 'rejeitado';

export type EstablishmentCategory =
  | 'alimentacao'
  | 'saude'
  | 'lazer_cultura'
  | 'comercio_loja'
  | 'servico_publico'
  | 'banheiro_adaptado'
  | 'educacao'
  | 'transporte_mobilidade'
  | 'hospedagem';

export interface AccessibilityCriteria {
  id: string;
  establishment_id: string;
  tipo_deficiencia: DisabilityType;
  criterio: string;
  presente: boolean | null;
  recurso?: string;
  observacao_livre?: string;
}

export interface Review {
  id: string;
  establishment_id: string;
  user_id?: string;
  user_nome: string;
  tipo_deficiencia_avaliada: DisabilityType;
  nota: number; // 1 to 5
  comentario: string;
  fotos?: string[];
  denunciada?: boolean;
  motivo_denuncia?: string;
  data: string;
}

export interface Establishment {
  id: string;
  place_id?: string;
  nome: string;
  categoria: EstablishmentCategory;
  endereco: string;
  bairro?: string;
  cidade: string;
  estado: string;
  cep?: string;
  latitude: number;
  longitude: number;
  descricao: string;
  fotos: string[];
  dono_id?: string;
  status: EstablishmentStatus;
  telefone?: string;
  whatsapp?: string;
  email_contato?: string;
  horario_funcionamento?: string;
  website?: string;
  nota_media: number;
  total_avaliacoes: number;
  verificado_em?: string;
  motivo_rejeicao?: string;
  criado_em?: string;
  // Joins opcionais
  criteria?: AccessibilityCriteria[];
  reviews?: Review[];
}

export interface Professional {
  id: string;
  nome: string;
  especialidade: string;
  registro_profissional?: string;
  establishment_id?: string;
  endereco?: string;
  cidade: string;
  estado: string;
  telefone?: string;
  email?: string;
  whatsapp?: string;
  atende_por_tipo: DisabilityType[];
  descricao: string;
  foto_url?: string;
}

export interface AccessibleRoute {
  id: string;
  titulo: string;
  cidade: string;
  ponto_origem: string;
  ponto_destino: string;
  trecho_descricao: string;
  tem_rampa: boolean;
  tem_piso_tatil: boolean;
  tem_semaforo_sonoro: boolean;
  nivel_seguranca: string;
  coordenadas: [number, number][]; // [lat, lng]
  distancia_metros: number;
  duracao_segundos?: number;
  auditada?: boolean;
}

export interface NearbyPlace {
  foto?: string;
  fotoAutores?: { nome: string; url: string | null }[];
  id: string;
  place_id?: string;
  fonte?: 'google' | 'osm';
  nome: string;
  categoria: EstablishmentCategory;
  latitude: number;
  longitude: number;
  endereco: string;
}

export interface AccessibilitySettings {
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
  highContrast: 'default' | 'dark' | 'yellow-black';
  dyslexicFont: boolean;
  reducedSensory: boolean;
  voiceReadingEnabled: boolean;
  preferredView: 'map' | 'list';
  enhancedFocus: boolean;
}

export interface FilterState {
  searchQuery: string;
  category: EstablishmentCategory | 'todas';
  city: string;
  selectedDisabilities: DisabilityType[];
  onlyVerified: boolean;
  specificCriteria: string[];
}
