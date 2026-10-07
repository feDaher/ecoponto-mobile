import type {
  CollectionPointDtoInput,
  DisposalRecordDtoInput,
  EducationalContentDtoInput,
  ReviewDtoInput,
  UserDtoInput,
} from '../dto/api.schemas';

/**
 * Demo data — **fictitious**.
 *
 * None of these addresses, phone numbers or establishments corresponds to a
 * real accredited collection point. They serve to develop and present the app
 * on Expo Go before the API exists, and must be replaced by the real data
 * gathered with the city hall and the cooperatives of Manhuaçu–MG.
 *
 * Phone numbers use the documentation prefix (33 9 9999-00xx) precisely so
 * as not to touch a third party's number.
 *
 * The format is the same API DTO, on purpose: the seed goes through the same
 * Zod schemas and mappers that the HTTP response would.
 */

/** Downtown Manhuaçu–MG — initial map camera. */
export const DEFAULT_CITY = 'Manhuaçu';
export const DEFAULT_COORDINATE = { latitude: -20.2578, longitude: -42.0281 } as const;

const now = Date.now();
const daysAgo = (days: number) => new Date(now - days * 86_400_000).toISOString();

const businessHours = (id: string) => [
  { id: `${id}-1`, weekday: 1, opensAt: '08:00', closesAt: '18:00' },
  { id: `${id}-2`, weekday: 2, opensAt: '08:00', closesAt: '18:00' },
  { id: `${id}-3`, weekday: 3, opensAt: '08:00', closesAt: '18:00' },
  { id: `${id}-4`, weekday: 4, opensAt: '08:00', closesAt: '18:00' },
  { id: `${id}-5`, weekday: 5, opensAt: '08:00', closesAt: '18:00' },
];

