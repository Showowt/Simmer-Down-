// SIMMER DOWN — Complete Multi-Location Menu System
// All locations: Santa Ana, San Benito, La Majada (Garden), Lago de Coatepeque

export type LocationId = 'santa-ana' | 'san-benito' | 'la-majada' | 'lago-coatepeque'

export interface Location {
  id: LocationId
  name: string
  brand: 'simmer-down' | 'simmer-garden'
  tagline: string
  whatsapp: string
  features: string[]
}

export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  pricePersonal?: number // For pizzas
  category: string
  tags?: string[]
  bestSeller?: boolean
  image?: string // Local /images/menu path, optional
  locations: LocationId[] // Which locations have this item
  locationPrices?: Partial<Record<LocationId, number>> // Location-specific pricing
}

// ═══════════════════════════════════════════════════════════════
// LOCATIONS
// ═══════════════════════════════════════════════════════════════

export const LOCATIONS: Record<LocationId, Location> = {
  'santa-ana': {
    id: 'santa-ana',
    name: 'Simmer Down Santa Ana',
    brand: 'simmer-down',
    tagline: 'The Original Fire',
    whatsapp: '7890-1234',
    features: ['Classic menu', 'Original location']
  },
  'san-benito': {
    id: 'san-benito',
    name: 'Simmer Down San Benito',
    brand: 'simmer-down',
    tagline: 'Urban Heat',
    whatsapp: '7890-5678',
    features: ['Classic menu', 'San Salvador location']
  },
  'la-majada': {
    id: 'la-majada',
    name: 'Simmer Garden La Majada',
    brand: 'simmer-garden',
    tagline: '¡Escapa de la ciudad!',
    whatsapp: '6990-4674',
    features: ['Garden atmosphere', 'Hamburguesa Casanova', 'Expanded coffee menu']
  },
  'lago-coatepeque': {
    id: 'lago-coatepeque',
    name: 'Simmer Down Lago de Coatepeque',
    brand: 'simmer-down',
    tagline: 'Lakeside Flavors',
    whatsapp: '7890-9012',
    features: ['Lake view', 'Premium seafood', 'Ceviches', 'Weekend specials']
  }
}

// ═══════════════════════════════════════════════════════════════
// CATEGORIES
// ═══════════════════════════════════════════════════════════════

export const CATEGORIES = {
  'entradas': 'Entradas',
  'ensaladas': 'Ensaladas',
  'pastas': 'Pastas',
  'pizzas': 'Pizzas',
  'pizzas-especiales': 'Pizzas Especiales',
  'platos-fuertes': 'Platos Fuertes',
  'mariscos': 'Mariscos',
  'bebidas-frias': 'Bebidas Frías',
  'bebidas-calientes': 'Bebidas Calientes',
  'cervezas': 'Cervezas',
  'postres': 'Postres',
  'menu-infantil': 'Menú Infantil'
}

// All locations shorthand
const ALL: LocationId[] = ['santa-ana', 'san-benito', 'la-majada', 'lago-coatepeque']
const GARDEN_ONLY: LocationId[] = ['la-majada']
const LAKE_ONLY: LocationId[] = ['lago-coatepeque']
const GARDEN_AND_LAKE: LocationId[] = ['la-majada', 'lago-coatepeque']

// ═══════════════════════════════════════════════════════════════
// COMPLETE MENU
// ═══════════════════════════════════════════════════════════════

