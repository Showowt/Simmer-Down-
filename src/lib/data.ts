// ============================================
// SIMMER DOWN - Complete Data Layer
// All types, locations, menu items, and utilities
// ============================================

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface Location {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  address: string;
  city: string;
  phone: string;
  whatsapp: string;
  email: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  hours: {
    weekday: string;
    weekend: string;
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
  features: string[];
  image: string;
  heroImage: string;
  menuPdfEs: string;
  menuPdfEn: string;
  isOpen?: boolean;
}

export interface MenuCategory {
  id: string;
  name: string;
  nameEs: string;
  description?: string;
  descriptionEs?: string;
  icon: string;
  sortOrder: number;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  nameEs: string;
  description?: string;
  descriptionEs?: string;
  basePrice: number;
  image?: string;
  isAvailable: boolean;
  isFeatured: boolean;
  isVegetarian: boolean;
  isSpicy: boolean;
  isGlutenFree: boolean;
  isNew: boolean;
  sizes?: MenuItemSize[];
  modifiers?: MenuItemModifier[];
}

export interface MenuItemSize {
  id: string;
  name: string;
  nameEs: string;
  priceModifier: number;
}

export interface MenuItemModifier {
  id: string;
  name: string;
  nameEs: string;
  price: number;
  category: 'topping' | 'sauce' | 'extra';
}

export interface CartItem extends MenuItem {
  quantity: number;
  selectedSize?: MenuItemSize;
  selectedModifiers?: MenuItemModifier[];
  notes?: string;
  totalPrice: number;
}

export interface OrderDetails {
  items: CartItem[];
  location: Location;
  customerName?: string;
  customerPhone?: string;
  orderType: 'dine_in' | 'takeout' | 'delivery';
  notes?: string;
  subtotal: number;
  tax: number;
  total: number;
}

export interface ReservationDetails {
  location: Location;
  date: string;
  time: string;
  partySize: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  occasion?: string;
  specialRequests?: string;
}

// ============================================
// CONSTANTS
// ============================================

const TAX_RATE = 0.13;
// ORDER_WHATSAPP removed — unused (whatsapp-order.ts defines its own)

// ============================================
// LOCATIONS DATA
// ============================================

export const LOCATIONS: Location[] = [
  {
    id: 'santa-ana',
    slug: 'santa-ana',
    name: 'Simmer Down Santa Ana',
    shortName: 'Santa Ana',
    address: '1ra Calle Pte y Callejuela Sur Catedral',
    city: 'Santa Ana',
    phone: '+503 2445-5999',
    whatsapp: '+50375764655',
    email: 'santaana@simmerdown.sv',
    coordinates: { lat: 13.9942, lng: -89.5597 },
    hours: {
      weekday: '11:00 AM - 9:00 PM',
      weekend: '11:00 AM - 10:00 PM',
      monday: '11:00 AM - 9:00 PM',
      tuesday: '11:00 AM - 9:00 PM',
      wednesday: '11:00 AM - 9:00 PM',
      thursday: '11:00 AM - 9:00 PM',
      friday: '11:00 AM - 10:00 PM',
      saturday: '11:00 AM - 10:00 PM',
      sunday: '11:00 AM - 9:00 PM',
    },
    features: ['dine-in', 'takeout', 'delivery', 'outdoor-seating', 'wifi', 'parking'],
    image: '/images/locations/gallery-santa-ana/santa-ana-interior-2.jpg',
    heroImage: '/images/locations/gallery-santa-ana/santa-ana-awards.jpg',
    menuPdfEs: '1rcqsVH-n4goxYO4zAj0_WQTLl1RilIM9',
    menuPdfEn: '1pg46Ez52QEpoxBOd4q2yzGcfjLP6bfq1',
  },
  {
    id: 'lago-coatepeque',
    slug: 'lago-coatepeque',
    name: 'Simmer Down Lago Coatepeque',
    shortName: 'Lago Coatepeque',
    address: 'Calle Principal al Lago #119',
    city: 'Coatepeque',
    phone: '+503 6831-6907',
    whatsapp: '+50375764655',
    email: 'lago@simmerdown.sv',
    coordinates: { lat: 13.8667, lng: -89.5500 },
    hours: {
      weekday: '11:00 AM - 8:00 PM',
      weekend: '11:00 AM - 9:00 PM',
      monday: '11:00 AM - 8:00 PM',
      tuesday: '11:00 AM - 8:00 PM',
      wednesday: '11:00 AM - 8:00 PM',
      thursday: '11:00 AM - 8:00 PM',
      friday: '11:00 AM - 9:00 PM',
      saturday: '11:00 AM - 9:00 PM',
      sunday: '11:00 AM - 8:00 PM',
    },
    features: ['dine-in', 'takeout', 'lake-view', 'outdoor-seating', 'parking'],
    image: '/images/locations/gallery-coatepeque/coatepeque-2.jpg',
    heroImage: '/images/locations/coatepeque-dock-wide.jpg',
    menuPdfEs: '1Q-otXuIK-JR-brDPPOMIb2jCKXj6LDQP',
    menuPdfEn: '1Q-otXuIK-JR-brDPPOMIb2jCKXj6LDQP',
  },
  {
    id: 'san-benito',
    slug: 'san-benito',
    name: 'Simmer Down San Benito',
    shortName: 'San Benito',
    address: 'Boulevard del Hipódromo',
    city: 'San Salvador',
    phone: '+503 7487-7792',
    whatsapp: '+50375764655',
    email: 'sanbenito@simmerdown.sv',
    coordinates: { lat: 13.6929, lng: -89.2365 },
    hours: {
      weekday: '12:00 PM - 9:00 PM',
      weekend: '12:00 PM - 11:00 PM',
      monday: '12:00 PM - 2:30 PM',
      tuesday: '12:00 PM - 2:30 PM',
      wednesday: '12:00 PM - 2:30 PM',
      thursday: '12:00 PM - 10:00 PM',
      friday: '12:00 PM - 11:00 PM',
      saturday: '12:00 PM - 11:00 PM',
      sunday: '12:00 PM - 11:00 PM',
    },
    features: ['dine-in', 'takeout', 'delivery', 'bar', 'valet-parking', 'wifi'],
    image: '/images/locations/gallery-san-benito/san-benito-1.jpg',
    heroImage: '/images/locations/gallery-san-benito/san-benito-2.jpg',
    menuPdfEs: '1pgA_zoxDrxV3rjK-iWtt852T5qta5KrB',
    menuPdfEn: '1A-IrNdJrm1GVhJ-lDMMQkDUjNLHHtf_N',
  },
  {
    id: 'surf-city',
    slug: 'surf-city',
    name: 'Simmer Down Surf City',
    shortName: 'Surf City',
    address: 'Hotel Casa Santa Emilia',
    city: 'La Libertad',
    phone: '+503 7576-4655',
    whatsapp: '+50375764655',
    email: 'surfcity@simmerdown.sv',
    coordinates: { lat: 13.4833, lng: -89.3333 },
    hours: {
      weekday: '12:00 PM - 8:00 PM',
      weekend: '12:00 PM - 8:00 PM',
      monday: 'Cerrado',
      tuesday: 'Cerrado',
      wednesday: '12:00 PM - 8:00 PM',
      thursday: '12:00 PM - 8:00 PM',
      friday: '12:00 PM - 8:00 PM',
      saturday: '12:00 PM - 8:00 PM',
      sunday: '12:00 PM - 8:00 PM',
    },
    features: ['dine-in', 'takeout', 'beach-view', 'outdoor-seating', 'surf-parking'],
    image: '/images/locations/surf-city-exterior.jpg',
    heroImage: '/images/heroes/surf-city-dusk.jpg',
    menuPdfEs: '1ulsAcD2CDI_YwbhOQxDB4C_vLAQKWOyN',
    menuPdfEn: '1ulsAcD2CDI_YwbhOQxDB4C_vLAQKWOyN',
  },
  {
    id: 'simmer-garden',
    slug: 'simmer-garden',
    name: 'Simmer Garden',
    shortName: 'Simmer Garden',
    address: 'Kilómetro 91.5, San José La Majada',
    city: 'Juayúa, Sonsonate',
    phone: '+503 6990-4674',
    whatsapp: '+50375764655',
    email: 'garden@simmerdown.sv',
    coordinates: { lat: 13.8467, lng: -89.7456 },
    hours: {
      weekday: 'Cerrado',
      weekend: '11:00 AM - 8:30 PM',
      monday: 'Cerrado',
      tuesday: 'Cerrado',
      wednesday: 'Cerrado',
      thursday: 'Cerrado',
      friday: '11:00 AM - 8:30 PM',
      saturday: '11:00 AM - 8:30 PM',
      sunday: '11:00 AM - 8:30 PM',
    },
    features: ['dine-in', 'takeout', 'garden-seating', 'live-music-weekends', 'parking', 'pet-friendly'],
    image: '/images/locations/gallery-garden/garden-4.jpg',
    heroImage: '/images/locations/simmer-garden-hero.jpg',
    menuPdfEs: '1rcqsVH-n4goxYO4zAj0_WQTLl1RilIM9',
    menuPdfEn: '1pg46Ez52QEpoxBOd4q2yzGcfjLP6bfq1',
  },
];

// ============================================
// MENU CATEGORIES
// ============================================

export const MENU_CATEGORIES: MenuCategory[] = [
  { id: 'pizzas', name: 'Pizzas', nameEs: 'Pizzas', icon: '🍕', sortOrder: 1, description: 'Artisan sourdough pizzas', descriptionEs: 'Pizzas artesanales de masa madre' },
  { id: 'specialty-pizzas', name: 'Specialty Pizzas', nameEs: 'Pizzas Especiales', icon: '⭐', sortOrder: 2, description: 'Premium gourmet creations', descriptionEs: 'Creaciones gourmet premium' },
  { id: 'starters', name: 'Starters', nameEs: 'Entradas', icon: '🥗', sortOrder: 3 },
  { id: 'salads', name: 'Salads', nameEs: 'Ensaladas', icon: '🥬', sortOrder: 4 },
  { id: 'pastas', name: 'Pasta', nameEs: 'Pastas', icon: '🍝', sortOrder: 5 },
  { id: 'mains', name: 'Main Dishes', nameEs: 'Platos Fuertes', icon: '🍖', sortOrder: 6 },
  { id: 'kids', name: 'Kids Menu', nameEs: 'Menú Infantil', icon: '👶', sortOrder: 7 },
  { id: 'desserts', name: 'Desserts', nameEs: 'Postres', icon: '🍰', sortOrder: 8 },
  { id: 'drinks', name: 'Drinks', nameEs: 'Bebidas', icon: '🍹', sortOrder: 9 },
];

// ============================================
// PIZZA SIZES & MODIFIERS
// ============================================

const PIZZA_SIZES: MenuItemSize[] = [
  { id: 'personal', name: 'Personal (8")', nameEs: 'Personal (8")', priceModifier: 0 },
  { id: 'medium', name: 'Medium (12")', nameEs: 'Mediana (12")', priceModifier: 4.00 },
  { id: 'large', name: 'Large (16")', nameEs: 'Grande (16")', priceModifier: 8.00 },
  { id: 'family', name: 'Family (20")', nameEs: 'Familiar (20")', priceModifier: 14.00 },
];

export const PIZZA_MODIFIERS: MenuItemModifier[] = [
  { id: 'extra-cheese', name: 'Extra Cheese', nameEs: 'Queso Extra', price: 1.50, category: 'topping' },
  { id: 'pepperoni', name: 'Pepperoni', nameEs: 'Pepperoni', price: 1.50, category: 'topping' },
  { id: 'mushrooms', name: 'Mushrooms', nameEs: 'Hongos', price: 1.00, category: 'topping' },
  { id: 'bacon', name: 'Bacon', nameEs: 'Tocino', price: 1.50, category: 'topping' },
  { id: 'jalapenos', name: 'Jalapeños', nameEs: 'Jalapeños', price: 0.75, category: 'topping' },
  { id: 'olives', name: 'Olives', nameEs: 'Aceitunas', price: 0.75, category: 'topping' },
  { id: 'shrimp', name: 'Shrimp', nameEs: 'Camarones', price: 2.50, category: 'topping' },
  { id: 'bbq-sauce', name: 'BBQ Sauce', nameEs: 'Salsa BBQ', price: 0.50, category: 'sauce' },
  { id: 'garlic-sauce', name: 'Garlic Sauce', nameEs: 'Salsa de Ajo', price: 0.50, category: 'sauce' },
  { id: 'hot-sauce', name: 'Hot Sauce', nameEs: 'Salsa Picante', price: 0.50, category: 'sauce' },
  { id: 'stuffed-crust', name: 'Stuffed Crust', nameEs: 'Orilla Rellena', price: 2.00, category: 'extra' },
  { id: 'gluten-free-base', name: 'Gluten-Free Base', nameEs: 'Base Sin Gluten', price: 3.00, category: 'extra' },
];

// ============================================
// MENU ITEMS
// ============================================

export const MENU_ITEMS: MenuItem[] = [
  // PIZZAS
  { id: 'fungi', categoryId: 'pizzas', name: 'Fungi', nameEs: 'Fungi', description: 'Vegetarian Pizza with Onions and Mushrooms in Chimichurri Sauce', descriptionEs: 'Pizza Vegetariana con Cebollas y Hongos en Salsa Chimichurri', basePrice: 5.75, isAvailable: true, isFeatured: false, isVegetarian: true, isSpicy: false, isGlutenFree: false, isNew: false, sizes: PIZZA_SIZES, modifiers: PIZZA_MODIFIERS },
  { id: 'pineapple-pizza', categoryId: 'pizzas', name: 'With Pineapple', nameEs: 'Con Piña', description: 'Pizza with Pineapple, Pepperoni, Bacon and House Basil Pesto', descriptionEs: 'Pizza con Piña, Pepperoni, Tocino y Pesto de Albahaca de la Casa', basePrice: 5.75, isAvailable: true, isFeatured: false, isVegetarian: false, isSpicy: false, isGlutenFree: false, isNew: false, sizes: PIZZA_SIZES, modifiers: PIZZA_MODIFIERS },
  { id: 'maradona', categoryId: 'pizzas', name: 'Maradona', nameEs: 'Maradona', description: 'A Tribute to a Legend! Top-Tier Argentinian Chorizo, Green Peppers, Onions', descriptionEs: '¡Un Tributo a una Leyenda! Chorizo Argentino de Primera, Pimientos Verdes, Cebollas', basePrice: 5.75, image: '/images/menu/pizza-maradona.jpg', isAvailable: true, isFeatured: true, isVegetarian: false, isSpicy: false, isGlutenFree: false, isNew: false, sizes: PIZZA_SIZES, modifiers: PIZZA_MODIFIERS },
  { id: 'brazuca', categoryId: 'pizzas', name: 'Brazuca', nameEs: 'Brazuca', description: 'Pineapple and salami with golden sauce and jalapeños', descriptionEs: 'Piña y salami con salsa dorada del chef y jalapeños', basePrice: 5.75, isAvailable: true, isFeatured: false, isVegetarian: false, isSpicy: true, isGlutenFree: false, isNew: false, sizes: PIZZA_SIZES, modifiers: PIZZA_MODIFIERS },
  { id: 'vegetarian', categoryId: 'pizzas', name: 'Vegetarian', nameEs: 'Vegetariana', description: 'Green Peppers, Onion, Tomatoes, Mushrooms, Carrot Slices and Broccoli', descriptionEs: 'Pimientos Verdes, Cebolla, Tomates, Hongos, Rodajas de Zanahoria y Brócoli', basePrice: 5.75, isAvailable: true, isFeatured: false, isVegetarian: true, isSpicy: false, isGlutenFree: false, isNew: false, sizes: PIZZA_SIZES, modifiers: PIZZA_MODIFIERS },
  { id: 'picollo', categoryId: 'pizzas', name: 'Picollo', nameEs: 'Picollo', description: 'Grilled Chicken Breast, Mozzarella, Garlic Sauce and fresh Cilantro', descriptionEs: 'Pechuga de Pollo a la Parrilla, Mozzarella, Salsa de Ajo y Cilantro fresco', basePrice: 5.75, image: '/images/menu/pro-picollo.jpg', isAvailable: true, isFeatured: true, isVegetarian: false, isSpicy: false, isGlutenFree: false, isNew: false, sizes: PIZZA_SIZES, modifiers: PIZZA_MODIFIERS },
  { id: 'ham-pepperoni', categoryId: 'pizzas', name: 'Ham or Pepperoni', nameEs: 'Jamón o Pepperoni', description: 'Traditional Ham or Pepperoni Pizza', descriptionEs: 'Pizza Tradicional de Jamón o Pepperoni', basePrice: 5.75, image: '/images/menu/pro-IMG4632.jpg', isAvailable: true, isFeatured: false, isVegetarian: false, isSpicy: false, isGlutenFree: false, isNew: false, sizes: PIZZA_SIZES, modifiers: PIZZA_MODIFIERS },
  { id: 'margherita', categoryId: 'pizzas', name: 'Margherita', nameEs: 'Margherita', description: 'Mozzarella, Marinated Cherry Tomatoes and Fresh Basil', descriptionEs: 'Mozzarella, Tomates Cherry Marinados y Albahaca Fresca', basePrice: 5.75, image: '/images/menu/product-05.jpg', isAvailable: true, isFeatured: false, isVegetarian: true, isSpicy: false, isGlutenFree: false, isNew: false, sizes: PIZZA_SIZES, modifiers: PIZZA_MODIFIERS },
  { id: 'hawaiian', categoryId: 'pizzas', name: 'The Hawaiian', nameEs: 'La Hawaiana', description: 'Ham, Pineapple and Roasted Peppers with Mozzarella and Cheddar', descriptionEs: 'Jamón, Piña y Pimientos Asados con Mozzarella y Cheddar', basePrice: 5.75, isAvailable: true, isFeatured: false, isVegetarian: false, isSpicy: false, isGlutenFree: false, isNew: false, sizes: PIZZA_SIZES, modifiers: PIZZA_MODIFIERS },
  { id: 'loroka', categoryId: 'pizzas', name: 'The Loroka', nameEs: 'La Loroka', description: "Simple: Loroco, bacon, and pepperoni", descriptionEs: 'Así de simple: Loroco, tocino y pepperoni', basePrice: 5.75, isAvailable: true, isFeatured: false, isVegetarian: false, isSpicy: false, isGlutenFree: false, isNew: false, sizes: PIZZA_SIZES, modifiers: PIZZA_MODIFIERS },
  { id: 'quattro-cheeses', categoryId: 'pizzas', name: 'QU4TRO Cheeses', nameEs: 'QU4TRO Quesos', description: 'Criollo Cheese, Parmesan, Mozzarella, Cream Cheese and Basil', descriptionEs: 'Queso Criollo, Parmesano, Mozzarella, Queso Crema y Albahaca', basePrice: 5.75, image: '/images/menu/product-06.jpg', isAvailable: true, isFeatured: false, isVegetarian: true, isSpicy: false, isGlutenFree: false, isNew: false, sizes: PIZZA_SIZES, modifiers: PIZZA_MODIFIERS },
  { id: 'mella-green', categoryId: 'pizzas', name: 'Mella Green', nameEs: 'Mella Green', description: 'Grilled Chicken Fajitas, Green Apple, Almond Slices and Bacon', descriptionEs: 'Fajitas de Pollo a la Parrilla, Manzana Verde, Rodajas de Almendra y Tocino', basePrice: 5.75, image: '/images/menu/pro-MG4664.jpg', isAvailable: true, isFeatured: false, isVegetarian: false, isSpicy: false, isGlutenFree: false, isNew: false, sizes: PIZZA_SIZES, modifiers: PIZZA_MODIFIERS },

  // SPECIALTY PIZZAS
  { id: 'ghiottone', categoryId: 'specialty-pizzas', name: 'Ghiottone', nameEs: 'Ghiottone', description: 'Peppers, Onion, Tomato, Salami, Ham, Pepperoni, Chorizo, Olives and Mushrooms', descriptionEs: 'Pimientos, Cebolla, Tomate, Salami, Jamón, Pepperoni, Chorizo, Aceitunas y Hongos', basePrice: 6.25, image: '/images/menu/product-03.jpg', isAvailable: true, isFeatured: true, isVegetarian: false, isSpicy: false, isGlutenFree: false, isNew: false, sizes: PIZZA_SIZES, modifiers: PIZZA_MODIFIERS },
  { id: 'memoravel', categoryId: 'specialty-pizzas', name: 'The Memoravel', nameEs: 'La Memoravel', description: 'Beef and chicken fajitas, marinated onions, baby corn, BBQ sauce', descriptionEs: 'Fajitas de res y pollo, cebollas marinadas, elotitos, salsa BBQ', basePrice: 6.25, image: '/images/menu/pizza-memoravel.jpg', isAvailable: true, isFeatured: true, isVegetarian: false, isSpicy: false, isGlutenFree: false, isNew: false, sizes: PIZZA_SIZES, modifiers: PIZZA_MODIFIERS },
  { id: 'mr-krabs', categoryId: 'specialty-pizzas', name: 'Mr. Krabs', nameEs: 'Don Cangrejo', description: 'Fresh shrimp and marinated clams, onion, green peppers, capers', descriptionEs: 'Camarones frescos y almejas marinadas, cebolla, pimientos, alcaparras', basePrice: 6.25, image: '/images/menu/pro-junio19.jpg', isAvailable: true, isFeatured: true, isVegetarian: false, isSpicy: false, isGlutenFree: false, isNew: false, sizes: PIZZA_SIZES, modifiers: PIZZA_MODIFIERS },
  { id: 'peasant-woman', categoryId: 'specialty-pizzas', name: 'The Peasant Woman', nameEs: 'La Campesina', description: 'Beef fajitas, Iberian chorizo, mozzarella, refried beans, salsa and cream', descriptionEs: 'Fajitas de res, chorizo ibérico, mozzarella, frijoles refritos, salsa y crema', basePrice: 6.25, image: '/images/menu/product-08.jpg', isAvailable: true, isFeatured: true, isVegetarian: false, isSpicy: false, isGlutenFree: false, isNew: false, sizes: PIZZA_SIZES, modifiers: PIZZA_MODIFIERS },
  { id: 'gamberetti', categoryId: 'specialty-pizzas', name: 'Gamberetti', nameEs: 'Gamberetti', description: 'Fresh shrimp, pineapple, Alfredo sauce and basil pesto', descriptionEs: 'Camarones frescos, piña, salsa Alfredo y pesto de albahaca', basePrice: 6.25, isAvailable: true, isFeatured: false, isVegetarian: false, isSpicy: false, isGlutenFree: false, isNew: false, sizes: PIZZA_SIZES, modifiers: PIZZA_MODIFIERS },

  // STARTERS
  { id: 'cheese-balls', categoryId: 'starters', name: 'Cheese Balls', nameEs: 'Bolitas de Queso', description: 'Crispy mixed cheese balls with pomodoro dipping sauce', descriptionEs: 'Bolitas de queso mixto crujientes con salsa pomodoro', basePrice: 6.99, image: '/images/menu/entradas-cheese-balls.jpg', isAvailable: true, isFeatured: false, isVegetarian: true, isSpicy: false, isGlutenFree: false, isNew: false },
  { id: 'potatoes-bacon', categoryId: 'starters', name: 'Potatoes with Bacon', nameEs: 'Papas con Tocino', basePrice: 5.99, isAvailable: true, isFeatured: false, isVegetarian: false, isSpicy: false, isGlutenFree: false, isNew: false },
  { id: 'shrimp-chicken-melt', categoryId: 'starters', name: 'Shrimp and Chicken Melt', nameEs: 'Melt de Camarón y Pollo', basePrice: 7.99, isAvailable: true, isFeatured: false, isVegetarian: false, isSpicy: false, isGlutenFree: false, isNew: false },

  // SALADS
  { id: 'prawn-salad', categoryId: 'salads', name: 'Prawn Salad', nameEs: 'Ensalada de Camarones', description: 'Grilled shrimp, lettuce, cherry tomatoes, carrot, cucumber, house dressing', descriptionEs: 'Camarones a la parrilla, lechuga, tomates cherry, zanahoria, pepino, aderezo', basePrice: 9.99, image: '/images/menu/food-IMG20040.jpg', isAvailable: true, isFeatured: false, isVegetarian: false, isSpicy: false, isGlutenFree: true, isNew: false },
  { id: 'impeccable-salad', categoryId: 'salads', name: 'Impeccable Salad', nameEs: 'Ensalada Impecable', description: 'Grilled chicken, green apple, fresh carrot, corn, house dressing', descriptionEs: 'Pollo a la parrilla, manzana verde, zanahoria, elote, aderezo', basePrice: 9.99, isAvailable: true, isFeatured: false, isVegetarian: false, isSpicy: false, isGlutenFree: true, isNew: false },

  // PASTAS
  { id: 'fettuccine-calamari', categoryId: 'pastas', name: 'Fettuccine Calamari', nameEs: 'Fettuccine Calamardiña', description: 'Fettuccine in calamari sauce with shrimp, clams and squid', descriptionEs: 'Fettuccine en salsa de calamares con camarones, almejas y calamar', basePrice: 13.00, image: '/images/menu/pasta-fettuccine-mar-tierra.jpg', isAvailable: true, isFeatured: true, isVegetarian: false, isSpicy: false, isGlutenFree: false, isNew: false },
  { id: 'penne-broccoli-bacon', categoryId: 'pastas', name: 'Penne Broccoli Bacon', nameEs: 'Penne Broccoli Bacon', description: 'Penne with Crispy Bacon, Broccoli, Chicken and special sauce', descriptionEs: 'Penne con Tocino Crujiente, Brócoli, Pollo y salsa especial', basePrice: 7.99, image: '/images/menu/pasta-penne-brocoli-tocino.jpg', isAvailable: true, isFeatured: false, isVegetarian: false, isSpicy: false, isGlutenFree: false, isNew: false },

  // MAINS
  { id: 'lomito-maitre', categoryId: 'mains', name: 'Terramar al Maitre', nameEs: 'Terramar al Maitre', description: 'Tenderloin with jumbo shrimp, maitre butter, seasonal vegetables', descriptionEs: 'Lomito con camarones jumbo, mantequilla maitre, vegetales de temporada', basePrice: 17.75, image: '/images/menu/pro-IMG4588.jpg', isAvailable: true, isFeatured: true, isVegetarian: false, isSpicy: false, isGlutenFree: false, isNew: false },
  { id: 'molcajete-coulotte', categoryId: 'mains', name: 'Molcajete Coulotte', nameEs: 'Molcajete Coulotte', description: 'Beef coulotte, grilled bone marrow, jalapeño, green onion, grilled onion', descriptionEs: 'Coulotte de res, tuétano a la parrilla, jalapeño, cebollín, cebolla asada', basePrice: 13.99, image: '/images/menu/molcajete-coulotte.jpg', isAvailable: true, isFeatured: false, isVegetarian: false, isSpicy: true, isGlutenFree: true, isNew: false },

  // KIDS
  { id: 'chicken-chunks', categoryId: 'kids', name: 'Chicken Chunks', nameEs: 'Trozos de Pollo', description: 'Breaded Chicken Breast Pieces with French Fries', descriptionEs: 'Trozos de Pechuga Empanizados con Papas Fritas', basePrice: 5.99, isAvailable: true, isFeatured: false, isVegetarian: false, isSpicy: false, isGlutenFree: false, isNew: false },

  // DESSERTS
  { id: 'panna-cotta', categoryId: 'desserts', name: 'Panna Cotta', nameEs: 'Panna Cotta', basePrice: 5.99, image: '/images/menu/panna-cotta.jpg', isAvailable: true, isFeatured: false, isVegetarian: true, isSpicy: false, isGlutenFree: true, isNew: false },
  { id: 'brownie-helado', categoryId: 'desserts', name: 'Brownie with Ice Cream', nameEs: 'Brownie con Helado', basePrice: 6.99, image: '/images/menu/brownie-helado.jpg', isAvailable: true, isFeatured: false, isVegetarian: true, isSpicy: false, isGlutenFree: false, isNew: false },

  // DRINKS
  { id: 'sodas', categoryId: 'drinks', name: 'Sodas', nameEs: 'Sodas', description: 'Coca-Cola, Sprite, Fanta', descriptionEs: 'Coca-Cola, Sprite, Fanta', basePrice: 1.99, isAvailable: true, isFeatured: false, isVegetarian: true, isSpicy: false, isGlutenFree: true, isNew: false },
  { id: 'lemonades', categoryId: 'drinks', name: 'Lemonades', nameEs: 'Limonadas', description: 'Traditional, Strawberry, Mint', descriptionEs: 'Tradicional, Fresa, Menta', basePrice: 3.25, isAvailable: true, isFeatured: false, isVegetarian: true, isSpicy: false, isGlutenFree: true, isNew: false },
  { id: 'frozen', categoryId: 'drinks', name: 'Frozen', nameEs: 'Frozen', description: 'Pineapple, Strawberry & Mint, Positive Vibration', descriptionEs: 'Piña, Fresa y Menta, Vibra Positiva', basePrice: 3.75, image: '/images/menu/product-07.jpg', isAvailable: true, isFeatured: false, isVegetarian: true, isSpicy: false, isGlutenFree: true, isNew: false },
  { id: 'pilsener', categoryId: 'drinks', name: 'Pilsener', nameEs: 'Pilsener', basePrice: 2.25, image: '/images/menu/cervezas.jpg', isAvailable: true, isFeatured: false, isVegetarian: true, isSpicy: false, isGlutenFree: true, isNew: false },
  { id: 'michelada', categoryId: 'drinks', name: 'Michelada', nameEs: 'Michelada', basePrice: 4.50, image: '/images/menu/michelada.jpg', isAvailable: true, isFeatured: false, isVegetarian: true, isSpicy: true, isGlutenFree: true, isNew: false },
];

// ============================================
// TRANSLATIONS
// ============================================

export const TRANSLATIONS: Record<string, Record<string, string>> = {
  es: {
    'nav.home': 'Inicio', 'nav.menu': 'Menú', 'nav.locations': 'Ubicaciones', 'nav.reserve': 'Reservar', 'nav.about': 'Nosotros', 'nav.cart': 'Carrito',
    'hero.badge': 'EST. 2013 • EL SALVADOR', 'hero.title': 'PIZZA ARTESANAL', 'hero.titleAccent': 'SOLO BUENAS VIBRAS', 'hero.subtitle': 'Pizza artesanal de horno de leña elaborada con amor. Experimenta la mezcla perfecta de tradición y sabor local en nuestras 5 ubicaciones.', 'hero.viewMenu': 'Ver Menú', 'hero.findLocations': 'Encontrar Ubicaciones',
    'menu.title': 'Nuestro Menú', 'menu.subtitle': 'Ingredientes frescos, sabores auténticos', 'menu.search': 'Buscar en el menú...', 'menu.all': 'Todo', 'menu.vegetarian': 'Vegetariano', 'menu.spicy': 'Picante', 'menu.glutenFree': 'Sin Gluten', 'menu.noResults': 'No se encontraron resultados', 'menu.addToCart': 'Agregar', 'menu.selectSize': 'Seleccionar Tamaño', 'menu.addExtras': 'Agregar Extras', 'menu.specialNotes': 'Notas especiales', 'menu.notesPlaceholder': 'Ej: Sin cebolla, extra salsa...',
    'cart.title': 'Tu Pedido', 'cart.empty': 'Tu carrito está vacío', 'cart.emptySubtitle': '¡Agrega algo delicioso para comenzar!', 'cart.subtotal': 'Subtotal', 'cart.tax': 'IVA (13%)', 'cart.total': 'Total', 'cart.checkout': 'Ir al Checkout', 'cart.orderWhatsApp': 'Pedir por WhatsApp', 'cart.clear': 'Vaciar', 'cart.browseMenu': 'Ver Menú',
    'locations.title': 'Nuestras Ubicaciones', 'locations.subtitle': '5 restaurantes en El Salvador', 'locations.open': 'Abierto', 'locations.closed': 'Cerrado', 'locations.viewDetails': 'Ver Detalles', 'locations.directions': 'Cómo Llegar', 'locations.selectLocation': 'Seleccionar Ubicación', 'locations.selectSubtitle': 'Elige el restaurante más cercano',
    'reserve.title': 'Reservar Mesa', 'reserve.subtitle': 'Haz tu reservación en cualquiera de nuestras ubicaciones', 'reserve.selectLocation': 'Selecciona una ubicación', 'reserve.date': 'Fecha', 'reserve.time': 'Hora', 'reserve.partySize': 'Número de personas', 'reserve.name': 'Tu nombre', 'reserve.phone': 'Teléfono', 'reserve.submit': 'Confirmar Reservación',
    'whatsapp.title': '¿LISTO PARA ORDENAR?', 'whatsapp.subtitle': 'Haz tu pedido por WhatsApp de forma rápida y fácil', 'whatsapp.order': 'Ordenar por WhatsApp',
    'footer.tagline': 'Pizza artesanal de horno de leña en El Salvador', 'footer.ourLocations': 'Nuestras Ubicaciones', 'footer.contact': 'Contacto', 'footer.rights': 'Todos los derechos reservados',
    'general.from': 'Desde', 'general.featured': 'Destacado', 'general.new': 'Nuevo',
  },
  en: {
    'nav.home': 'Home', 'nav.menu': 'Menu', 'nav.locations': 'Locations', 'nav.reserve': 'Reserve', 'nav.about': 'About', 'nav.cart': 'Cart',
    'hero.badge': 'EST. 2013 • EL SALVADOR', 'hero.title': 'HANDCRAFTED PIZZA', 'hero.titleAccent': 'GOOD VIBES ONLY', 'hero.subtitle': 'Artisan wood-fired pizza crafted with love. Experience the perfect blend of tradition and local flavor across our 5 locations.', 'hero.viewMenu': 'View Menu', 'hero.findLocations': 'Find Locations',
    'menu.title': 'Our Menu', 'menu.subtitle': 'Fresh ingredients, authentic flavors', 'menu.search': 'Search menu...', 'menu.all': 'All', 'menu.vegetarian': 'Vegetarian', 'menu.spicy': 'Spicy', 'menu.glutenFree': 'Gluten-Free', 'menu.noResults': 'No results found', 'menu.addToCart': 'Add to Cart', 'menu.selectSize': 'Select Size', 'menu.addExtras': 'Add Extras', 'menu.specialNotes': 'Special notes', 'menu.notesPlaceholder': 'E.g.: No onions, extra sauce...',
    'cart.title': 'Your Order', 'cart.empty': 'Your cart is empty', 'cart.emptySubtitle': 'Add something delicious to get started!', 'cart.subtotal': 'Subtotal', 'cart.tax': 'Tax (13%)', 'cart.total': 'Total', 'cart.checkout': 'Go to Checkout', 'cart.orderWhatsApp': 'Order via WhatsApp', 'cart.clear': 'Clear', 'cart.browseMenu': 'Browse Menu',
    'locations.title': 'Our Locations', 'locations.subtitle': '5 restaurants across El Salvador', 'locations.open': 'Open', 'locations.closed': 'Closed', 'locations.viewDetails': 'View Details', 'locations.directions': 'Get Directions', 'locations.selectLocation': 'Select Location', 'locations.selectSubtitle': 'Choose your nearest restaurant',
    'reserve.title': 'Reserve a Table', 'reserve.subtitle': 'Make a reservation at any of our locations', 'reserve.selectLocation': 'Select a location', 'reserve.date': 'Date', 'reserve.time': 'Time', 'reserve.partySize': 'Party size', 'reserve.name': 'Your name', 'reserve.phone': 'Phone', 'reserve.submit': 'Confirm Reservation',
    'whatsapp.title': 'READY TO ORDER?', 'whatsapp.subtitle': 'Place your order via WhatsApp quickly and easily', 'whatsapp.order': 'Order via WhatsApp',
    'footer.tagline': 'Artisan wood-fired pizza in El Salvador', 'footer.ourLocations': 'Our Locations', 'footer.contact': 'Contact', 'footer.rights': 'All rights reserved',
    'general.from': 'From', 'general.featured': 'Featured', 'general.new': 'New',
  },
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function formatPrice(amount: number): string { return `$${amount.toFixed(2)}`; }
export function getLocationBySlug(slug: string): Location | undefined { return LOCATIONS.find((l) => l.slug === slug); }
function getLocationById(id: string): Location | undefined { return LOCATIONS.find((l) => l.id === id); }
function getCategoryById(id: string): MenuCategory | undefined { return MENU_CATEGORIES.find((c) => c.id === id); }
export function getItemsByCategory(categoryId: string): MenuItem[] { return MENU_ITEMS.filter((i) => i.categoryId === categoryId && i.isAvailable); }
export function getFeaturedItems(): MenuItem[] { return MENU_ITEMS.filter((i) => i.isFeatured && i.isAvailable); }

export function searchMenuItems(query: string): MenuItem[] {
  const q = query.toLowerCase();
  return MENU_ITEMS.filter((i) => i.isAvailable && (i.name.toLowerCase().includes(q) || i.nameEs.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q) || i.descriptionEs?.toLowerCase().includes(q)));
}

export function calculateItemTotal(item: MenuItem, quantity: number, size?: MenuItemSize, modifiers?: MenuItemModifier[]): number {
  let price = item.basePrice;
  if (size) price += size.priceModifier;
  if (modifiers?.length) price += modifiers.reduce((s, m) => s + m.price, 0);
  return price * quantity;
}

export function calculateCartTotal(items: CartItem[]): { subtotal: number; tax: number; total: number } {
  const subtotal = items.reduce((s, i) => s + i.totalPrice, 0);
  const tax = subtotal * TAX_RATE;
  return { subtotal, tax, total: subtotal + tax };
}

export function isLocationOpen(location: Location): boolean {
  const now = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
  const todayKey = dayNames[now.getDay()];
  const todayHours = location.hours[todayKey] || (now.getDay() >= 1 && now.getDay() <= 5 ? location.hours.weekday : location.hours.weekend);
  if (!todayHours || todayHours.toLowerCase() === 'cerrado' || todayHours.toLowerCase() === 'closed') return false;
  const match = todayHours.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return false;
  const [, oh, om, op, ch, cm, cp] = match;
  let openTime = parseInt(oh) * 60 + parseInt(om);
  if (op.toUpperCase() === 'PM' && parseInt(oh) !== 12) openTime += 720;
  if (op.toUpperCase() === 'AM' && parseInt(oh) === 12) openTime -= 720;
  let closeTime = parseInt(ch) * 60 + parseInt(cm);
  if (cp.toUpperCase() === 'PM' && parseInt(ch) !== 12) closeTime += 720;
  if (cp.toUpperCase() === 'AM' && parseInt(ch) === 12) closeTime -= 720;
  const currentTime = now.getHours() * 60 + now.getMinutes();
  if (closeTime < openTime) return currentTime >= openTime || currentTime <= closeTime;
  return currentTime >= openTime && currentTime <= closeTime;
}

export function generateWhatsAppOrderUrl(order: OrderDetails): string {
  const labels: Record<string, string> = { dine_in: '🍽️ Comer aquí', takeout: '🥡 Para llevar', delivery: '🛵 Domicilio' };
  let msg = `🍕 *NUEVO PEDIDO - SIMMER DOWN*\n━━━━━━━━━━━━━━━━━━━━━\n\n📍 *Ubicación:* ${order.location.name}\n📦 *Tipo:* ${labels[order.orderType]}\n`;
  if (order.customerName) msg += `👤 *Cliente:* ${order.customerName}\n`;
  if (order.customerPhone) msg += `📱 *Teléfono:* ${order.customerPhone}\n`;
  msg += `\n━━━━━━━━━━━━━━━━━━━━━\n*PEDIDO:*\n\n`;
  for (const item of order.items) {
    msg += `• ${item.quantity}x ${item.nameEs || item.name}`;
    if (item.selectedSize) msg += ` (${item.selectedSize.nameEs})`;
    msg += `\n`;
    if (item.selectedModifiers?.length) msg += `  └ ${item.selectedModifiers.map((m) => m.nameEs).join(', ')}\n`;
    if (item.notes) msg += `  └ Nota: ${item.notes}\n`;
    msg += `  ${formatPrice(item.totalPrice)}\n\n`;
  }
  msg += `━━━━━━━━━━━━━━━━━━━━━\n*Subtotal:* ${formatPrice(order.subtotal)}\n*IVA (13%):* ${formatPrice(order.tax)}\n*TOTAL:* ${formatPrice(order.total)}\n`;
  if (order.notes) msg += `\n📝 *Notas:* ${order.notes}\n`;
  msg += `\n━━━━━━━━━━━━━━━━━━━━━\n_Pedido desde simmerdownsv.com_`;
  const phone = order.location.whatsapp.replace(/\D/g, '');
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}

export function generateReservationUrl(r: ReservationDetails): string {
  let msg = `📅 *NUEVA RESERVACIÓN - SIMMER DOWN*\n━━━━━━━━━━━━━━━━━━━━━\n\n📍 *Ubicación:* ${r.location.name}\n📆 *Fecha:* ${r.date}\n🕐 *Hora:* ${r.time}\n👥 *Personas:* ${r.partySize}\n\n━━━━━━━━━━━━━━━━━━━━━\n👤 *Nombre:* ${r.customerName}\n📱 *Teléfono:* ${r.customerPhone}\n`;
  if (r.customerEmail) msg += `📧 *Email:* ${r.customerEmail}\n`;
  if (r.occasion) msg += `🎉 *Ocasión:* ${r.occasion}\n`;
  if (r.specialRequests) msg += `📝 *Peticiones:* ${r.specialRequests}\n`;
  msg += `\n━━━━━━━━━━━━━━━━━━━━━\n_Reservación desde simmerdownsv.com_`;
  const phone = r.location.whatsapp.replace(/\D/g, '');
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}

export function getGoogleMapsUrl(location: Location): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${location.coordinates.lat},${location.coordinates.lng}`;
}