export const DEMO_POINTS: CollectionPointDtoInput[] = [
  {
    id: '1',
    collectorId: 'collector-1',
    name: 'Cooperativa Recicla Manhuaçu',
    address: 'Rua Ministro Alfredo Sá, 320 — Centro',
    city: 'Manhuaçu',
    neighborhood: 'Centro',
    latitude: -20.2585,
    longitude: -42.0296,
    approvalStatus: 'approved',
    updatedAt: daysAgo(3),
    accreditedAt: daysAgo(240),
    categories: ['plastic', 'paper', 'metals', 'glass'],
    openingHours: [
      ...businessHours('1'),
      { id: '1-6', weekday: 6, opensAt: '08:00', closesAt: '12:00' },
    ],
    description:
      'Cooperativa de catadores com triagem completa de recicláveis secos. Receba orientação sobre separação na entrada.',
    whatsAppContact: '33999990011',
    showWhatsApp: true,
    averageRating: 4.7,
    reviewCount: 34,
  },
  {
    id: '2',
    collectorId: 'collector-2',
    name: 'UniFacig — Coleta de Eletrônicos',
    address: 'Av. Getúlio Vargas, 150 — Coqueiro',
    city: 'Manhuaçu',
    neighborhood: 'Coqueiro',
    latitude: -20.2632,
    longitude: -42.0338,
    approvalStatus: 'approved',
    updatedAt: daysAgo(1),
    accreditedAt: daysAgo(120),
    categories: ['general-electronics', 'computers', 'cell-phones', 'printers', 'batteries'],
    openingHours: [
      { id: '2-1', weekday: 1, opensAt: '13:00', closesAt: '22:00' },
      { id: '2-2', weekday: 2, opensAt: '13:00', closesAt: '22:00' },
      { id: '2-3', weekday: 3, opensAt: '13:00', closesAt: '22:00' },
      { id: '2-4', weekday: 4, opensAt: '13:00', closesAt: '22:00' },
      { id: '2-5', weekday: 5, opensAt: '13:00', closesAt: '22:00' },
    ],
    description:
      'Ponto de coleta de lixo eletrônico do campus. Equipamentos são triados e encaminhados para descontaminação.',
    whatsAppContact: '33999990022',
    showWhatsApp: true,
    averageRating: 4.9,
    reviewCount: 51,
  },
  {
    id: '3',
    collectorId: 'collector-3',
    name: 'Ponto Verde São Vicente',
    address: 'Rua São Vicente, 87 — São Vicente',
    city: 'Manhuaçu',
    neighborhood: 'São Vicente',
    latitude: -20.2497,
    longitude: -42.0224,
    approvalStatus: 'approved',
    updatedAt: daysAgo(12),
    accreditedAt: daysAgo(300),
    categories: ['cooking-oil', 'glass', 'plastic'],
    openingHours: [
      { id: '3-1', weekday: 2, opensAt: '09:00', closesAt: '17:00' },
      { id: '3-2', weekday: 4, opensAt: '09:00', closesAt: '17:00' },
      { id: '3-3', weekday: 6, opensAt: '09:00', closesAt: '13:00' },
    ],
    description:
      'Recebe óleo de cozinha usado em garrafa PET fechada. Não aceita óleo misturado com água.',
    whatsAppContact: '33999990033',
    showWhatsApp: false,
    averageRating: 4.2,
    reviewCount: 12,
  },
  {
    id: '4',
    collectorId: 'collector-4',
    name: 'Supermercado Bom Preço — Coleta de Pilhas',
    address: 'Praça Cinco de Novembro, 44 — Centro',
    city: 'Manhuaçu',
    neighborhood: 'Centro',
    latitude: -20.2561,
    longitude: -42.0269,
    approvalStatus: 'approved',
    updatedAt: daysAgo(20),
    accreditedAt: daysAgo(180),
    categories: ['batteries', 'cell-phones'],
    openingHours: [
      { id: '4-1', weekday: 0, opensAt: '08:00', closesAt: '13:00' },
      { id: '4-2', weekday: 1, opensAt: '07:00', closesAt: '21:00' },
      { id: '4-3', weekday: 2, opensAt: '07:00', closesAt: '21:00' },
      { id: '4-4', weekday: 3, opensAt: '07:00', closesAt: '21:00' },
      { id: '4-5', weekday: 4, opensAt: '07:00', closesAt: '21:00' },
      { id: '4-6', weekday: 5, opensAt: '07:00', closesAt: '21:00' },
      { id: '4-7', weekday: 6, opensAt: '07:00', closesAt: '21:00' },
    ],
    description: 'Coletor de pilhas e baterias na entrada da loja, ao lado dos caixas.',
    whatsAppContact: null,
    showWhatsApp: false,
    averageRating: 4.0,
    reviewCount: 8,
  },
  {
    id: '5',
    collectorId: 'collector-5',
    name: 'TecnoLar Assistência Técnica',
    address: 'Rua Dr. Luís Dutra, 512 — Baixada',
    city: 'Manhuaçu',
    neighborhood: 'Baixada',
    latitude: -20.2649,
    longitude: -42.0197,
    approvalStatus: 'approved',
    // Deliberately > 60 days: exercises the RB06 flag on the map.
    updatedAt: daysAgo(95),
    accreditedAt: daysAgo(400),
    categories: ['televisions', 'general-electronics', 'printers'],
    openingHours: businessHours('5'),
    description: 'Recebe televisores e eletrodomésticos de pequeno porte para desmontagem.',
    whatsAppContact: '33999990055',
    showWhatsApp: true,
    averageRating: 3.8,
    reviewCount: 6,
  },
  {
    id: '6',
    collectorId: 'collector-6',
    name: 'Escola Municipal Santa Luzia',
    address: 'Rua das Palmeiras, 90 — Santa Luzia',
    city: 'Manhuaçu',
    neighborhood: 'Santa Luzia',
    latitude: -20.2704,
    longitude: -42.0412,
    approvalStatus: 'approved',
    updatedAt: daysAgo(8),
    accreditedAt: daysAgo(60),
    categories: ['paper', 'plastic', 'metals'],
    openingHours: [
      { id: '6-1', weekday: 1, opensAt: '07:00', closesAt: '17:00' },
      { id: '6-2', weekday: 3, opensAt: '07:00', closesAt: '17:00' },
      { id: '6-3', weekday: 5, opensAt: '07:00', closesAt: '17:00' },
    ],
    description: 'Campanha permanente de arrecadação de recicláveis com os alunos.',
    whatsAppContact: null,
    showWhatsApp: false,
    averageRating: null,
    reviewCount: 0,
  },
  {
    id: '7',
    collectorId: 'collector-1',
    name: 'EcoPonto Realeza',
    address: 'Av. Salime Nacif, 1200 — Realeza',
    city: 'Manhuaçu',
    neighborhood: 'Realeza',
    latitude: -20.2455,
    longitude: -42.0345,
    approvalStatus: 'approved',
    updatedAt: daysAgo(30),
    accreditedAt: daysAgo(150),
    categories: ['plastic', 'paper', 'glass', 'metals', 'cooking-oil', 'general-electronics'],
    openingHours: [
      ...businessHours('7'),
      { id: '7-6', weekday: 6, opensAt: '08:00', closesAt: '16:00' },
      { id: '7-0', weekday: 0, opensAt: '08:00', closesAt: '12:00' },
    ],
    description:
      'Maior ponto de entrega voluntária da cidade. Recebe todas as categorias do sistema.',
    whatsAppContact: '33999990077',
    showWhatsApp: true,
    averageRating: 4.5,
    reviewCount: 27,
  },
  {
    id: '8',
    collectorId: 'collector-7',
    name: 'Ponto de Coleta Vila Nova (em análise)',
    address: 'Rua Projetada, s/n — Vila Nova',
    city: 'Manhuaçu',
    neighborhood: 'Vila Nova',
    latitude: -20.2388,
    longitude: -42.0158,
    // RB03 — pending: must not appear on the public map.
    approvalStatus: 'pending',
    updatedAt: daysAgo(2),
    accreditedAt: null,
    categories: ['plastic', 'paper'],
    openingHours: [{ id: '8-1', weekday: 6, opensAt: '09:00', closesAt: '12:00' }],
    description: 'Cadastro enviado pelo coletor, aguardando validação do administrador.',
    whatsAppContact: '33999990088',
    showWhatsApp: true,
    averageRating: null,
    reviewCount: 0,
  },
];