export const MENU: MenuItem[] = [
  // ─────────────────────────────────────────────────────────────
  // ENTRADAS
  // ─────────────────────────────────────────────────────────────
  {
    id: 'molcajete-coulotte',
    name: 'Molcajete Coulotte',
    description: 'Beef coulotte, grilled bone marrow, jalapeño, green onion, grilled onion, served with tortilla in traditional molcajete',
    price: 13.99,
    category: 'entradas',
    tags: ['🌶️ spicy', '🔥 signature'],
    bestSeller: true,
    image: '/images/menu/molcajete-coulotte.jpg',
    locations: ALL
  },
  {
    id: 'fundido-camaron-pollo',
    name: 'Fundido Camarón y Pollo',
    description: 'Shrimp and grilled chicken breast with pomodoro sauce, melted mozzarella, served with garlic bread',
    price: 7.99,
    category: 'entradas',
    locations: ALL
  },
  {
    id: 'fundido-champinones',
    name: 'Fundido de Champiñones',
    description: 'Fresh mushrooms with cheese blend, pomodoro sauce, served with garlic bread',
    price: 7.99,
    category: 'entradas',
    tags: ['🌱 veg'],
    locations: ALL
  },
  {
    id: 'fundido-filet-mignon',
    name: 'Fundido Filet Mignon',
    description: 'Premium filet mignon cuts with melted cheese blend and garlic bread',
    price: 7.99,
    category: 'entradas',
    locations: ALL
  },
  {
    id: 'cheese-balls',
    name: 'Cheese Balls',
    description: 'Crispy mixed cheese balls served with pomodoro dipping sauce',
    price: 6.99,
    category: 'entradas',
    tags: ['🌱 veg'],
    image: '/images/menu/entradas-cheese-balls.jpg',
    locations: ALL
  },
  {
    id: 'patatas-tocino',
    name: 'Patatas con Tocino',
    description: 'Crispy french fries topped with bacon, pomodoro sauce, and melted mozzarella',
    price: 5.99,
    category: 'entradas',
    locations: ALL
  },
  // Lake-only seafood starters
  {
    id: 'leche-de-tigre',
    name: 'Leche de Tigre',
    description: 'Fresh white fish and shrimp marinated in citrus with red onion, cilantro, lemon juice, served with plantain chips',
    price: 13.99,
    category: 'entradas',
    tags: ['🦐 seafood', '🌶️ spicy'],
    bestSeller: true,
    locations: LAKE_ONLY
  },
  {
    id: 'ceviche-tropical',
    name: 'Ceviche Tropical',
    description: 'Fresh fish ceviche with tropical pineapple, red onion, cilantro, served with crispy plantain chips',
    price: 13.99,
    category: 'entradas',
    tags: ['🦐 seafood'],
    bestSeller: true,
    locations: LAKE_ONLY
  },
  {
    id: 'aguachile-camaron',
    name: 'Aguachile de Camarón',
    description: 'Fresh shrimp in spicy green aguachile with cucumber, red onion, jalapeño, cilantro, garlic, plantain chips',
    price: 11.99,
    category: 'entradas',
    tags: ['🦐 seafood', '🌶️ spicy'],
    locations: LAKE_ONLY
  },

  // ─────────────────────────────────────────────────────────────
  // ENSALADAS
  // ─────────────────────────────────────────────────────────────
  {
    id: 'ensalada-gambas',
    name: 'Ensalada Gambas',
    description: 'Grilled shrimp over fresh lettuce with cherry tomatoes, carrot, cucumber, avocado, sweet corn, croutons, pink dressing',
    price: 9.99,
    category: 'ensaladas',
    tags: ['🦐 seafood'],
    locations: ALL
  },
  {
    id: 'ensalada-criolla',
    name: 'Ensalada Criolla',
    description: 'Fresh lettuce with beef tenderloin strips, avocado, mushrooms, cherry tomatoes, sweet corn, red onion, yogurt-cilantro dressing, corn chips',
    price: 8.99,
    category: 'ensaladas',
    locations: ALL
  },
  {
    id: 'ensalada-impecable',
    name: 'Ensalada Impecable',
    description: 'Grilled chicken over lettuce with apple, green apple, carrot, sweet corn, avocado, bacon, almonds, cherry tomatoes, yogurt-cilantro dressing',
    price: 9.99,
    category: 'ensaladas',
    bestSeller: true,
    locations: ALL
  },

  // ─────────────────────────────────────────────────────────────
  // PASTAS (All served with garlic toast)
  // ─────────────────────────────────────────────────────────────
  {
    id: 'fettuccine-calamardina',
    name: 'Fettuccine Calamardiña',
    description: 'Fettuccine in rich calamari sauce with jumbo shrimp, clams, squid, and mussels. Served with garlic toast',
    price: 13.00,
    category: 'pastas',
    tags: ['🦐 seafood'],
    bestSeller: true,
    locations: ALL
  },
  {
    id: 'fettuccine-mar-y-tierra',
    name: 'Fettuccine Mar y Tierra',
    description: 'Creamy alfredo fettuccine with mixed seafood and grilled chicken. Served with garlic toast',
    price: 9.99,
    category: 'pastas',
    tags: ['🦐 seafood'],
    bestSeller: true,
    image: '/images/menu/pasta-fettuccine-mar-tierra.jpg',
    locations: ALL
  },
  {
    id: 'lasagna-bolognesa',
    name: 'Lasagna Bolognesa',
    description: 'Classic layered pasta sheets with homemade bolognese sauce, mozzarella and cream cheese blend. Served with garlic toast',
    price: 9.99,
    category: 'pastas',
    locations: ALL
  },
  {
    id: 'penne-brocoli-tocino',
    name: 'Penne Brócoli Tocino',
    description: 'Penne pasta with crispy bacon, fresh broccoli, grilled chicken, creamy alfredo sauce, mozzarella gratin. Served with garlic toast',
    price: 7.99,
    category: 'pastas',
    image: '/images/menu/pasta-penne-brocoli-tocino.jpg',
    locations: ALL
  },

  // ─────────────────────────────────────────────────────────────
  // PIZZAS CLÁSICAS (Personal $5.75 / Large $14.99)
  // ─────────────────────────────────────────────────────────────
  {
    id: 'pizza-fungi',
    name: 'Pizza Fungi',
    description: 'Fresh mushrooms, caramelized onions, house chimichurri sauce',
    price: 14.99,
    pricePersonal: 5.75,
    category: 'pizzas',
    tags: ['🌱 veg'],
    locations: ALL
  },
  {
    id: 'pizza-con-pina',
    name: 'Pizza Con Piña',
    description: 'Pepperoni, crispy bacon, tropical pineapple, basil pesto drizzle',
    price: 14.99,
    pricePersonal: 5.75,
    category: 'pizzas',
    locations: ALL
  },
  {
    id: 'pizza-maradona',
    name: 'Pizza Maradona',
    description: 'Argentine chorizo, green olives, roasted peppers, caramelized onions, house chimichurri',
    price: 14.99,
    pricePersonal: 5.75,
    category: 'pizzas',
    tags: ['🔥 signature'],
    bestSeller: true,
    image: '/images/menu/pizza-maradona.jpg',
    locations: ALL
  },
  {
    id: 'pizza-brazuca',
    name: 'Pizza Brazuca',
    description: 'Tropical pineapple, savory salami, spicy jalapeños - Brazilian style',
    price: 14.99,
    pricePersonal: 5.75,
    category: 'pizzas',
    tags: ['🌶️ spicy'],
    locations: ALL
  },
  {
    id: 'pizza-vegetariana',
    name: 'Pizza Vegetariana',
    description: 'Fresh bell peppers, onions, tomatoes, mushrooms, shredded carrot',
    price: 14.99,
    pricePersonal: 5.75,
    category: 'pizzas',
    tags: ['🌱 veg'],
    locations: ALL
  },
  {
    id: 'pizza-picolo',
    name: 'Pizza Picolo',
    description: 'Grilled chicken, creamy garlic sauce, fresh cilantro',
    price: 14.99,
    pricePersonal: 5.75,
    category: 'pizzas',
    locations: ALL
  },
  {
    id: 'pizza-jamon-pepperoni',
    name: 'Pizza Jamón o Pepperoni',
    description: 'Classic pizza with your choice of ham or pepperoni',
    price: 14.99,
    pricePersonal: 5.75,
    category: 'pizzas',
    locations: ALL
  },
  {
    id: 'pizza-margherita',
    name: 'Pizza Margherita',
    description: 'Fresh cherry tomatoes, aromatic basil, mozzarella - classic Italian',
    price: 14.99,
    pricePersonal: 5.75,
    category: 'pizzas',
    tags: ['🌱 veg'],
    locations: ALL
  },
  {
    id: 'pizza-hawaiana',
    name: 'Pizza Hawaiana',
    description: 'Ham, tropical pineapple, roasted peppers, mozzarella and cheddar blend',
    price: 14.99,
    pricePersonal: 5.75,
    category: 'pizzas',
    locations: ALL
  },
  {
    id: 'pizza-verde-mella',
    name: 'Pizza Verde Mella',
    description: 'Apple fajitas, fresh green apple slices, sliced almonds, fresh mint',
    price: 14.99,
    pricePersonal: 5.75,
    category: 'pizzas',
    tags: ['🌱 veg'],
    locations: ALL
  },
  {
    id: 'pizza-loroka',
    name: 'Pizza La Loroka',
    description: 'Crispy bacon and pepperoni - double the meat, double the flavor',
    price: 14.99,
    pricePersonal: 5.75,
    category: 'pizzas',
    bestSeller: true,
    locations: ALL
  },
  {
    id: 'pizza-cuatro-quesos',
    name: 'Pizza Cuatro Quesos',
    description: 'Four cheese blend: mozzarella, parmesan, cream cheese, fresh basil',
    price: 14.99,
    pricePersonal: 5.75,
    category: 'pizzas',
    tags: ['🌱 veg'],
    locations: ALL
  },

  // ─────────────────────────────────────────────────────────────
  // PIZZAS ESPECIALES (Personal $6.25 / Large $17.99)
  // ─────────────────────────────────────────────────────────────
  {
    id: 'pizza-castellana',
    name: 'Pizza La Castellana',
    description: 'Premium salami di Pamplona with authentic Iberian chorizo',
    price: 17.99,
    pricePersonal: 6.25,
    category: 'pizzas-especiales',
    tags: ['🔥 premium'],
    locations: ALL
  },
  {
    id: 'pizza-prosciutto',
    name: 'Pizza Prosciutto',
    description: 'Sun-dried tomatoes, Italian prosciutto, basil pesto drizzle',
    price: 17.99,
    pricePersonal: 6.25,
    category: 'pizzas-especiales',
    tags: ['🔥 premium'],
    locations: ALL
  },
  {
    id: 'pizza-ghiottone',
    name: 'Pizza Ghiottone',
    description: 'The ultimate loaded pizza: peppers, onions, tomato, salami, ham, pepperoni, chorizo, black olives, mushrooms',
    price: 17.99,
    pricePersonal: 6.25,
    category: 'pizzas-especiales',
    bestSeller: true,
    locations: ALL
  },
  {
    id: 'pizza-memoravel',
    name: 'Pizza La Memoravel',
    description: 'Beef and chicken fajitas, marinated onion, sweet corn, BBQ sauce, toasted sesame',
    price: 17.99,
    pricePersonal: 6.25,
    category: 'pizzas-especiales',
    bestSeller: true,
    image: '/images/menu/pizza-memoravel.jpg',
    locations: ALL
  },
  {
    id: 'pizza-don-cangrejo',
    name: 'Pizza Don Cangrejo',
    description: 'Fresh shrimp, clams, green peppers with a touch of capers',
    price: 17.99,
    pricePersonal: 6.25,
    category: 'pizzas-especiales',
    tags: ['🦐 seafood'],
    locations: ALL
  },
  {
    id: 'pizza-pescatore',
    name: 'Pizza La Pescatore',
    description: 'Seafood lovers dream: squid, clams, shrimp, red onion, roasted peppers',
    price: 17.99,
    pricePersonal: 6.25,
    category: 'pizzas-especiales',
    tags: ['🦐 seafood'],
    locations: ALL
  },
  {
    id: 'pizza-punta-jalapena',
    name: 'Pizza Punta Jalapeña',
    description: 'Beef tenderloin strips, melted mozzarella, fresh cilantro, spicy jalapeño sauce',
    price: 17.99,
    pricePersonal: 6.25,
    category: 'pizzas-especiales',
    tags: ['🌶️ spicy'],
    locations: ALL
  },
  {
    id: 'pizza-campesina',
    name: 'Pizza La Campesina',
    description: 'Rustic beef fajitas, Iberian chorizo, refried beans, fresh guacamole, pickled onion',
    price: 17.99,
    pricePersonal: 6.25,
    category: 'pizzas-especiales',
    locations: ALL
  },
  {
    id: 'pizza-gamberetti',
    name: 'Pizza Gamberetti',
    description: 'Succulent shrimp, tropical pineapple, creamy alfredo, basil pesto',
    price: 17.99,
    pricePersonal: 6.25,
    category: 'pizzas-especiales',
    tags: ['🦐 seafood'],
    locations: ALL
  },

  // ─────────────────────────────────────────────────────────────
  // PLATOS FUERTES (Main Dishes)
  // ─────────────────────────────────────────────────────────────
  {
    id: 'terramar-al-maitre',
    name: 'Terramar al Maître',
    description: 'Surf & turf excellence: premium beef tenderloin with jumbo shrimp, golden potato rounds, seasonal vegetables, signature maître butter',
    price: 19.99,
    category: 'platos-fuertes',
    tags: ['🦐 seafood', '🔥 signature'],
    bestSeller: true,
    image: '/images/menu/terramar-maitre.jpg',
    locations: ALL,
    locationPrices: { 'lago-coatepeque': 22.50 }
  },
  {
    id: 'medallon-lomito-maitre',
    name: 'Medallón de Lomito al Maître',
    description: 'New York-style steak medallion wrapped in bacon, sautéed mushrooms, cherry tomatoes, signature maître butter - BEST SELLER #1',
    price: 17.75,
    category: 'platos-fuertes',
    tags: ['🔥 signature', '⭐ #1'],
    bestSeller: true,
    image: '/images/menu/medallon-lomito-maitre.jpg',
    locations: ALL,
    locationPrices: { 'lago-coatepeque': 19.99 }
  },
  {
    id: 'pechuga-capresse',
    name: 'Pechuga Capresse',
    description: 'Tender chicken breast stuffed with mozzarella, sun-dried tomatoes, basil pesto, served with creamy mashed potatoes and seasonal vegetables',
    price: 14.99,
    category: 'platos-fuertes',
    locations: ALL
  },
  {
    id: 'hamburguesa-casanova',
    name: 'Hamburguesa Casanova',
    description: 'Double beef patty tower with crispy bacon, sautéed mushrooms, red onion, melted mozzarella, served with golden fries',
    price: 11.99,
    category: 'platos-fuertes',
    bestSeller: true,
    locations: GARDEN_AND_LAKE,
    locationPrices: { 'lago-coatepeque': 12.50 }
  },
  // Lake-only main dishes
  {
    id: 'pescado-parrilla',
    name: 'Pescado a la Parrilla',
    description: 'Whole fresh fish grilled to perfection, house chimichurri, golden fries, pickled onion - lakeside specialty',
    price: 22.50,
    category: 'platos-fuertes',
    tags: ['🦐 seafood', '🔥 signature'],
    bestSeller: true,
    locations: LAKE_ONLY
  },
  {
    id: 'mariscada',
    name: 'Mariscada',
    description: 'Rich coconut broth seafood soup loaded with shrimp, clams, squid, mussels, and fresh fish - WEEKEND SPECIAL',
    price: 17.99,
    category: 'mariscos',
    tags: ['🦐 seafood', '🔥 signature', '📅 weekend'],
    bestSeller: true,
    locations: LAKE_ONLY
  },

  // ─────────────────────────────────────────────────────────────
  // BEBIDAS FRÍAS
  // ─────────────────────────────────────────────────────────────
  {
    id: 'frozen',
    name: 'Frozen',
    description: 'Refreshing frozen drinks: Coconut, Pineapple, Strawberry, Mint, Passion Fruit, Watermelon, or "Positive Vibration" mix',
    price: 3.75,
    category: 'bebidas-frias',
    image: '/images/menu/frozen-positive.jpg',
    locations: ALL
  },
  {
    id: 'limonadas',
    name: 'Limonadas',
    description: 'Fresh lemonades: Passion Fruit, Strawberry, Mint, or Traditional',
    price: 3.25,
    category: 'bebidas-frias',
    locations: ALL
  },
  {
    id: 'refrescos-naturales',
    name: 'Refrescos Naturales',
    description: 'Natural fruit drinks: Pineapple & Carrot or Fresh Orange',
    price: 3.50,
    category: 'bebidas-frias',
    locations: ALL
  },
  {
    id: 'aguas-frescas',
    name: 'Aguas Frescas',
    description: 'Traditional drinks: Tamarind, Horchata, or Peach Tea',
    price: 2.95,
    category: 'bebidas-frias',
    locations: ALL
  },
  {
    id: 'agua',
    name: 'Agua',
    description: 'Bottled water 600ml',
    price: 1.99,
    category: 'bebidas-frias',
    locations: ALL
  },
  {
    id: 'sodas',
    name: 'Sodas',
    description: 'Assorted soft drinks',
    price: 1.99,
    category: 'bebidas-frias',
    locations: ALL
  },

  // ─────────────────────────────────────────────────────────────
  // BEBIDAS CALIENTES
  // ─────────────────────────────────────────────────────────────
  {
    id: 'cappuccino',
    name: 'Cappuccino',
    description: 'Classic Italian cappuccino with steamed milk foam',
    price: 2.99,
    category: 'bebidas-calientes',
    locations: ALL
  },
  {
    id: 'latte',
    name: 'Latte',
    description: 'Smooth espresso with steamed milk',
    price: 2.99,
    category: 'bebidas-calientes',
    locations: ALL
  },
  {
    id: 'vanilla-latte',
    name: 'Vanilla Latte',
    description: 'Espresso with steamed milk and vanilla syrup',
    price: 2.99,
    category: 'bebidas-calientes',
    locations: ALL
  },
  {
    id: 'mocaccino',
    name: 'Mocaccino',
    description: 'Espresso with chocolate and steamed milk',
    price: 2.99,
    category: 'bebidas-calientes',
    locations: ALL
  },
  {
    id: 'chocolate-caliente',
    name: 'Chocolate Caliente',
    description: 'Rich hot chocolate',
    price: 2.99,
    category: 'bebidas-calientes',
    locations: ALL
  },
  {
    id: 'americano',
    name: 'Café Americano',
    description: 'Espresso with hot water - classic strength',
    price: 1.50,
    category: 'bebidas-calientes',
    locations: ALL
  },
  // Garden-only coffee additions
  {
    id: 'affogato',
    name: 'Affogato',
    description: 'Vanilla ice cream drowned in hot espresso - Italian dessert coffee',
    price: 3.50,
    category: 'bebidas-calientes',
    tags: ['🔥 signature'],
    bestSeller: true,
    locations: GARDEN_ONLY
  },
  {
    id: 'iced-orange-coffee',
    name: 'Iced Orange Coffee',
    description: 'Cold espresso with fresh orange juice and ice - refreshingly unique',
    price: 3.50,
    category: 'bebidas-calientes',
    tags: ['🔥 signature'],
    locations: GARDEN_ONLY
  },

  // ─────────────────────────────────────────────────────────────
  // CERVEZAS
  // ─────────────────────────────────────────────────────────────
  {
    id: 'puente-quemado',
    name: 'Puente Quemado',
    description: 'Premium local Salvadoran craft beer',
    price: 5.00,
    category: 'cervezas',
    tags: ['🍺 local', '🔥 craft'],
    bestSeller: true,
    locations: ALL
  },
  {
    id: 'regia-chola',
    name: 'Regia Chola',
    description: 'Local Salvadoran beer',
    price: 4.25,
    category: 'cervezas',
    tags: ['🍺 local'],
    locations: ALL
  },
  {
    id: 'suprema',
    name: 'Suprema',
    description: 'Classic Salvadoran lager',
    price: 2.50,
    category: 'cervezas',
    tags: ['🍺 local'],
    locations: ALL
  },
  {
    id: 'pilsener',
    name: 'Pilsener',
    description: 'Pilsener Salvadoreña',
    price: 2.25,
    category: 'cervezas',
    tags: ['🍺 local'],
    locations: ALL
  },
  {
    id: 'golden',
    name: 'Golden',
    description: 'Golden beer',
    price: 2.25,
    category: 'cervezas',
    tags: ['🍺 local'],
    locations: ALL
  },
  {
    id: 'corona',
    name: 'Corona',
    description: 'Mexican Corona Extra',
    price: 3.50,
    category: 'cervezas',
    tags: ['🍺 import'],
    locations: ALL
  },
  {
    id: 'heineken',
    name: 'Heineken',
    description: 'Dutch Heineken lager',
    price: 3.50,
    category: 'cervezas',
    tags: ['🍺 import'],
    locations: ALL
  },
  {
    id: 'miller-draft',
    name: 'Miller Draft',
    description: 'American Miller Genuine Draft',
    price: 3.50,
    category: 'cervezas',
    tags: ['🍺 import'],
    locations: ALL
  },
  {
    id: 'modelo',
    name: 'Modelo',
    description: 'Mexican Modelo Especial',
    price: 3.50,
    category: 'cervezas',
    tags: ['🍺 import'],
    locations: ALL
  },
  {
    id: 'blue-moon',
    name: 'Blue Moon',
    description: 'Belgian-style wheat ale',
    price: 3.50,
    category: 'cervezas',
    tags: ['🍺 import', '🔥 craft'],
    locations: ALL
  },
  {
    id: 'stella-artois',
    name: 'Stella Artois',
    description: 'Belgian pilsner',
    price: 3.50,
    category: 'cervezas',
    tags: ['🍺 import'],
    locations: ALL
  },
  {
    id: 'michelob-ultra',
    name: 'Michelob Ultra',
    description: 'Light American lager',
    price: 3.50,
    category: 'cervezas',
    tags: ['🍺 import'],
    locations: ALL
  },
  {
    id: 'michelada-tradicional',
    name: 'Michelada Tradicional',
    description: 'Traditional michelada with lime, salt, and spices',
    price: 1.50,
    category: 'cervezas',
    bestSeller: true,
    image: '/images/menu/michelada.jpg',
    locations: ALL
  },
  {
    id: 'smirnoff-ice',
    name: 'Smirnoff Ice',
    description: 'Smirnoff Ice malt beverage',
    price: 3.75,
    category: 'cervezas',
    locations: ALL
  },

  // ─────────────────────────────────────────────────────────────
  // POSTRES
  // ─────────────────────────────────────────────────────────────
  {
    id: 'ganache-chocolate',
    name: 'Ganache de Chocolate',
    description: 'Rich chocolate ganache dessert',
    price: 3.99,
    category: 'postres',
    tags: ['🌱 veg'],
    locations: ALL
  },
  {
    id: 'brownie-helado',
    name: 'Brownie con Helado',
    description: 'Warm chocolate brownie topped with vanilla ice cream and chocolate drizzle',
    price: 3.99,
    category: 'postres',
    tags: ['🌱 veg'],
    bestSeller: true,
    image: '/images/menu/brownie-helado.jpg',
    locations: ALL
  },
  {
    id: 'cheesecake-fresa',
    name: 'Cheesecake de Fresa',
    description: 'Creamy New York-style cheesecake with fresh strawberry topping',
    price: 3.99,
    category: 'postres',
    tags: ['🌱 veg'],
    locations: ALL
  },
  {
    id: 'panna-cotta',
    name: 'Panna Cotta',
    description: 'Italian cream dessert with your choice: Red Fruits, Passion Fruit, or Strawberry - TOP #1 DESSERT',
    price: 3.99,
    image: '/images/menu/panna-cotta.jpg',
    category: 'postres',
    tags: ['🌱 veg', '⭐ #1'],
    bestSeller: true,
    locations: ALL
  },

  // ─────────────────────────────────────────────────────────────
  // MENÚ INFANTIL (Kids Menu)
  // ─────────────────────────────────────────────────────────────
  {
    id: 'chunks-pollo',
    name: 'Chunks de Pollo',
    description: 'Crispy breaded chicken breast pieces served with french fries and iced tea',
    price: 5.99,
    category: 'menu-infantil',
    tags: ['👶 kids'],
    locations: ALL
  },
  {
    id: 'cangreburger',
    name: 'Cangreburger',
    description: 'Kid-sized chicken burger served with french fries and iced tea',
    price: 5.50,
    category: 'menu-infantil',
    tags: ['👶 kids'],
    locations: ALL
  }
]

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

