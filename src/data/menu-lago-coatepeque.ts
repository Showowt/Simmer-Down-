// Simmer Down - Lago de Coatepeque Menu
// Extracted from SDLAGOFINAL2025.pdf

export interface MenuItem {
  id: string;
  name: string;
  name_es: string;
  description: string;
  description_es: string;
  price: number;
  price_grand?: number; // For pizzas with two sizes
  category: string;
  subcategory?: string;
  image?: string;
  tags?: string[];
  available?: boolean;
  availability_note?: string;
}

export const menuLagoCoatepeque: MenuItem[] = [
  // ========== ENTRADAS ==========
  {
    id: 'leche-de-tigra',
    name: 'Leche de Tigra',
    name_es: 'Leche de Tigra',
    description: 'Fresh fish in tiger milk with glazed sweet potato, corn, purple onion, cilantro, lime juice, and plantain chips.',
    description_es: 'Pescado / Leche de Tigra / Camote Glaseado / Elotitos / Cebolla Morada / Cilantro / Jugo de Limón / Tajadas de Plátano.',
    price: 13.99,
    category: 'entradas',
    tags: ['seafood', 'signature'],
    image: '/menu/entradas/leche-de-tigra.jpg'
  },
  {
    id: 'ceviche-tropical',
    name: 'Tropical Ceviche',
    name_es: 'Ceviche Tropical',
    description: 'Fresh fish with tropical salsa, purple onion, pineapple, cilantro, and plantain chips.',
    description_es: 'Pescado / Salsa Tropical / Cebolla Morada / Piña / Cilantro / Tajadas de Plátano.',
    price: 13.99,
    category: 'entradas',
    tags: ['seafood'],
    image: '/menu/entradas/ceviche-tropical.jpg'
  },
  {
    id: 'aguachile-camaron',
    name: 'Shrimp Aguachile',
    name_es: 'Aguachile de Camarón',
    description: 'Shrimp in aguachile sauce with purple onion, cucumber, cilantro, jalapeño, celery, and plantain chips.',
    description_es: 'Camarón / Salsa Aguachile / Cebolla Morada / Pepino / Cilantro / Chile Jalapeño / Apio / Tajadas de Plátano.',
    price: 11.99,
    category: 'entradas',
    tags: ['seafood', 'spicy'],
    image: '/menu/entradas/aguachile-camaron.jpg'
  },
  {
    id: 'molcajete-coulotte',
    name: 'Molcajete Coulotte',
    name_es: 'Molcajete Coulotte',
    description: 'Coulotte steak with avocado salsa, onion mix, jalapeño, green onion, bone marrow, and tortilla.',
    description_es: 'Carne Coulotte / Salsa Aguacate / Mix de Cebolla / Jalapeño / Cebollín Ají / Tuétano / Tortilla.',
    price: 13.99,
    category: 'entradas',
    tags: ['beef', 'signature'],
    image: '/menu/entradas/molcajete-coulotte.jpg'
  },
  {
    id: 'camarones-empanizados',
    name: 'Breaded Shrimp',
    name_es: 'Camarones Empanizados',
    description: 'Breaded shrimp with french fries and choice of sauce: Buffalo, Cilantro Parmesan, or Spicy Teriyaki.',
    description_es: 'Camarones / Papas Fritas / Salsa a Elección: Salsa Búfalo, Salsa Cilantro Parmesano, Salsa Teriyaki Picante.',
    price: 9.99,
    category: 'entradas',
    tags: ['seafood'],
    image: '/menu/entradas/camarones-empanizados.jpg'
  },
  {
    id: 'patatas-tocino',
    name: 'Bacon Potatoes',
    name_es: 'Patatas con Tocino',
    description: 'Potato rounds with crunchy bacon, pomodoro sauce, and mozzarella cheese.',
    description_es: 'Rondeles de Papa / Tocino Crunch / Salsa Pomodoro / Queso Mozzarella.',
    price: 5.99,
    category: 'entradas',
    tags: ['vegetarian-friendly'],
    image: '/menu/entradas/patatas-tocino.jpg'
  },
  {
    id: 'fundido-camaron-pollo',
    name: 'Shrimp & Chicken Fundido',
    name_es: 'Fundido Camarón y Pollo',
    description: 'Grilled shrimp and chicken breast with pomodoro sauce, mozzarella cheese, and garlic bread.',
    description_es: 'Camarones / Pechuga al Grill / Salsa Pomodoro / Queso Mozzarella / Pan con Ajo.',
    price: 7.99,
    category: 'entradas',
    tags: ['seafood', 'chicken'],
    image: '/menu/entradas/fundido-camaron-pollo.jpg'
  },
  {
    id: 'cheese-balls',
    name: 'Cheese Balls',
    name_es: 'Cheese Balls',
    description: 'Mixed cheese balls with pomodoro sauce and garlic bread.',
    description_es: 'Bolitas de Mix de Quesos / Salsa Pomodoro / Pan con Ajo.',
    price: 6.99,
    category: 'entradas',
    tags: ['vegetarian'],
    image: '/menu/entradas/cheese-balls.jpg'
  },

  // ========== ENSALADAS ==========
  {
    id: 'ensalada-gambas',
    name: 'Shrimp Salad',
    name_es: 'Ensalada Gambas',
    description: 'Delicious combination of grilled shrimp, lettuce, cherry tomatoes, carrot, cucumber, avocado, sweet corn; served with croutons and pink dressing.',
    description_es: 'Deliciosa combinación de camarones a la plancha, lechugas, tomates cherrys, zanahoria, pepino, aguacate, elote dulce; servida con crotones y aderezo rosa.',
    price: 9.99,
    category: 'ensaladas',
    tags: ['seafood', 'healthy'],
    image: '/menu/ensaladas/ensalada-gambas.jpg'
  },
  {
    id: 'ensalada-criolla',
    name: 'Criolla Salad',
    name_es: 'Ensalada Criolla',
    description: 'Fresh lettuce, beef tenderloin, avocado, mushrooms, cherry tomatoes, sweet corn, purple onion; served with yogurt cilantro dressing and corn chips.',
    description_es: 'Lechuga fresca, lomito de res, aguacate, champiñones, tomates cherrys, elote dulce, cebolla morada; servida con aderezo yogurlantro y chips de maíz.',
    price: 8.99,
    category: 'ensaladas',
    tags: ['beef', 'healthy'],
    image: '/menu/ensaladas/ensalada-criolla.jpg'
  },
  {
    id: 'ensalada-impecable',
    name: 'Impeccable Salad',
    name_es: 'Ensalada Impecable',
    description: 'Fresh lettuce, grilled chicken breast pieces, green apple, fresh carrot, sweet corn, avocado, bacon, almonds, cherry tomatoes; served with yogurt cilantro dressing and corn chips.',
    description_es: 'Lechuga fresca, trozos de pechuga de pollo a la plancha, manzana verde, zanahoria fresca, elote dulce, aguacate, tocino, almendras, tomates cherry; servida con aderezo yogurlantro y chips de maíz.',
    price: 9.99,
    category: 'ensaladas',
    tags: ['chicken', 'healthy', 'signature'],
    image: '/menu/ensaladas/ensalada-impecable.jpg'
  },

  // ========== PASTAS ==========
  {
    id: 'fettuccine-mar-tierra',
    name: 'Surf & Turf Fettuccine',
    name_es: 'Fettuccine Mar y Tierra',
    description: 'Fettuccine pasta bathed in Alfredo sauce with a delicious fusion of seafood and chicken.',
    description_es: 'Pasta fettuccine bañada en salsa Alfredo con una deliciosa fusión de mariscos y pollo.',
    price: 9.99,
    category: 'pastas',
    tags: ['seafood', 'chicken'],
    image: '/menu/pastas/fettuccine-mar-tierra.jpg'
  },
  {
    id: 'lasagna-bolognesa',
    name: 'Lasagna Bolognese',
    name_es: 'Lasagna Bolognesa',
    description: 'Traditional combination of pasta filled with Bolognese sauce and a mix of mozzarella and cream cheese.',
    description_es: 'Tradicional combinación de pasta rellena de salsa Bolognesa y un mix de quesos mozzarella y queso crema.',
    price: 9.99,
    category: 'pastas',
    tags: ['beef'],
    image: '/menu/pastas/lasagna-bolognesa.jpg'
  },
  {
    id: 'penne-brocoli-tocino',
    name: 'Bacon Broccoli Penne',
    name_es: 'Penne Brócoli Tocino',
    description: 'Delicious crunchy penne pasta with bacon, broccoli, chicken pieces; bathed in our delicious Alfredo sauce and gratinated mozzarella.',
    description_es: 'Deliciosa pasta penne con tocino crocante, brócoli, trozos de pechuga; bañada con nuestra deliciosa salsa Alfredo y mozzarella gratinado.',
    price: 7.99,
    category: 'pastas',
    tags: ['chicken'],
    image: '/menu/pastas/penne-brocoli-tocino.jpg'
  },

  // ========== PIZZAS CLÁSICAS ==========
  {
    id: 'pizza-fungie',
    name: 'Fungie Pizza',
    name_es: 'Pizza Fungie',
    description: 'Vegetarian pizza with onions and mushrooms in chimichurri.',
    description_es: 'Pizza vegetariana de cebollas y hongos al chimichurri.',
    price: 5.75,
    price_grand: 14.99,
    category: 'pizzas',
    subcategory: 'clasicas',
    tags: ['vegetarian'],
    image: '/menu/pizzas/fungie.jpg'
  },
  {
    id: 'pizza-con-pina',
    name: 'Pineapple Pizza',
    name_es: 'Pizza con Piña',
    description: 'Pepperoni, bacon, pineapple, and house basil pesto.',
    description_es: 'Pepperoni, tocino, piña y pesto de albahaca de la casa.',
    price: 5.75,
    price_grand: 14.99,
    category: 'pizzas',
    subcategory: 'clasicas',
    tags: [],
    image: '/menu/pizzas/con-pina.jpg'
  },
  {
    id: 'pizza-maradona',
    name: 'Maradona Pizza',
    name_es: 'Pizza Maradona',
    description: 'A tribute to a legend! D10S level Argentine chorizo, green peppers, onion, and our special chimichurri.',
    description_es: '¡El tributo a una leyenda! Chorizo argentino nivel D10S, pimientos verdes, cebolla y nuestro especial chimichurri.',
    price: 5.75,
    price_grand: 14.99,
    category: 'pizzas',
    subcategory: 'clasicas',
    tags: ['signature', 'spicy'],
    image: '/menu/pizzas/maradona.jpg'
  },
  {
    id: 'pizza-brazuca',
    name: 'Brazuca Pizza',
    name_es: 'Pizza Brazuca',
    description: 'A fusion of pineapple and salami; covered in garlic sauce and jalapeños.',
    description_es: 'Una fusión de piña y salami; cubierto en salsa de ajo y jalapeños.',
    price: 5.75,
    price_grand: 14.99,
    category: 'pizzas',
    subcategory: 'clasicas',
    tags: ['spicy'],
    image: '/menu/pizzas/brazuca.jpg'
  },
  {
    id: 'pizza-vegetariana',
    name: 'Vegetarian Pizza',
    name_es: 'Pizza Vegetariana',
    description: 'Green peppers, onion, fresh tomatoes, mushrooms, carrot slices, and marinated broccoli.',
    description_es: 'Pimientos verdes, cebolla, tomates frescos, champiñones, lascas de zanahoria y brócoli marinados.',
    price: 5.75,
    price_grand: 14.99,
    category: 'pizzas',
    subcategory: 'clasicas',
    tags: ['vegetarian'],
    image: '/menu/pizzas/vegetariana.jpg'
  },
  {
    id: 'pizza-picollo',
    name: 'Picollo Pizza',
    name_es: 'Pizza Picollo',
    description: 'Marinated chicken breast on the grill, garlic sauce, and a touch of cilantro.',
    description_es: 'Pechuga marinada al grill, salsa de ajo y un toque de cilantro.',
    price: 5.75,
    price_grand: 14.99,
    category: 'pizzas',
    subcategory: 'clasicas',
    tags: ['chicken'],
    image: '/menu/pizzas/picollo.jpg'
  },
  {
    id: 'pizza-jamon-pepperoni',
    name: 'Ham or Pepperoni Pizza',
    name_es: 'Pizza Jamón o Pepperoni',
    description: 'Classic ham or pepperoni pizza.',
    description_es: 'Clásica pizza de jamón o pepperoni.',
    price: 5.75,
    price_grand: 14.99,
    category: 'pizzas',
    subcategory: 'clasicas',
    tags: [],
    image: '/menu/pizzas/jamon-pepperoni.jpg'
  },
  {
    id: 'pizza-margherita',
    name: 'Margherita Pizza',
    name_es: 'Pizza Margherita',
    description: 'Marinated cherry tomatoes and fresh basil.',
    description_es: 'Tomates cherrys marinados y albahaca fresca.',
    price: 5.75,
    price_grand: 14.99,
    category: 'pizzas',
    subcategory: 'clasicas',
    tags: ['vegetarian'],
    image: '/menu/pizzas/margherita.jpg'
  },
  {
    id: 'pizza-hawaiana',
    name: 'Hawaiian Pizza',
    name_es: 'Pizza Hawaiana',
    description: 'Ham, pineapple, roasted peppers covered with mozzarella and cheddar.',
    description_es: 'Jamón, piña, pimientos asados cubiertos de mozzarella y cheddar.',
    price: 5.75,
    price_grand: 14.99,
    category: 'pizzas',
    subcategory: 'clasicas',
    tags: [],
    image: '/menu/pizzas/hawaiana.jpg'
  },
  {
    id: 'pizza-verde-mella',
    name: 'Verde Mella Pizza',
    name_es: 'Pizza Verde Mella',
    description: 'Grilled chicken fajitas, green apple, almond slices, and bacon.',
    description_es: 'Fajitas de pollo al grill, manzana verde, rebanadas de almendras y tocino.',
    price: 5.75,
    price_grand: 14.99,
    category: 'pizzas',
    subcategory: 'clasicas',
    tags: ['chicken'],
    image: '/menu/pizzas/verde-mella.jpg'
  },
  {
    id: 'pizza-loroka',
    name: 'La Loroka Pizza',
    name_es: 'Pizza La Loroka',
    description: 'As simple as: loroco, bacon, and pepperoni.',
    description_es: 'Así de simple: loroco, tocino y pepperoni.',
    price: 5.75,
    price_grand: 14.99,
    category: 'pizzas',
    subcategory: 'clasicas',
    tags: ['signature'],
    image: '/menu/pizzas/loroka.jpg'
  },
  {
    id: 'pizza-cuatro-quesos',
    name: 'Four Cheese Pizza',
    name_es: 'Pizza Qu4tro Quesos',
    description: 'Special Creole cheese, Parmesan, mozzarella, Philadelphia cheese, and fresh basil.',
    description_es: 'Queso criollo especial, parmesano, mozzarella, queso Philadelphia y albahaca fresca.',
    price: 5.75,
    price_grand: 14.99,
    category: 'pizzas',
    subcategory: 'clasicas',
    tags: ['vegetarian'],
    image: '/menu/pizzas/cuatro-quesos.jpg'
  },

  // ========== PIZZAS ESPECIALES ==========
  {
    id: 'pizza-ghiottone',
    name: 'Ghiottone Pizza',
    name_es: 'Pizza Ghiottone',
    description: 'Pepperoni, onion, tomato, salami, ham, pepperoni, chorizo, black olives, and natural mushrooms.',
    description_es: 'Pepperoni, cebolla, tomate, salami, jamón, pepperoni, chorizo, aceitunas negras y hongos naturales.',
    price: 8.25,
    price_grand: 17.99,
    category: 'pizzas',
    subcategory: 'especiales',
    tags: ['signature'],
    image: '/menu/pizzas/ghiottone.jpg'
  },
  {
    id: 'pizza-memorable',
    name: 'La Memorable Pizza',
    name_es: 'Pizza La Memorable',
    description: 'Chicken breast slices, marinated onion, sweet corn, yellow amarillo covered in our BBQ sauce with a touch of aioli.',
    description_es: 'Rajas de rey pollo, cebolla marinada, elotito amarilla, cubierta en nuestra salsa BBQ, con un toque de aijoili.',
    price: 8.25,
    price_grand: 17.99,
    category: 'pizzas',
    subcategory: 'especiales',
    tags: ['chicken', 'signature'],
    image: '/menu/pizzas/memorable.jpg'
  },
  {
    id: 'pizza-don-cangrejo',
    name: 'Don Cangrejo Pizza',
    name_es: 'Pizza Don Cangrejo',
    description: 'Fresh shrimp and marinated clams, onion, green peppers, with a touch of fresh Alfredo.',
    description_es: 'Camarones frescos y almejas marinados, cebolla, pimientos verdes, con un toque de Alfredo fresco.',
    price: 8.25,
    price_grand: 17.99,
    category: 'pizzas',
    subcategory: 'especiales',
    tags: ['seafood'],
    image: '/menu/pizzas/don-cangrejo.jpg'
  },
  {
    id: 'pizza-pescattore',
    name: 'La Pescattore Pizza',
    name_es: 'Pizza La Pescattore',
    description: 'Calamari, clams, shrimp, onion, and smoked paprika.',
    description_es: 'Calamari, almejas, camarones, cebolla y pimentón ahumado.',
    price: 8.25,
    price_grand: 17.99,
    category: 'pizzas',
    subcategory: 'especiales',
    tags: ['seafood'],
    image: '/menu/pizzas/pescattore.jpg'
  },
  {
    id: 'pizza-punta-jalapena',
    name: 'Punta Jalapeña Pizza',
    name_es: 'Pizza Punta Jalapeña',
    description: 'Beef tenderloin, mozzarella, mushrooms, and our delicious spicy salsa.',
    description_es: 'Lomito de res, mozzarella, hongos y nuestra deliciosa salsa picante.',
    price: 8.25,
    price_grand: 17.99,
    category: 'pizzas',
    subcategory: 'especiales',
    tags: ['beef', 'spicy'],
    image: '/menu/pizzas/punta-jalapena.jpg'
  },
  {
    id: 'pizza-campesina',
    name: 'La Campesina Pizza',
    name_es: 'Pizza La Campesina',
    description: 'Iberian pork fajitas, mozzarella with fried beans, avocado sauce, and a touch of fresh cilantro; accompanied with Creole onion.',
    description_es: 'Fajitas de res, chorizo ibérico, cubierta de mozzarella, decorada con frijoles fritos, salsa de aguacate y un toque de cilantro fresco; acompañada de cebolla encurtida.',
    price: 8.25,
    price_grand: 17.99,
    category: 'pizzas',
    subcategory: 'especiales',
    tags: ['beef', 'signature'],
    image: '/menu/pizzas/campesina.jpg'
  },
  {
    id: 'pizza-gamberetti',
    name: 'Gamberetti Pizza',
    name_es: 'Pizza Gamberetti',
    description: 'Fresh shrimp, pineapple, Alfredo sauce and basil pesto.',
    description_es: 'Camarones frescos, piña, salsa Alfredo y pesto de albahaca.',
    price: 8.25,
    price_grand: 17.99,
    category: 'pizzas',
    subcategory: 'especiales',
    tags: ['seafood'],
    image: '/menu/pizzas/gamberetti.jpg'
  },

  // ========== PLATOS FUERTES ==========
  {
    id: 'terramar-maitre',
    name: 'Terramar al Maître',
    name_es: 'Terramar al Maître',
    description: 'Combination of beef tenderloin and jumbo shrimp; accompanied by potato rounds, vegetables, and crowned with our Maître butter.',
    description_es: 'Combinación de lomito de res y camarones jumbo; acompañado de rondeles de papa, vegetales y coronado con nuestra mantequilla Maître.',
    price: 22.50,
    category: 'platos-fuertes',
    tags: ['beef', 'seafood', 'signature'],
    image: '/menu/platos-fuertes/terramar-maitre.jpg'
  },
  {
    id: 'medallon-lomito-maitre',
    name: 'Beef Medallion al Maître',
    name_es: 'Medallón de Lomito al Maître',
    description: 'New York style cut wrapped in bacon; accompanied by sautéed mushrooms and cherry tomatoes; crowned with our Maître butter.',
    description_es: 'Corte estilo New York albardado con tocino; acompañado de salteado de hongos y cherrys; coronado con nuestra mantequilla Maître.',
    price: 19.99,
    category: 'platos-fuertes',
    tags: ['beef', 'signature'],
    image: '/menu/platos-fuertes/medallon-lomito-maitre.jpg'
  },
  {
    id: 'mariskada',
    name: 'Mariskada',
    name_es: 'Mariskada',
    description: 'Traditional seafood soup prepared with shrimp, clams, calamari, and fish; in a creamy coconut broth with local spices.',
    description_es: 'Tradicional sopa mariskada preparada con camarones, almejas, calamares, mejillones y pescado; en un caldo cremoso de coco con especies locales.',
    price: 17.99,
    category: 'platos-fuertes',
    tags: ['seafood'],
    availability_note: 'Disponible: Sábado y Domingo',
    image: '/menu/platos-fuertes/mariskada.jpg'
  },
  {
    id: 'pechuga-capresse',
    name: 'Capresse Chicken Breast',
    name_es: 'Pechuga Capresse',
    description: 'Delicious chicken breast stuffed with mozzarella cheese, dehydrated tomatoes, and pesto; on a bed of mashed potatoes with vegetables.',
    description_es: 'Deliciosa pechuga rellena de queso mozzarella, tomates deshidratados y pesto; en una cama de puré de papa con vegetales.',
    price: 14.99,
    category: 'platos-fuertes',
    tags: ['chicken'],
    image: '/menu/platos-fuertes/pechuga-capresse.jpg'
  },
  {
    id: 'hamburguesa-casanova',
    name: 'Casanova Burger',
    name_es: 'Hamburguesa Casanova',
    description: 'Double 100% beef patty, bacon fusion, mushrooms and purple onion, covered with melted mozzarella cheese; accompanied by French fries.',
    description_es: 'Doble carne 100% res, fusión de tocino, hongos y cebolla morada, cubierta de queso mozzarella derretido; acompañado de papas francesas.',
    price: 12.50,
    category: 'platos-fuertes',
    tags: ['beef', 'signature'],
    image: '/menu/platos-fuertes/hamburguesa-casanova.jpg'
  },
  {
    id: 'pescado-parrilla',
    name: 'Grilled Fish',
    name_es: 'Pescado a la Parrilla',
    description: 'Whole grilled fish with chimichurri, fried tortillas, and pickled onion.',
    description_es: 'Pescado entero a la parrilla, con chimichurri, tortillas fritas y cebolla encurtida.',
    price: 22.50,
    category: 'platos-fuertes',
    tags: ['seafood'],
    image: '/menu/platos-fuertes/pescado-parrilla.jpg'
  },

  // ========== MENÚ INFANTIL ==========
  {
    id: 'chunks-pollo',
    name: 'Chicken Chunks',
    name_es: 'Chunks de Pollo',
    description: 'Breaded chicken breast pieces; accompanied with French fries and drink.',
    description_es: 'Trozos de pechugas empanizados; acompañados con papas francesas y té.',
    price: 5.99,
    category: 'menu-infantil',
    tags: ['chicken', 'kids'],
    image: '/menu/infantil/chunks-pollo.jpg'
  },
  {
    id: 'cangreburguer',
    name: 'Cangreburguer',
    name_es: 'Cangreburguer',
    description: 'Traditional chicken burger; accompanied with French fries and drink.',
    description_es: 'Hamburguesa tradicional de pollo; acompañada de papas francesas y té.',
    price: 5.50,
    category: 'menu-infantil',
    tags: ['chicken', 'kids'],
    image: '/menu/infantil/cangreburguer.jpg'
  },

  // ========== BEBIDAS FRÍAS ==========
  {
    id: 'frozen-pina',
    name: 'Pineapple Frozen',
    name_es: 'Frozen Piña',
    description: 'Refreshing pineapple frozen drink.',
    description_es: 'Refrescante bebida frozen de piña.',
    price: 3.75,
    category: 'bebidas',
    subcategory: 'frozen',
    tags: [],
    image: '/menu/bebidas/frozen-pina.jpg'
  },
  {
    id: 'frozen-fresa',
    name: 'Strawberry Frozen',
    name_es: 'Frozen Fresa',
    description: 'Refreshing strawberry frozen drink.',
    description_es: 'Refrescante bebida frozen de fresa.',
    price: 3.75,
    category: 'bebidas',
    subcategory: 'frozen',
    tags: [],
    image: '/menu/bebidas/frozen-fresa.jpg'
  },
  {
    id: 'frozen-fresa-hierba-buena',
    name: 'Strawberry & Mint Frozen',
    name_es: 'Frozen Fresa & Hierba Buena',
    description: 'Refreshing strawberry and mint frozen drink.',
    description_es: 'Refrescante bebida frozen de fresa y hierba buena.',
    price: 3.75,
    category: 'bebidas',
    subcategory: 'frozen',
    tags: [],
    image: '/menu/bebidas/frozen-fresa-hierba-buena.jpg'
  },
  {
    id: 'frozen-hierba-buena',
    name: 'Mint Frozen',
    name_es: 'Frozen Hierba Buena',
    description: 'Refreshing mint frozen drink.',
    description_es: 'Refrescante bebida frozen de hierba buena.',
    price: 3.75,
    category: 'bebidas',
    subcategory: 'frozen',
    tags: [],
    image: '/menu/bebidas/frozen-hierba-buena.jpg'
  },
  {
    id: 'frozen-maracuya',
    name: 'Passion Fruit Frozen',
    name_es: 'Frozen Maracuyá',
    description: 'Refreshing passion fruit frozen drink.',
    description_es: 'Refrescante bebida frozen de maracuyá.',
    price: 3.75,
    category: 'bebidas',
    subcategory: 'frozen',
    tags: [],
    image: '/menu/bebidas/frozen-maracuya.jpg'
  },
  {
    id: 'frozen-positive-vibration',
    name: 'Positive Vibration Frozen',
    name_es: 'Frozen Positive Vibration',
    description: 'Tri-color layered frozen: kiwi, mango, and strawberry.',
    description_es: 'Frozen tricolor: kiwi, mango y fresa.',
    price: 3.75,
    category: 'bebidas',
    subcategory: 'frozen',
    tags: ['signature'],
    image: '/menu/bebidas/frozen-positive-vibration.jpg'
  },
  {
    id: 'limonada-maracuya',
    name: 'Passion Fruit Lemonade',
    name_es: 'Limonada Maracuyá',
    description: 'Fresh lemonade with passion fruit.',
    description_es: 'Limonada fresca con maracuyá.',
    price: 3.25,
    category: 'bebidas',
    subcategory: 'limonadas',
    tags: [],
    image: '/menu/bebidas/limonada-maracuya.jpg'
  },
  {
    id: 'limonada-fresa',
    name: 'Strawberry Lemonade',
    name_es: 'Limonada Fresa',
    description: 'Fresh lemonade with strawberry.',
    description_es: 'Limonada fresca con fresa.',
    price: 3.25,
    category: 'bebidas',
    subcategory: 'limonadas',
    tags: [],
    image: '/menu/bebidas/limonada-fresa.jpg'
  },
  {
    id: 'limonada-fresa-hierba-buena',
    name: 'Strawberry & Mint Lemonade',
    name_es: 'Limonada Fresa & Hierba Buena',
    description: 'Fresh lemonade with strawberry and mint.',
    description_es: 'Limonada fresca con fresa y hierba buena.',
    price: 3.25,
    category: 'bebidas',
    subcategory: 'limonadas',
    tags: [],
    image: '/menu/bebidas/limonada-fresa-hierba-buena.jpg'
  },
  {
    id: 'limonada-hierba-buena',
    name: 'Mint Lemonade',
    name_es: 'Limonada Hierba Buena',
    description: 'Fresh lemonade with mint.',
    description_es: 'Limonada fresca con hierba buena.',
    price: 3.25,
    category: 'bebidas',
    subcategory: 'limonadas',
    tags: [],
    image: '/menu/bebidas/limonada-hierba-buena.jpg'
  },
  {
    id: 'limonada-tradicional',
    name: 'Traditional Lemonade',
    name_es: 'Limonada Tradicional',
    description: 'Classic fresh lemonade.',
    description_es: 'Limonada fresca tradicional.',
    price: 3.25,
    category: 'bebidas',
    subcategory: 'limonadas',
    tags: [],
    image: '/menu/bebidas/limonada-tradicional.jpg'
  },
  {
    id: 'tamarindo',
    name: 'Tamarind Drink',
    name_es: 'Tamarindo',
    description: '100% natural tamarind drink.',
    description_es: 'Refresco de tamarindo 100% natural.',
    price: 2.95,
    category: 'bebidas',
    subcategory: 'refrescos',
    tags: [],
    image: '/menu/bebidas/tamarindo.jpg'
  },
  {
    id: 'horchata',
    name: 'Horchata',
    name_es: 'Horchata',
    description: 'Traditional horchata drink.',
    description_es: 'Refresco de horchata tradicional.',
    price: 2.95,
    category: 'bebidas',
    subcategory: 'refrescos',
    tags: [],
    image: '/menu/bebidas/horchata.jpg'
  },
  {
    id: 'te-durazno',
    name: 'Peach Tea',
    name_es: 'Té Durazno',
    description: 'Fresh peach iced tea.',
    description_es: 'Té helado de durazno.',
    price: 2.95,
    category: 'bebidas',
    subcategory: 'refrescos',
    tags: [],
    image: '/menu/bebidas/te-durazno.jpg'
  },
  {
    id: 'agua',
    name: 'Water',
    name_es: 'Agua',
    description: 'Bottled water 600ml.',
    description_es: 'Agua embotellada 600ml.',
    price: 1.99,
    category: 'bebidas',
    subcategory: 'otros',
    tags: [],
    image: '/menu/bebidas/agua.jpg'
  },
  {
    id: 'sodas',
    name: 'Sodas',
    name_es: 'Sodas',
    description: 'Assorted sodas.',
    description_es: 'Sodas variadas.',
    price: 1.99,
    category: 'bebidas',
    subcategory: 'otros',
    tags: [],
    image: '/menu/bebidas/sodas.jpg'
  },

  // ========== BEBIDAS CALIENTES ==========
  {
    id: 'cappuccino-vainilla',
    name: 'Vanilla Cappuccino',
    name_es: 'Cappuccino Vainilla',
    description: 'Cappuccino with vanilla flavor.',
    description_es: 'Cappuccino con sabor a vainilla.',
    price: 2.99,
    category: 'bebidas',
    subcategory: 'calientes',
    tags: [],
    image: '/menu/bebidas/cappuccino-vainilla.jpg'
  },
  {
    id: 'latte',
    name: 'Latte',
    name_es: 'Latte',
    description: 'Classic latte.',
    description_es: 'Latte clásico.',
    price: 2.99,
    category: 'bebidas',
    subcategory: 'calientes',
    tags: [],
    image: '/menu/bebidas/latte.jpg'
  },
  {
    id: 'latte-vainilla',
    name: 'Vanilla Latte',
    name_es: 'Latte Vainilla',
    description: 'Latte with vanilla flavor.',
    description_es: 'Latte con sabor a vainilla.',
    price: 2.99,
    category: 'bebidas',
    subcategory: 'calientes',
    tags: [],
    image: '/menu/bebidas/latte-vainilla.jpg'
  },
  {
    id: 'cafe-americano',
    name: 'Americano',
    name_es: 'Café Americano',
    description: 'Classic American coffee.',
    description_es: 'Café americano clásico.',
    price: 1.50,
    category: 'bebidas',
    subcategory: 'calientes',
    tags: [],
    image: '/menu/bebidas/cafe-americano.jpg'
  },
  {
    id: 'cappuccino',
    name: 'Cappuccino',
    name_es: 'Cappuccino',
    description: 'Classic cappuccino.',
    description_es: 'Cappuccino clásico.',
    price: 2.99,
    category: 'bebidas',
    subcategory: 'calientes',
    tags: [],
    image: '/menu/bebidas/cappuccino.jpg'
  },
  {
    id: 'mokaccino',
    name: 'Mokaccino',
    name_es: 'Mokaccino',
    description: 'Mocha cappuccino.',
    description_es: 'Cappuccino con chocolate.',
    price: 2.99,
    category: 'bebidas',
    subcategory: 'calientes',
    tags: [],
    image: '/menu/bebidas/mokaccino.jpg'
  },
  {
    id: 'chocolate-caliente',
    name: 'Hot Chocolate',
    name_es: 'Chocolate',
    description: 'Hot chocolate.',
    description_es: 'Chocolate caliente.',
    price: 2.99,
    category: 'bebidas',
    subcategory: 'calientes',
    tags: [],
    image: '/menu/bebidas/chocolate.jpg'
  },

  // ========== POSTRES ==========
  {
    id: 'ganache-chocolate',
    name: 'Chocolate Ganache',
    name_es: 'Ganache de Chocolate',
    description: 'Rich chocolate ganache dessert.',
    description_es: 'Delicioso postre de ganache de chocolate.',
    price: 3.99,
    category: 'postres',
    tags: [],
    image: '/menu/postres/ganache-chocolate.jpg'
  },
  {
    id: 'cheesecake-fresa',
    name: 'Strawberry Cheesecake',
    name_es: 'Cheesecake de Fresa',
    description: 'Creamy strawberry cheesecake.',
    description_es: 'Cremoso cheesecake de fresa.',
    price: 3.99,
    category: 'postres',
    tags: [],
    image: '/menu/postres/cheesecake-fresa.jpg'
  },
  {
    id: 'brownie-helado',
    name: 'Brownie with Ice Cream',
    name_es: 'Brownie con Helado',
    description: 'Warm brownie with vanilla ice cream, chocolate drizzle, and almonds.',
    description_es: 'Brownie caliente con helado de vainilla, salsa de chocolate y almendras.',
    price: 3.99,
    category: 'postres',
    tags: ['signature'],
    image: '/menu/postres/brownie-helado.jpg'
  },
  {
    id: 'panna-cotta',
    name: 'Panna Cotta',
    name_es: 'Panna Cotta',
    description: 'Classic Italian panna cotta with red fruits.',
    description_es: 'Clásica panna cotta italiana con frutos rojos.',
    price: 3.99,
    category: 'postres',
    tags: ['signature'],
    image: '/menu/postres/panna-cotta.jpg'
  },

  // ========== CERVEZAS ==========
  {
    id: 'cerveza-puente-quemado',
    name: 'Puente Quemado',
    name_es: 'Puente Quemado',
    description: 'Artisanal beer from Santa Ana.',
    description_es: 'Cerveza artesanal Santaneca.',
    price: 5.00,
    category: 'cervezas',
    subcategory: 'locales',
    tags: ['craft'],
    image: '/menu/cervezas/puente-quemado.jpg'
  },
  {
    id: 'cerveza-regia-chola',
    name: 'Regia Chola',
    name_es: 'Regia Chola',
    description: 'Local Salvadoran beer.',
    description_es: 'Cerveza salvadoreña.',
    price: 4.25,
    category: 'cervezas',
    subcategory: 'locales',
    tags: [],
    image: '/menu/cervezas/regia-chola.jpg'
  },
  {
    id: 'cerveza-suprema',
    name: 'Suprema',
    name_es: 'Suprema',
    description: 'Local Salvadoran beer.',
    description_es: 'Cerveza salvadoreña.',
    price: 2.50,
    category: 'cervezas',
    subcategory: 'locales',
    tags: [],
    image: '/menu/cervezas/suprema.jpg'
  },
  {
    id: 'cerveza-pilsener',
    name: 'Pilsener',
    name_es: 'Pilsener',
    description: 'Local Salvadoran beer.',
    description_es: 'Cerveza salvadoreña.',
    price: 2.25,
    category: 'cervezas',
    subcategory: 'locales',
    tags: [],
    image: '/menu/cervezas/pilsener.jpg'
  },
  {
    id: 'cerveza-golden',
    name: 'Golden',
    name_es: 'Golden',
    description: 'Local Salvadoran beer.',
    description_es: 'Cerveza salvadoreña.',
    price: 2.25,
    category: 'cervezas',
    subcategory: 'locales',
    tags: [],
    image: '/menu/cervezas/golden.jpg'
  },
  {
    id: 'cerveza-golden-extra',
    name: 'Golden Extra',
    name_es: 'Golden Extra',
    description: 'Local Salvadoran beer.',
    description_es: 'Cerveza salvadoreña.',
    price: 2.25,
    category: 'cervezas',
    subcategory: 'locales',
    tags: [],
    image: '/menu/cervezas/golden-extra.jpg'
  },
  {
    id: 'cerveza-corona',
    name: 'Corona',
    name_es: 'Corona',
    description: 'Imported Mexican beer.',
    description_es: 'Cerveza mexicana importada.',
    price: 3.50,
    category: 'cervezas',
    subcategory: 'extranjeras',
    tags: [],
    image: '/menu/cervezas/corona.jpg'
  },
  {
    id: 'cerveza-heineken',
    name: 'Heineken',
    name_es: 'Heineken',
    description: 'Imported Dutch beer.',
    description_es: 'Cerveza holandesa importada.',
    price: 3.50,
    category: 'cervezas',
    subcategory: 'extranjeras',
    tags: [],
    image: '/menu/cervezas/heineken.jpg'
  },
  {
    id: 'cerveza-miller-draft',
    name: 'Miller Draft',
    name_es: 'Miller Draft',
    description: 'Imported American beer.',
    description_es: 'Cerveza americana importada.',
    price: 3.50,
    category: 'cervezas',
    subcategory: 'extranjeras',
    tags: [],
    image: '/menu/cervezas/miller-draft.jpg'
  },
  {
    id: 'cerveza-modelo',
    name: 'Modelo',
    name_es: 'Modelo',
    description: 'Imported Mexican beer.',
    description_es: 'Cerveza mexicana importada.',
    price: 3.50,
    category: 'cervezas',
    subcategory: 'extranjeras',
    tags: [],
    image: '/menu/cervezas/modelo.jpg'
  },
  {
    id: 'cerveza-blue-moon',
    name: 'Blue Moon',
    name_es: 'Blue Moon',
    description: 'Imported Belgian-style wheat beer.',
    description_es: 'Cerveza de trigo estilo belga importada.',
    price: 3.50,
    category: 'cervezas',
    subcategory: 'extranjeras',
    tags: [],
    image: '/menu/cervezas/blue-moon.jpg'
  },
  {
    id: 'cerveza-stella-artois',
    name: 'Stella Artois',
    name_es: 'Stella Artois',
    description: 'Imported Belgian beer.',
    description_es: 'Cerveza belga importada.',
    price: 3.50,
    category: 'cervezas',
    subcategory: 'extranjeras',
    tags: [],
    image: '/menu/cervezas/stella-artois.jpg'
  },
  {
    id: 'cerveza-michelob-ultra',
    name: 'Michelob Ultra',
    name_es: 'Michelob Ultra',
    description: 'Imported light American beer.',
    description_es: 'Cerveza americana ligera importada.',
    price: 3.50,
    category: 'cervezas',
    subcategory: 'extranjeras',
    tags: [],
    image: '/menu/cervezas/michelob-ultra.jpg'
  },
  {
    id: 'michelada-tradicional',
    name: 'Traditional Michelada',
    name_es: 'Michelada Tradicional',
    description: 'Classic michelada with lime and spices.',
    description_es: 'Michelada clásica con limón y especias.',
    price: 1.50,
    category: 'cervezas',
    subcategory: 'preparadas',
    tags: [],
    image: '/menu/cervezas/michelada.jpg'
  },
  {
    id: 'smirnoff-ice',
    name: 'Smirnoff Ice',
    name_es: 'Smirnoff Ice',
    description: 'Smirnoff Ice malt beverage.',
    description_es: 'Bebida de malta Smirnoff Ice.',
    price: 3.75,
    category: 'cervezas',
    subcategory: 'otros',
    tags: [],
    image: '/menu/cervezas/smirnoff-ice.jpg'
  }
];

// Categories for filtering
export const menuCategories = [
  { id: 'entradas', name: 'Entradas', name_es: 'Entradas' },
  { id: 'ensaladas', name: 'Salads', name_es: 'Ensaladas' },
  { id: 'pastas', name: 'Pastas', name_es: 'Nuestras Pastas' },
  { id: 'pizzas', name: 'Pizzas', name_es: 'Nuestra Pizza' },
  { id: 'platos-fuertes', name: 'Main Courses', name_es: 'Platos Fuertes' },
  { id: 'menu-infantil', name: 'Kids Menu', name_es: 'Menú Infantil' },
  { id: 'bebidas', name: 'Drinks', name_es: 'Bebidas' },
  { id: 'postres', name: 'Desserts', name_es: 'Postres' },
  { id: 'cervezas', name: 'Beers', name_es: 'Cervezas' }
];

// Pizza pricing note
export const pizzaPricing = {
  personal: 5.75,
  grand: 14.99,
  especial_personal: 8.25,
  especial_grand: 17.99
};