export const DEMO_REVIEWS: ReviewDtoInput[] = [
  {
    id: 'r1',
    citizenId: 'citizen-2',
    collectionPointId: '1',
    rating: 5,
    comment: 'Atendimento excelente, me explicaram como separar o material em casa.',
    author: 'Marina S.',
    reviewedAt: daysAgo(6),
    status: 'published',
  },
  {
    id: 'r2',
    citizenId: 'citizen-3',
    collectionPointId: '1',
    rating: 4,
    comment: 'Bom ponto, mas no sábado fecha cedo.',
    author: 'Rafael P.',
    reviewedAt: daysAgo(15),
    status: 'published',
  },
  {
    id: 'r3',
    citizenId: 'citizen-4',
    collectionPointId: '2',
    rating: 5,
    comment: 'Levei um notebook antigo e um monitor. Receberam tudo e deram comprovante.',
    author: 'Juliana M.',
    reviewedAt: daysAgo(4),
    status: 'published',
  },
  {
    id: 'r4',
    citizenId: 'citizen-5',
    collectionPointId: '5',
    rating: 3,
    comment: 'Só recebem TV de até 32 polegadas, vale confirmar antes de ir.',
    author: 'Carlos E.',
    reviewedAt: daysAgo(40),
    status: 'published',
  },
];

export const DEMO_DISPOSALS: DisposalRecordDtoInput[] = [
  {
    id: 'd1',
    citizenId: 'citizen-1',
    collectionPointId: '2',
    categoryId: 'cell-phones',
    weightKg: 0.3,
    pointsEarned: 11,
    disposedAt: daysAgo(5),
    collectionPointName: 'UniFacig — Coleta de Eletrônicos',
  },
  {
    id: 'd2',
    citizenId: 'citizen-1',
    collectionPointId: '1',
    categoryId: 'plastic',
    weightKg: 2.5,
    pointsEarned: 25,
    disposedAt: daysAgo(12),
    collectionPointName: 'Cooperativa Recicla Manhuaçu',
  },
  {
    id: 'd3',
    citizenId: 'citizen-1',
    collectionPointId: '7',
    categoryId: 'cooking-oil',
    weightKg: 1.8,
    pointsEarned: 40,
    disposedAt: daysAgo(22),
    collectionPointName: 'EcoPonto Realeza',
  },
];

/** Demo accounts — the password for all of them is `ecoponto123`. */
export const DEMO_USER: UserDtoInput = {
  id: 'citizen-1',
  name: 'Ana Souza',
  email: 'ana@ecoponto.dev',
  phone: '33999990001',
  city: 'Manhuaçu',
  role: 'citizen',
  registeredAt: daysAgo(90),
  points: 76,
  avatarUrl: null,
};

export const DEMO_COLLECTOR: UserDtoInput = {
  id: 'collector-1',
  name: 'Cooperativa Recicla',
  email: 'collector@ecoponto.dev',
  phone: '33999990011',
  city: 'Manhuaçu',
  role: 'collector',
  registeredAt: daysAgo(240),
  points: 0,
  avatarUrl: null,
};

export const DEMO_ADMIN: UserDtoInput = {
  id: 'admin-1',
  name: 'Administração EcoPonto',
  email: 'admin@ecoponto.dev',
  phone: '33999990000',
  city: 'Manhuaçu',
  role: 'admin',
  registeredAt: daysAgo(400),
  points: 0,
  avatarUrl: null,
};