export function getMenuByLocation(locationId: LocationId): MenuItem[] {
  return MENU.filter(item => item.locations.includes(locationId))
}

export function getMenuByCategory(category: string, locationId?: LocationId): MenuItem[] {
  let items = MENU.filter(item => item.category === category)
  if (locationId) {
    items = items.filter(item => item.locations.includes(locationId))
  }
  return items
}

export function getBestSellers(locationId?: LocationId): MenuItem[] {
  let items = MENU.filter(item => item.bestSeller)
  if (locationId) {
    items = items.filter(item => item.locations.includes(locationId))
  }
  return items
}

export function searchMenu(query: string, locationId?: LocationId): MenuItem[] {
  const lowerQuery = query.toLowerCase()
  let items = MENU.filter(item =>
    item.name.toLowerCase().includes(lowerQuery) ||
    item.description.toLowerCase().includes(lowerQuery)
  )
  if (locationId) {
    items = items.filter(item => item.locations.includes(locationId))
  }
  return items
}

export function getVegetarianItems(locationId?: LocationId): MenuItem[] {
  let items = MENU.filter(item => item.tags?.some(tag => tag.includes('veg')))
  if (locationId) {
    items = items.filter(item => item.locations.includes(locationId))
  }
  return items
}

export function getSeafoodItems(locationId?: LocationId): MenuItem[] {
  let items = MENU.filter(item => item.tags?.some(tag => tag.includes('seafood')))
  if (locationId) {
    items = items.filter(item => item.locations.includes(locationId))
  }
  return items
}

