// SOPHIA - Simmer Garden La Majada Complete Menu Data
// Extracted from SG2025 Menu PDF
// WhatsApp Delivery: 6990 4674

export interface SophiaMenuItem {
  id: string
  name: string
  description: string
  price: number
  pricePersonal?: number // For pizzas with dual pricing
  category: string
  tags?: string[]
  bestSeller?: boolean
  isNew?: boolean
}

export const SOPHIA_MENU: SophiaMenuItem[] = [
  // ═══════════════════════════════════════════════════════════════
  // ENTRADAS
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'molcajete-coulotte',
    name: 'Molcajete Coulotte',
    description: 'Coulotte servido en molcajete tradicional con guarniciones',
    price: 13.99,
    category: 'entradas',
    tags: ['🌶️ spicy'],
    bestSeller: true
  },
  {
    id: 'fundido-camaron-pollo',
    name: 'Fundido Camarón y Pollo',
    description: 'Queso fundido con camarones y pollo',
    price: 7.99,
    category: 'entradas'
  },
  {
    id: 'fundido-champinones',
    name: 'Fundido de Champiñones',
    description: 'Queso fundido con champiñones frescos',
    price: 7.99,
    category: 'entradas',
    tags: ['🌱 veg']
  },
  {
    id: 'fundido-filet-mignon',
    name: 'Fundido Filet Mignon',
    description: 'Queso fundido con cortes de filet mignon',
    price: 7.99,
    category: 'entradas'
  },
  {
    id: 'cheese-balls',
    name: 'Cheese Balls',
    description: 'Bolitas de queso crujientes',
    price: 6.99,
    category: 'entradas',
    tags: ['🌱 veg']
  },
  {
    id: 'patatas-tocino',
    name: 'Patatas con Tocino',
    description: 'Papas crujientes con tocino',
    price: 5.99,
    category: 'entradas'
  },

  // ═══════════════════════════════════════════════════════════════
  // ENSALADAS
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'ensalada-gambas',
    name: 'Ensalada Gambas',
    description: 'Ensalada fresca con camarones',
    price: 9.99,
    category: 'ensaladas'
  },
  {
    id: 'ensalada-criolla',
    name: 'Ensalada Criolla',
    description: 'Ensalada estilo criollo con vegetales frescos',
    price: 8.99,
    category: 'ensaladas',
    tags: ['🌱 veg']
  },
  {
    id: 'ensalada-impecable',
    name: 'Ensalada Impecable',
    description: 'Nuestra ensalada premium con ingredientes selectos',
    price: 9.99,
    category: 'ensaladas',
    tags: ['🌱 veg']
  },

  // ═══════════════════════════════════════════════════════════════
  // PASTAS
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'fettuccine-calamardina',
    name: 'Fettuccine Calamardiña',
    description: 'Fettuccine con calamares en salsa especial',
    price: 13.00,
    category: 'pastas'
  },
  {
    id: 'fettuccine-mar-y-tierra',
    name: 'Fettuccine Mar y Tierra',
    description: 'Fettuccine con mariscos y carne en combinación perfecta',
    price: 9.99,
    category: 'pastas',
    bestSeller: true
  },
  {
    id: 'lasagna-bolognesa',
    name: 'Lasagna Bolognesa',
    description: 'Lasagna tradicional con salsa bolognesa casera',
    price: 9.99,
    category: 'pastas'
  },
  {
    id: 'penne-brocoli-tocino',
    name: 'Penne Brócoli Tocino',
    description: 'Penne con brócoli fresco y tocino crujiente',
    price: 7.99,
    category: 'pastas'
  },

  // ═══════════════════════════════════════════════════════════════
  // PIZZAS CLÁSICAS - Personal $5.75 / Grande $14.99
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'pizza-fungie',
    name: 'Pizza Fungie',
    description: 'Pizza con champiñones frescos',
    price: 14.99,
    pricePersonal: 5.75,
    category: 'pizzas',
    tags: ['🌱 veg']
  },
  {
    id: 'pizza-con-pina',
    name: 'Pizza Con Piña',
    description: 'Pizza con piña tropical',
    price: 14.99,
    pricePersonal: 5.75,
    category: 'pizzas',
    tags: ['🌱 veg']
  },
  {
    id: 'pizza-maradona',
    name: 'Pizza La Maradona',
    description: 'Nuestra pizza estrella con ingredientes especiales',
    price: 14.99,
    pricePersonal: 5.75,
    category: 'pizzas',
    bestSeller: true
  },
  {
    id: 'pizza-brazuca',
    name: 'Pizza Brazuca',
    description: 'Pizza estilo brasileño',
    price: 14.99,
    pricePersonal: 5.75,
    category: 'pizzas'
  },
  {
    id: 'pizza-vegetariana',
    name: 'Pizza Vegetariana',
    description: 'Pizza con vegetales frescos variados',
    price: 14.99,
    pricePersonal: 5.75,
    category: 'pizzas',
    tags: ['🌱 veg']
  },
  {
    id: 'pizza-picollo',
    name: 'Pizza Picollo',
    description: 'Pizza clásica estilo italiano',
    price: 14.99,
    pricePersonal: 5.75,
    category: 'pizzas'
  },
  {
    id: 'pizza-jamon-pepperoni',
    name: 'Pizza Jamón o Pepperoni',
    description: 'Pizza clásica con jamón o pepperoni a elección',
    price: 14.99,
    pricePersonal: 5.75,
    category: 'pizzas'
  },
  {
    id: 'pizza-margherita',
    name: 'Pizza Margherita',
    description: 'Pizza tradicional italiana con tomate, mozzarella y albahaca',
    price: 14.99,
    pricePersonal: 5.75,
    category: 'pizzas',
    tags: ['🌱 veg']
  },
  {
    id: 'pizza-hawaiana',
    name: 'Pizza La Hawaiana',
    description: 'Pizza con jamón y piña',
    price: 14.99,
    pricePersonal: 5.75,
    category: 'pizzas'
  },
  {
    id: 'pizza-verde-mella',
    name: 'Pizza Verde Mella',
    description: 'Pizza con ingredientes verdes frescos',
    price: 14.99,
    pricePersonal: 5.75,
    category: 'pizzas',
    tags: ['🌱 veg']
  },
  {
    id: 'pizza-loroka',
    name: 'Pizza La Loroka',
    description: 'Pizza especial de la casa',
    price: 14.99,
    pricePersonal: 5.75,
    category: 'pizzas'
  },
  {
    id: 'pizza-quattro-quesos',
    name: 'Pizza Qu4tro Quesos',
    description: 'Pizza con cuatro quesos selectos',
    price: 14.99,
    pricePersonal: 5.75,
    category: 'pizzas',
    tags: ['🌱 veg']
  },

  // ═══════════════════════════════════════════════════════════════
  // PIZZAS ESPECIALES - Personal $8.25 / Grande $17.99
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'pizza-castellana',
    name: 'Pizza La Castellana',
    description: 'Pizza premium estilo castellano',
    price: 17.99,
    pricePersonal: 8.25,
    category: 'pizzas-especiales'
  },
  {
    id: 'pizza-prosciutto',
    name: 'Pizza Prosciutto',
    description: 'Pizza con prosciutto italiano',
    price: 17.99,
    pricePersonal: 8.25,
    category: 'pizzas-especiales'
  },
  {
    id: 'pizza-ghiottone',
    name: 'Pizza Ghiottone',
    description: 'Pizza gourmet con ingredientes premium',
    price: 17.99,
    pricePersonal: 8.25,
    category: 'pizzas-especiales'
  },
  {
    id: 'pizza-memorable',
    name: 'Pizza La Memorable',
    description: 'Pizza especial inolvidable',
    price: 17.99,
    pricePersonal: 8.25,
    category: 'pizzas-especiales',
    bestSeller: true
  },
  {
    id: 'pizza-don-cangrejo',
    name: 'Pizza Don Cangrejo',
    description: 'Pizza con cangrejo fresco',
    price: 17.99,
    pricePersonal: 8.25,
    category: 'pizzas-especiales'
  },
  {
    id: 'pizza-pescattore',
    name: 'Pizza La Pescattore',
    description: 'Pizza con mariscos frescos del mar',
    price: 17.99,
    pricePersonal: 8.25,
    category: 'pizzas-especiales'
  },
  {
    id: 'pizza-punta-jalapena',
    name: 'Pizza Punta Jalapeña',
    description: 'Pizza picante con jalapeños',
    price: 17.99,
    pricePersonal: 8.25,
    category: 'pizzas-especiales',
    tags: ['🌶️ spicy']
  },
  {
    id: 'pizza-campesina',
    name: 'Pizza La Campesina',
    description: 'Pizza rústica con ingredientes del campo',
    price: 17.99,
    pricePersonal: 8.25,
    category: 'pizzas-especiales'
  },
  {
    id: 'pizza-gamberetti',
    name: 'Pizza Gamberetti',
    description: 'Pizza con camarones frescos',
    price: 17.99,
    pricePersonal: 8.25,
    category: 'pizzas-especiales'
  },

  // ═══════════════════════════════════════════════════════════════
  // PLATOS FUERTES
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'terramar-al-maitre',
    name: 'Terramar al Maître',
    description: 'Combinación de mar y tierra preparado al estilo del chef',
    price: 19.99,
    category: 'platos-fuertes',
    bestSeller: true
  },
  {
    id: 'medallon-lomito-maitre',
    name: 'Medallón de Lomito al Maître',
    description: 'Medallón de lomito premium preparado al estilo del chef',
    price: 17.75,
    category: 'platos-fuertes',
    bestSeller: true,
    tags: ['Best Seller #1']
  },
  {
    id: 'pechuga-capresse',
    name: 'Pechuga Capresse',
    description: 'Pechuga de pollo con tomate, mozzarella y albahaca',
    price: 14.99,
    category: 'platos-fuertes'
  },
  {
    id: 'hamburguesa-casanova',
    name: 'Hamburguesa Casanova',
    description: 'Hamburguesa gourmet estilo de la casa',
    price: 11.99,
    category: 'platos-fuertes'
  },

  // ═══════════════════════════════════════════════════════════════
  // MENÚ INFANTIL
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'chunks-pollo',
    name: 'Chunks de Pollo',
    description: 'Trozos de pechugas empanizados, acompañados con papas francesas y té',
    price: 5.99,
    category: 'menu-infantil',
    tags: ['👶 kids']
  },
  {
    id: 'cangreburguer',
    name: 'Cangreburguer',
    description: 'Hamburguesa tradicional de pollo, acompañada de papas francesas y té',
    price: 5.50,
    category: 'menu-infantil',
    tags: ['👶 kids']
  },

  // ═══════════════════════════════════════════════════════════════
  // BEBIDAS CALIENTES
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'cappuccino-vainilla',
    name: 'Cappuccino Vainilla',
    description: 'Cappuccino con toque de vainilla',
    price: 2.99,
    category: 'bebidas-calientes'
  },
  {
    id: 'cappuccino',
    name: 'Cappuccino',
    description: 'Cappuccino tradicional italiano',
    price: 2.99,
    category: 'bebidas-calientes'
  },
  {
    id: 'latte',
    name: 'Latte',
    description: 'Café latte cremoso',
    price: 2.99,
    category: 'bebidas-calientes'
  },
  {
    id: 'latte-vainilla',
    name: 'Latte Vainilla',
    description: 'Café latte con vainilla',
    price: 2.99,
    category: 'bebidas-calientes'
  },
  {
    id: 'mokaccino',
    name: 'Mokaccino',
    description: 'Café con chocolate',
    price: 2.99,
    category: 'bebidas-calientes'
  },
  {
    id: 'cafe-americano',
    name: 'Café Americano',
    description: 'Café americano tradicional',
    price: 1.50,
    category: 'bebidas-calientes'
  },
  {
    id: 'chocolate-caliente',
    name: 'Chocolate',
    description: 'Chocolate caliente cremoso',
    price: 2.99,
    category: 'bebidas-calientes'
  },
  {
    id: 'affogato',
    name: 'Affogato',
    description: 'Helado de vainilla con espresso',
    price: 3.50,
    category: 'bebidas-calientes',
    bestSeller: true
  },
  {
    id: 'iced-orange-coffee',
    name: 'Iced Orange Coffee',
    description: 'Café helado con naranja',
    price: 3.50,
    category: 'bebidas-calientes'
  },
  {
    id: 'espresso',
    name: 'Espresso',
    description: 'Espresso italiano',
    price: 2.99,
    category: 'bebidas-calientes'
  },
  {
    id: 'cortadito',
    name: 'Cortadito',
    description: 'Espresso cortado con leche',
    price: 2.99,
    category: 'bebidas-calientes'
  },

  // ═══════════════════════════════════════════════════════════════
  // BEBIDAS FRÍAS
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'frozen',
    name: 'Frozen',
    description: 'Bebida frozen refrescante',
    price: 3.75,
    category: 'bebidas-frias'
  },
  {
    id: 'limonadas',
    name: 'Limonadas',
    description: 'Limonada natural refrescante',
    price: 3.25,
    category: 'bebidas-frias'
  },
  {
    id: 'refrescos',
    name: 'Refrescos',
    description: 'Refrescos variados',
    price: 2.95,
    category: 'bebidas-frias'
  },
  {
    id: 'agua',
    name: 'Agua',
    description: 'Agua natural',
    price: 1.99,
    category: 'bebidas-frias'
  },
  {
    id: 'sodas',
    name: 'Sodas',
    description: 'Sodas italianas',
    price: 1.99,
    category: 'bebidas-frias'
  },

  // ═══════════════════════════════════════════════════════════════
  // CERVEZAS LOCALES
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'puente-quemado',
    name: 'Puente Quemado',
    description: 'Cerveza santaneca local premium',
    price: 5.00,
    category: 'cervezas',
    tags: ['🍺 local'],
    bestSeller: true
  },
  {
    id: 'regia-chola',
    name: 'Regia Chola',
    description: 'Cerveza local',
    price: 4.25,
    category: 'cervezas',
    tags: ['🍺 local']
  },
  {
    id: 'suprema',
    name: 'Suprema',
    description: 'Cerveza Suprema',
    price: 2.50,
    category: 'cervezas',
    tags: ['🍺 local']
  },
  {
    id: 'pilsener',
    name: 'Pilsener',
    description: 'Cerveza Pilsener',
    price: 2.25,
    category: 'cervezas',
    tags: ['🍺 local']
  },
  {
    id: 'golden',
    name: 'Golden',
    description: 'Cerveza Golden',
    price: 2.25,
    category: 'cervezas',
    tags: ['🍺 local']
  },
  {
    id: 'golden-extra',
    name: 'Golden Extra',
    description: 'Cerveza Golden Extra',
    price: 2.25,
    category: 'cervezas',
    tags: ['🍺 local']
  },

  // ═══════════════════════════════════════════════════════════════
  // CERVEZAS EXTRANJERAS
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'corona',
    name: 'Corona',
    description: 'Cerveza Corona mexicana',
    price: 3.50,
    category: 'cervezas',
    tags: ['🍺 import']
  },
  {
    id: 'heineken',
    name: 'Heineken',
    description: 'Cerveza Heineken holandesa',
    price: 3.50,
    category: 'cervezas',
    tags: ['🍺 import']
  },
  {
    id: 'miller-draft',
    name: 'Miller Draft',
    description: 'Cerveza Miller Draft americana',
    price: 3.50,
    category: 'cervezas',
    tags: ['🍺 import']
  },
  {
    id: 'modelo',
    name: 'Modelo',
    description: 'Cerveza Modelo mexicana',
    price: 3.50,
    category: 'cervezas',
    tags: ['🍺 import']
  },
  {
    id: 'blue-moon',
    name: 'Blue Moon',
    description: 'Cerveza Blue Moon artesanal',
    price: 3.50,
    category: 'cervezas',
    tags: ['🍺 import']
  },
  {
    id: 'stella-artois',
    name: 'Stella Artois',
    description: 'Cerveza Stella Artois belga',
    price: 3.50,
    category: 'cervezas',
    tags: ['🍺 import']
  },
  {
    id: 'michelob-ultra',
    name: 'Michelob Ultra',
    description: 'Cerveza Michelob Ultra light',
    price: 3.50,
    category: 'cervezas',
    tags: ['🍺 import']
  },
  {
    id: 'michelada-tradicional',
    name: 'Michelada Tradicional',
    description: 'Michelada preparada tradicional con especias',
    price: 1.50,
    category: 'cervezas',
    bestSeller: true
  },
  {
    id: 'smirnoff-ice',
    name: 'Smirnoff Ice',
    description: 'Bebida Smirnoff Ice',
    price: 3.75,
    category: 'cervezas'
  },

  // ═══════════════════════════════════════════════════════════════
  // POSTRES
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'ganache-chocolate',
    name: 'Ganache de Chocolate',
    description: 'Ganache de chocolate premium',
    price: 3.99,
    category: 'postres',
    tags: ['🌱 veg']
  },
  {
    id: 'brownie-helado',
    name: 'Brownie con Helado',
    description: 'Brownie de chocolate con helado de vainilla y almendras',
    price: 3.99,
    category: 'postres',
    tags: ['🌱 veg']
  },
  {
    id: 'cheesecake-fresa',
    name: 'Cheesecake de Fresa',
    description: 'Cheesecake cremoso con fresas frescas',
    price: 3.99,
    category: 'postres',
    tags: ['🌱 veg']
  },
  {
    id: 'panna-cotta',
    name: 'Panna Cotta',
    description: 'Panna cotta italiana con frutos rojos - TOP #1 Postre',
    price: 3.99,
    category: 'postres',
    tags: ['🌱 veg'],
    bestSeller: true
  }
]