export const DEMO_RANKING = [
  { userId: 'citizen-9', name: 'Beatriz Lima', city: 'Manhuaçu', points: 1820, position: 1 },
  { userId: 'citizen-7', name: 'Diego Alves', city: 'Manhuaçu', points: 1440, position: 2 },
  { userId: 'citizen-4', name: 'Juliana Martins', city: 'Manhuaçu', points: 980, position: 3 },
  { userId: 'citizen-2', name: 'Marina Silva', city: 'Manhuaçu', points: 615, position: 4 },
  { userId: 'citizen-3', name: 'Rafael Pires', city: 'Manhuaçu', points: 430, position: 5 },
  { userId: 'citizen-5', name: 'Carlos Eduardo', city: 'Manhuaçu', points: 310, position: 6 },
  { userId: 'citizen-6', name: 'Larissa Nunes', city: 'Manhuaçu', points: 205, position: 7 },
  { userId: 'citizen-1', name: 'Ana Souza', city: 'Manhuaçu', points: 76, position: 8 },
];

export const DEMO_CONTENTS: EducationalContentDtoInput[] = [
  {
    id: 'c1',
    title: 'Como descartar pilhas e baterias com segurança',
    summary:
      'Pilhas contêm metais pesados que contaminam solo e lençol freático. Nunca vão no lixo comum.',
    categoryId: 'batteries',
    howToDispose: [
      'Guarde as pilhas usadas em um pote plástico seco, longe de crianças.',
      'Não desmonte, não fure e não queime as pilhas.',
      'Leve a um ponto com coletor específico para pilhas e baterias.',
    ],
    whyRecycle:
      'Uma única pilha pode contaminar milhares de litros de água ao se decompor em aterro comum.',
    environmentalImpact:
      'Metais como mercúrio, chumbo e cádmio são bioacumulativos: sobem a cadeia alimentar até chegar às pessoas.',
    publishedAt: daysAgo(30),
  },
  {
    id: 'c2',
    title: 'O que fazer com o celular que você não usa mais',
    summary:
      'Mais de 83% dos entrevistados em Manhuaçu guardam eletrônicos em casa. O celular é o campeão da gaveta.',
    categoryId: 'cell-phones',
    howToDispose: [
      'Faça backup e apague os dados com restauração de fábrica.',
      'Remova chip e cartão de memória.',
      'Entregue em um ponto que aceite celulares — a bateria exige manejo especial.',
    ],
    whyRecycle:
      'Um celular contém ouro, prata, cobre e terras raras recuperáveis, além de componentes tóxicos.',
    environmentalImpact:
      'Reciclar uma tonelada de celulares recupera mais ouro do que uma tonelada de minério bruto.',
    publishedAt: daysAgo(25),
  },
  {
    id: 'c3',
    title: 'Óleo de cozinha usado: nunca na pia',
    summary:
      'Um litro de óleo contamina até 25 mil litros de água quando descartado na rede de esgoto.',
    categoryId: 'cooking-oil',
    howToDispose: [
      'Espere esfriar e coe para remover resíduos de comida.',
      'Armazene em garrafa PET bem fechada.',
      'Entregue em um ponto que receba óleo — ele vira sabão e biodiesel.',
    ],
    whyRecycle: 'O óleo forma película na água e impede a oxigenação da vida aquática.',
    environmentalImpact:
      'Além da contaminação, o óleo entope a rede de esgoto e aumenta o custo do tratamento municipal.',
    publishedAt: daysAgo(18),
  },
  {
    id: 'c4',
    title: 'Separação correta de plástico, papel, vidro e metal',
    summary: 'A regra é simples: limpo, seco e separado. Resíduo sujo contamina o lote inteiro.',
    categoryId: 'plastic',
    howToDispose: [
      'Enxágue embalagens com resto de alimento.',
      'Achate caixas e garrafas para ocupar menos espaço.',
      'Separe vidro quebrado em papelão identificado, protegendo quem coleta.',
    ],
    whyRecycle:
      'Material reciclado consome muito menos energia que a produção a partir de matéria-prima virgem.',
    environmentalImpact:
      'Reciclar alumínio economiza cerca de 95% da energia usada para produzi-lo do zero.',
    publishedAt: daysAgo(10),
  },
  {
    id: 'c5',
    title: 'Computadores e impressoras: descarte com responsabilidade',
    summary: 'Equipamentos de informática têm componentes perigosos e materiais valiosos.',
    categoryId: 'computers',
    howToDispose: [
      'Remova e destrua com segurança discos com dados pessoais (LGPD).',
      'Não descarte monitores de tubo no lixo comum — contêm chumbo.',
      'Entregue em ponto habilitado para eletrônicos de grande porte.',
    ],
    whyRecycle:
      'Placas eletrônicas concentram cobre e ouro, e seu descarte incorreto libera retardantes de chama.',
    environmentalImpact:
      'O lixo eletrônico é o fluxo de resíduos que mais cresce no mundo, e menos de um quarto é reciclado.',
    publishedAt: daysAgo(5),
  },
];