export function getItemPrice(item: MenuItem, locationId?: LocationId): number {
  if (locationId && item.locationPrices?.[locationId]) {
    return item.locationPrices[locationId]!
  }
  return item.price
}

export function formatPrice(item: MenuItem, locationId?: LocationId): string {
  const price = getItemPrice(item, locationId)
  if (item.pricePersonal) {
    return `Personal $${item.pricePersonal.toFixed(2)} / Large $${price.toFixed(2)}`
  }
  return `$${price.toFixed(2)}`
}

export function getKidsMenu(locationId?: LocationId): MenuItem[] {
  return getMenuByCategory('menu-infantil', locationId)
}

export function getLocationExclusives(locationId: LocationId): MenuItem[] {
  return MENU.filter(item =>
    item.locations.length === 1 && item.locations.includes(locationId)
  )
}

// Stats
export function getMenuStats(locationId?: LocationId) {
  const items = locationId ? getMenuByLocation(locationId) : MENU
  return {
    total: items.length,
    categories: [...new Set(items.map(i => i.category))].length,
    bestSellers: items.filter(i => i.bestSeller).length,
    vegetarian: items.filter(i => i.tags?.some(t => t.includes('veg'))).length,
    seafood: items.filter(i => i.tags?.some(t => t.includes('seafood'))).length
  }
}