// Category display names for Sophia
export const SOPHIA_CATEGORIES = {
  'entradas': 'Entradas',
  'ensaladas': 'Ensaladas',
  'pastas': 'Nuestras Pastas',
  'pizzas': 'Nuestra Pizza (Clásicas)',
  'pizzas-especiales': 'Pizzas Especiales',
  'platos-fuertes': 'Platos Fuertes',
  'menu-infantil': 'Menú Infantil',
  'bebidas-calientes': 'Bebidas Calientes',
  'bebidas-frias': 'Bebidas Frías',
  'cervezas': 'Cervezas',
  'postres': 'Postres'
}

// Restaurant info for Sophia
export const SIMMER_GARDEN_INFO = {
  name: 'Simmer Garden - La Majada',
  tagline: '¡Escapa de la ciudad!',
  delivery: {
    whatsapp: '6990 4674',
    available: true
  },
  bestSellers: [
    'Medallón de Lomito al Maître',
    'Panna Cotta (Frutos Rojos)',
    'Affogato',
    'Puente Quemado (Cerveza)',
    'Terramar al Maître',
    'Pizza La Maradona',
    'Fettuccine Mar y Tierra'
  ],
  pizzaPricing: {
    clasicas: { personal: 5.75, grande: 14.99 },
    especiales: { personal: 8.25, grande: 17.99 }
  }
}

// Helper functions for Sophia
export function getSophiaMenuByCategory(category: string): SophiaMenuItem[] {
  return SOPHIA_MENU.filter(item => item.category === category)
}

export function getSophiaBestSellers(): SophiaMenuItem[] {
  return SOPHIA_MENU.filter(item => item.bestSeller)
}

export function searchSophiaMenu(query: string): SophiaMenuItem[] {
  const lowerQuery = query.toLowerCase()
  return SOPHIA_MENU.filter(item =>
    item.name.toLowerCase().includes(lowerQuery) ||
    item.description.toLowerCase().includes(lowerQuery)
  )
}

export function getSophiaVegetarianItems(): SophiaMenuItem[] {
  return SOPHIA_MENU.filter(item =>
    item.tags?.some(tag => tag.includes('veg'))
  )
}

export function getSophiaKidsMenu(): SophiaMenuItem[] {
  return SOPHIA_MENU.filter(item => item.category === 'menu-infantil')
}
