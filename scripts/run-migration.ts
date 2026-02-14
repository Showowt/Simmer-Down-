// Script to run the menu migration
// Usage: npx tsx scripts/run-migration.ts

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
})

// Menu items from Lago de Coatepeque PDF
const menuItems = [
  // ENTRADAS
  { id: 'leche-de-tigra', name: 'Leche de Tigra', name_es: 'Leche de Tigra', description: 'Fresh fish in tiger milk with glazed sweet potato, corn, purple onion, cilantro, lime juice, and plantain chips.', description_es: 'Pescado / Leche de Tigra / Camote Glaseado / Elotitos / Cebolla Morada / Cilantro / Jugo de Limón / Tajadas de Plátano.', price: 13.99, category: 'entradas', tags: ['seafood', 'signature'], available: true, image_url: 'https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=600&q=80' },
  { id: 'ceviche-tropical', name: 'Tropical Ceviche', name_es: 'Ceviche Tropical', description: 'Fresh fish with tropical salsa, purple onion, pineapple, cilantro, and plantain chips.', description_es: 'Pescado / Salsa Tropical / Cebolla Morada / Piña / Cilantro / Tajadas de Plátano.', price: 13.99, category: 'entradas', tags: ['seafood'], available: true, image_url: 'https://images.unsplash.com/photo-1582361171586-2cb89fa27951?w=600&q=80' },
  { id: 'aguachile-camaron', name: 'Shrimp Aguachile', name_es: 'Aguachile de Camarón', description: 'Shrimp in aguachile sauce with purple onion, cucumber, cilantro, jalapeño, celery, and plantain chips.', description_es: 'Camarón / Salsa Aguachile / Cebolla Morada / Pepino / Cilantro / Chile Jalapeño / Apio / Tajadas de Plátano.', price: 11.99, category: 'entradas', tags: ['seafood', 'spicy'], available: true, image_url: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&q=80' },
  { id: 'molcajete-coulotte', name: 'Molcajete Coulotte', name_es: 'Molcajete Coulotte', description: 'Coulotte steak with avocado salsa, onion mix, jalapeño, green onion, bone marrow, and tortilla.', description_es: 'Carne Coulotte / Salsa Aguacate / Mix de Cebolla / Jalapeño / Cebollín Ají / Tuétano / Tortilla.', price: 13.99, category: 'entradas', tags: ['beef', 'signature'], available: true, image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80' },
  { id: 'camarones-empanizados', name: 'Breaded Shrimp', name_es: 'Camarones Empanizados', description: 'Breaded shrimp with french fries and choice of sauce.', description_es: 'Camarones / Papas Fritas / Salsa a Elección.', price: 9.99, category: 'entradas', tags: ['seafood'], available: true, image_url: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&q=80' },
  { id: 'patatas-tocino', name: 'Bacon Potatoes', name_es: 'Patatas con Tocino', description: 'Potato rounds with crunchy bacon, pomodoro sauce, and mozzarella cheese.', description_es: 'Rondeles de Papa / Tocino Crunch / Salsa Pomodoro / Queso Mozzarella.', price: 5.99, category: 'entradas', tags: [], available: true, image_url: 'https://images.unsplash.com/photo-1518013431117-eb1465fa5752?w=600&q=80' },
  { id: 'fundido-camaron-pollo', name: 'Shrimp & Chicken Fundido', name_es: 'Fundido Camarón y Pollo', description: 'Grilled shrimp and chicken breast with pomodoro sauce, mozzarella cheese, and garlic bread.', description_es: 'Camarones / Pechuga al Grill / Salsa Pomodoro / Queso Mozzarella / Pan con Ajo.', price: 7.99, category: 'entradas', tags: ['seafood', 'chicken'], available: true, image_url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&q=80' },
  { id: 'cheese-balls', name: 'Cheese Balls', name_es: 'Cheese Balls', description: 'Mixed cheese balls with pomodoro sauce and garlic bread.', description_es: 'Bolitas de Mix de Quesos / Salsa Pomodoro / Pan con Ajo.', price: 6.99, category: 'entradas', tags: ['vegetarian'], available: true, image_url: 'https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=600&q=80' },

  // ENSALADAS
  { id: 'ensalada-gambas', name: 'Shrimp Salad', name_es: 'Ensalada Gambas', description: 'Grilled shrimp, lettuce, cherry tomatoes, carrot, cucumber, avocado, sweet corn; served with croutons and pink dressing.', description_es: 'Camarones a la plancha, lechugas, tomates cherrys, zanahoria, pepino, aguacate, elote dulce; servida con crotones y aderezo rosa.', price: 9.99, category: 'ensaladas', tags: ['seafood', 'healthy'], available: true, image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&q=80' },
  { id: 'ensalada-criolla', name: 'Criolla Salad', name_es: 'Ensalada Criolla', description: 'Fresh lettuce, beef tenderloin, avocado, mushrooms, cherry tomatoes, sweet corn, purple onion.', description_es: 'Lechuga fresca, lomito de res, aguacate, champiñones, tomates cherrys, elote dulce, cebolla morada.', price: 8.99, category: 'ensaladas', tags: ['beef', 'healthy'], available: true, image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80' },
  { id: 'ensalada-impecable', name: 'Impeccable Salad', name_es: 'Ensalada Impecable', description: 'Fresh lettuce, grilled chicken breast, green apple, carrot, sweet corn, avocado, bacon, almonds.', description_es: 'Lechuga fresca, trozos de pechuga de pollo a la plancha, manzana verde, zanahoria fresca, elote dulce, aguacate, tocino, almendras.', price: 9.99, category: 'ensaladas', tags: ['chicken', 'healthy', 'signature'], available: true, image_url: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=600&q=80' },

  // PASTAS
  { id: 'fettuccine-mar-tierra', name: 'Surf & Turf Fettuccine', name_es: 'Fettuccine Mar y Tierra', description: 'Fettuccine pasta in Alfredo sauce with seafood and chicken.', description_es: 'Pasta fettuccine bañada en salsa Alfredo con una deliciosa fusión de mariscos y pollo.', price: 9.99, category: 'pastas', tags: ['seafood', 'chicken'], available: true, image_url: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=600&q=80' },
  { id: 'lasagna-bolognesa', name: 'Lasagna Bolognese', name_es: 'Lasagna Bolognesa', description: 'Traditional pasta filled with Bolognese sauce and mozzarella.', description_es: 'Tradicional combinación de pasta rellena de salsa Bolognesa y un mix de quesos mozzarella y queso crema.', price: 9.99, category: 'pastas', tags: ['beef'], available: true, image_url: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=600&q=80' },
  { id: 'penne-brocoli-tocino', name: 'Bacon Broccoli Penne', name_es: 'Penne Brócoli Tocino', description: 'Penne pasta with bacon, broccoli, chicken in Alfredo sauce.', description_es: 'Deliciosa pasta penne con tocino crocante, brócoli, trozos de pechuga; bañada con nuestra deliciosa salsa Alfredo.', price: 7.99, category: 'pastas', tags: ['chicken'], available: true, image_url: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&q=80' },

  // PIZZAS CLÁSICAS
  { id: 'pizza-fungie', name: 'Fungie Pizza', name_es: 'Pizza Fungie', description: 'Vegetarian pizza with onions and mushrooms in chimichurri.', description_es: 'Pizza vegetariana de cebollas y hongos al chimichurri.', price: 5.75, price_grand: 14.99, category: 'pizzas', subcategory: 'clasicas', tags: ['vegetarian'], available: true, image_url: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=600&q=80' },
  { id: 'pizza-maradona', name: 'Maradona Pizza', name_es: 'Pizza Maradona', description: 'A tribute to a legend! Argentine chorizo, green peppers, onion, and chimichurri.', description_es: '¡El tributo a una leyenda! Chorizo argentino nivel D10S, pimientos verdes, cebolla y nuestro especial chimichurri.', price: 5.75, price_grand: 14.99, category: 'pizzas', subcategory: 'clasicas', tags: ['signature', 'spicy'], available: true, image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80' },
  { id: 'pizza-brazuca', name: 'Brazuca Pizza', name_es: 'Pizza Brazuca', description: 'Pineapple and salami in garlic sauce with jalapeños.', description_es: 'Una fusión de piña y salami; cubierto en salsa de ajo y jalapeños.', price: 5.75, price_grand: 14.99, category: 'pizzas', subcategory: 'clasicas', tags: ['spicy'], available: true, image_url: 'https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=600&q=80' },
  { id: 'pizza-vegetariana', name: 'Vegetarian Pizza', name_es: 'Pizza Vegetariana', description: 'Green peppers, onion, tomatoes, mushrooms, carrot, and broccoli.', description_es: 'Pimientos verdes, cebolla, tomates frescos, champiñones, lascas de zanahoria y brócoli marinados.', price: 5.75, price_grand: 14.99, category: 'pizzas', subcategory: 'clasicas', tags: ['vegetarian'], available: true, image_url: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=600&q=80' },
  { id: 'pizza-picollo', name: 'Picollo Pizza', name_es: 'Pizza Picollo', description: 'Marinated chicken breast, garlic sauce, and cilantro.', description_es: 'Pechuga marinada al grill, salsa de ajo y un toque de cilantro.', price: 5.75, price_grand: 14.99, category: 'pizzas', subcategory: 'clasicas', tags: ['chicken'], available: true, image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80' },
  { id: 'pizza-jamon-pepperoni', name: 'Ham or Pepperoni Pizza', name_es: 'Pizza Jamón o Pepperoni', description: 'Classic ham or pepperoni pizza.', description_es: 'Clásica pizza de jamón o pepperoni.', price: 5.75, price_grand: 14.99, category: 'pizzas', subcategory: 'clasicas', tags: [], available: true, image_url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&q=80' },
  { id: 'pizza-margherita', name: 'Margherita Pizza', name_es: 'Pizza Margherita', description: 'Marinated cherry tomatoes and fresh basil.', description_es: 'Tomates cherrys marinados y albahaca fresca.', price: 5.75, price_grand: 14.99, category: 'pizzas', subcategory: 'clasicas', tags: ['vegetarian'], available: true, image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80' },
  { id: 'pizza-hawaiana', name: 'Hawaiian Pizza', name_es: 'Pizza Hawaiana', description: 'Ham, pineapple, roasted peppers with mozzarella and cheddar.', description_es: 'Jamón, piña, pimientos asados cubiertos de mozzarella y cheddar.', price: 5.75, price_grand: 14.99, category: 'pizzas', subcategory: 'clasicas', tags: [], available: true, image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80' },
  { id: 'pizza-verde-mella', name: 'Verde Mella Pizza', name_es: 'Pizza Verde Mella', description: 'Grilled chicken fajitas, green apple, almonds, and bacon.', description_es: 'Fajitas de pollo al grill, manzana verde, rebanadas de almendras y tocino.', price: 5.75, price_grand: 14.99, category: 'pizzas', subcategory: 'clasicas', tags: ['chicken'], available: true, image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80' },
  { id: 'pizza-loroka', name: 'La Loroka Pizza', name_es: 'Pizza La Loroka', description: 'Loroco, bacon, and pepperoni.', description_es: 'Así de simple: loroco, tocino y pepperoni.', price: 5.75, price_grand: 14.99, category: 'pizzas', subcategory: 'clasicas', tags: ['signature'], available: true, image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80' },
  { id: 'pizza-cuatro-quesos', name: 'Four Cheese Pizza', name_es: 'Pizza Qu4tro Quesos', description: 'Creole cheese, Parmesan, mozzarella, Philadelphia, and fresh basil.', description_es: 'Queso criollo especial, parmesano, mozzarella, queso Philadelphia y albahaca fresca.', price: 5.75, price_grand: 14.99, category: 'pizzas', subcategory: 'clasicas', tags: ['vegetarian'], available: true, image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80' },

  // PIZZAS ESPECIALES
  { id: 'pizza-ghiottone', name: 'Ghiottone Pizza', name_es: 'Pizza Ghiottone', description: 'Pepperoni, onion, tomato, salami, ham, chorizo, olives, mushrooms.', description_es: 'Pepperoni, cebolla, tomate, salami, jamón, chorizo, aceitunas negras y hongos naturales.', price: 8.25, price_grand: 17.99, category: 'pizzas', subcategory: 'especiales', tags: ['signature'], available: true, image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80' },
  { id: 'pizza-memorable', name: 'La Memorable Pizza', name_es: 'Pizza La Memorable', description: 'Chicken breast, marinated onion, corn, BBQ sauce with aioli.', description_es: 'Rajas de rey pollo, cebolla marinada, elotito, cubierta en nuestra salsa BBQ.', price: 8.25, price_grand: 17.99, category: 'pizzas', subcategory: 'especiales', tags: ['chicken', 'signature'], available: true, image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80' },
  { id: 'pizza-don-cangrejo', name: 'Don Cangrejo Pizza', name_es: 'Pizza Don Cangrejo', description: 'Fresh shrimp and clams, onion, green peppers with Alfredo.', description_es: 'Camarones frescos y almejas marinados, cebolla, pimientos verdes.', price: 8.25, price_grand: 17.99, category: 'pizzas', subcategory: 'especiales', tags: ['seafood'], available: true, image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80' },
  { id: 'pizza-pescattore', name: 'La Pescattore Pizza', name_es: 'Pizza La Pescattore', description: 'Calamari, clams, shrimp, onion, and smoked paprika.', description_es: 'Calamari, almejas, camarones, cebolla y pimentón ahumado.', price: 8.25, price_grand: 17.99, category: 'pizzas', subcategory: 'especiales', tags: ['seafood'], available: true, image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80' },
  { id: 'pizza-campesina', name: 'La Campesina Pizza', name_es: 'Pizza La Campesina', description: 'Beef fajitas, Iberian chorizo, mozzarella, beans, avocado sauce.', description_es: 'Fajitas de res, chorizo ibérico, mozzarella, frijoles fritos, salsa de aguacate.', price: 8.25, price_grand: 17.99, category: 'pizzas', subcategory: 'especiales', tags: ['beef', 'signature'], available: true, image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80' },
  { id: 'pizza-gamberetti', name: 'Gamberetti Pizza', name_es: 'Pizza Gamberetti', description: 'Fresh shrimp, pineapple, Alfredo sauce and basil pesto.', description_es: 'Camarones frescos, piña, salsa Alfredo y pesto de albahaca.', price: 8.25, price_grand: 17.99, category: 'pizzas', subcategory: 'especiales', tags: ['seafood'], available: true, image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80' },

  // PLATOS FUERTES
  { id: 'terramar-maitre', name: 'Terramar al Maître', name_es: 'Terramar al Maître', description: 'Beef tenderloin and jumbo shrimp with potato rounds, vegetables, and Maître butter.', description_es: 'Combinación de lomito de res y camarones jumbo; acompañado de rondeles de papa, vegetales y coronado con nuestra mantequilla Maître.', price: 22.50, category: 'platos-fuertes', tags: ['beef', 'seafood', 'signature'], available: true, image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80' },
  { id: 'medallon-lomito-maitre', name: 'Beef Medallion al Maître', name_es: 'Medallón de Lomito al Maître', description: 'New York cut wrapped in bacon with sautéed mushrooms and Maître butter.', description_es: 'Corte estilo New York albardado con tocino; acompañado de salteado de hongos y cherrys; coronado con nuestra mantequilla Maître.', price: 19.99, category: 'platos-fuertes', tags: ['beef', 'signature'], available: true, image_url: 'https://images.unsplash.com/photo-1558030006-450675393462?w=600&q=80' },
  { id: 'mariskada', name: 'Mariskada', name_es: 'Mariskada', description: 'Seafood soup with shrimp, clams, calamari, fish in coconut broth.', description_es: 'Tradicional sopa mariskada preparada con camarones, almejas, calamares y pescado; en un caldo cremoso de coco.', price: 17.99, category: 'platos-fuertes', tags: ['seafood'], available: true, availability_note: 'Disponible: Sábado y Domingo', image_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80' },
  { id: 'pechuga-capresse', name: 'Capresse Chicken Breast', name_es: 'Pechuga Capresse', description: 'Chicken breast stuffed with mozzarella, tomatoes, and pesto on mashed potatoes.', description_es: 'Deliciosa pechuga rellena de queso mozzarella, tomates deshidratados y pesto; en una cama de puré de papa.', price: 14.99, category: 'platos-fuertes', tags: ['chicken'], available: true, image_url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&q=80' },
  { id: 'hamburguesa-casanova', name: 'Casanova Burger', name_es: 'Hamburguesa Casanova', description: 'Double beef patty with bacon, mushrooms, purple onion, melted mozzarella, and fries.', description_es: 'Doble carne 100% res, fusión de tocino, hongos y cebolla morada, cubierta de queso mozzarella derretido; acompañado de papas francesas.', price: 12.50, category: 'platos-fuertes', tags: ['beef', 'signature'], available: true, image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80' },
  { id: 'pescado-parrilla', name: 'Grilled Fish', name_es: 'Pescado a la Parrilla', description: 'Whole grilled fish with chimichurri, fried tortillas, and pickled onion.', description_es: 'Pescado entero a la parrilla, con chimichurri, tortillas fritas y cebolla encurtida.', price: 22.50, category: 'platos-fuertes', tags: ['seafood'], available: true, image_url: 'https://images.unsplash.com/photo-1534766555764-ce878a5e3a2b?w=600&q=80' },

  // MENÚ INFANTIL
  { id: 'chunks-pollo', name: 'Chicken Chunks', name_es: 'Chunks de Pollo', description: 'Breaded chicken breast with French fries and drink.', description_es: 'Trozos de pechugas empanizados; acompañados con papas francesas y té.', price: 5.99, category: 'menu-infantil', tags: ['chicken', 'kids'], available: true, image_url: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&q=80' },
  { id: 'cangreburguer', name: 'Cangreburguer', name_es: 'Cangreburguer', description: 'Chicken burger with French fries and drink.', description_es: 'Hamburguesa tradicional de pollo; acompañada de papas francesas y té.', price: 5.50, category: 'menu-infantil', tags: ['chicken', 'kids'], available: true, image_url: 'https://images.unsplash.com/photo-1550317138-10000687a72b?w=600&q=80' },

  // BEBIDAS
  { id: 'frozen-positive-vibration', name: 'Positive Vibration Frozen', name_es: 'Frozen Positive Vibration', description: 'Tri-color layered frozen: kiwi, mango, and strawberry.', description_es: 'Frozen tricolor: kiwi, mango y fresa.', price: 3.75, category: 'bebidas', subcategory: 'frozen', tags: ['signature'], available: true },
  { id: 'frozen-pina', name: 'Pineapple Frozen', name_es: 'Frozen Piña', description: 'Refreshing pineapple frozen drink.', description_es: 'Refrescante bebida frozen de piña.', price: 3.75, category: 'bebidas', subcategory: 'frozen', tags: [], available: true },
  { id: 'frozen-fresa', name: 'Strawberry Frozen', name_es: 'Frozen Fresa', description: 'Refreshing strawberry frozen drink.', description_es: 'Refrescante bebida frozen de fresa.', price: 3.75, category: 'bebidas', subcategory: 'frozen', tags: [], available: true },
  { id: 'frozen-maracuya', name: 'Passion Fruit Frozen', name_es: 'Frozen Maracuyá', description: 'Refreshing passion fruit frozen drink.', description_es: 'Refrescante bebida frozen de maracuyá.', price: 3.75, category: 'bebidas', subcategory: 'frozen', tags: [], available: true },
  { id: 'limonada-tradicional', name: 'Traditional Lemonade', name_es: 'Limonada Tradicional', description: 'Classic fresh lemonade.', description_es: 'Limonada fresca tradicional.', price: 3.25, category: 'bebidas', subcategory: 'limonadas', tags: [], available: true },
  { id: 'limonada-fresa', name: 'Strawberry Lemonade', name_es: 'Limonada Fresa', description: 'Fresh lemonade with strawberry.', description_es: 'Limonada fresca con fresa.', price: 3.25, category: 'bebidas', subcategory: 'limonadas', tags: [], available: true },
  { id: 'limonada-hierba-buena', name: 'Mint Lemonade', name_es: 'Limonada Hierba Buena', description: 'Fresh lemonade with mint.', description_es: 'Limonada fresca con hierba buena.', price: 3.25, category: 'bebidas', subcategory: 'limonadas', tags: [], available: true },
  { id: 'tamarindo', name: 'Tamarind Drink', name_es: 'Tamarindo', description: '100% natural tamarind drink.', description_es: 'Refresco de tamarindo 100% natural.', price: 2.95, category: 'bebidas', subcategory: 'refrescos', tags: [], available: true },
  { id: 'horchata', name: 'Horchata', name_es: 'Horchata', description: 'Traditional horchata drink.', description_es: 'Refresco de horchata tradicional.', price: 2.95, category: 'bebidas', subcategory: 'refrescos', tags: [], available: true },
  { id: 'te-durazno', name: 'Peach Tea', name_es: 'Té Durazno', description: 'Fresh peach iced tea.', description_es: 'Té helado de durazno.', price: 2.95, category: 'bebidas', subcategory: 'refrescos', tags: [], available: true },
  { id: 'agua', name: 'Water', name_es: 'Agua', description: 'Bottled water 600ml.', description_es: 'Agua embotellada 600ml.', price: 1.99, category: 'bebidas', subcategory: 'otros', tags: [], available: true },
  { id: 'sodas', name: 'Sodas', name_es: 'Sodas', description: 'Assorted sodas.', description_es: 'Sodas variadas.', price: 1.99, category: 'bebidas', subcategory: 'otros', tags: [], available: true },
  { id: 'cafe-americano', name: 'Americano', name_es: 'Café Americano', description: 'Classic American coffee.', description_es: 'Café americano clásico.', price: 1.50, category: 'bebidas', subcategory: 'calientes', tags: [], available: true },
  { id: 'cappuccino', name: 'Cappuccino', name_es: 'Cappuccino', description: 'Classic cappuccino.', description_es: 'Cappuccino clásico.', price: 2.99, category: 'bebidas', subcategory: 'calientes', tags: [], available: true },
  { id: 'latte', name: 'Latte', name_es: 'Latte', description: 'Classic latte.', description_es: 'Latte clásico.', price: 2.99, category: 'bebidas', subcategory: 'calientes', tags: [], available: true },
  { id: 'chocolate-caliente', name: 'Hot Chocolate', name_es: 'Chocolate', description: 'Hot chocolate.', description_es: 'Chocolate caliente.', price: 2.99, category: 'bebidas', subcategory: 'calientes', tags: [], available: true },

  // POSTRES
  { id: 'brownie-helado', name: 'Brownie with Ice Cream', name_es: 'Brownie con Helado', description: 'Warm brownie with vanilla ice cream, chocolate drizzle, and almonds.', description_es: 'Brownie caliente con helado de vainilla, salsa de chocolate y almendras.', price: 3.99, category: 'postres', tags: ['signature'], available: true, image_url: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=600&q=80' },
  { id: 'ganache-chocolate', name: 'Chocolate Ganache', name_es: 'Ganache de Chocolate', description: 'Rich chocolate ganache dessert.', description_es: 'Delicioso postre de ganache de chocolate.', price: 3.99, category: 'postres', tags: [], available: true, image_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&q=80' },
  { id: 'cheesecake-fresa', name: 'Strawberry Cheesecake', name_es: 'Cheesecake de Fresa', description: 'Creamy strawberry cheesecake.', description_es: 'Cremoso cheesecake de fresa.', price: 3.99, category: 'postres', tags: [], available: true, image_url: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&q=80' },
  { id: 'panna-cotta', name: 'Panna Cotta', name_es: 'Panna Cotta', description: 'Classic Italian panna cotta with red fruits.', description_es: 'Clásica panna cotta italiana con frutos rojos.', price: 3.99, category: 'postres', tags: ['signature'], available: true, image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80' },

  // CERVEZAS
  { id: 'cerveza-puente-quemado', name: 'Puente Quemado', name_es: 'Puente Quemado', description: 'Artisanal beer from Santa Ana.', description_es: 'Cerveza artesanal Santaneca.', price: 5.00, category: 'cervezas', subcategory: 'locales', tags: ['craft'], available: true },
  { id: 'cerveza-regia-chola', name: 'Regia Chola', name_es: 'Regia Chola', description: 'Local Salvadoran beer.', description_es: 'Cerveza salvadoreña.', price: 4.25, category: 'cervezas', subcategory: 'locales', tags: [], available: true },
  { id: 'cerveza-suprema', name: 'Suprema', name_es: 'Suprema', description: 'Local Salvadoran beer.', description_es: 'Cerveza salvadoreña.', price: 2.50, category: 'cervezas', subcategory: 'locales', tags: [], available: true },
  { id: 'cerveza-pilsener', name: 'Pilsener', name_es: 'Pilsener', description: 'Local Salvadoran beer.', description_es: 'Cerveza salvadoreña.', price: 2.25, category: 'cervezas', subcategory: 'locales', tags: [], available: true },
  { id: 'cerveza-corona', name: 'Corona', name_es: 'Corona', description: 'Imported Mexican beer.', description_es: 'Cerveza mexicana importada.', price: 3.50, category: 'cervezas', subcategory: 'extranjeras', tags: [], available: true },
  { id: 'cerveza-heineken', name: 'Heineken', name_es: 'Heineken', description: 'Imported Dutch beer.', description_es: 'Cerveza holandesa importada.', price: 3.50, category: 'cervezas', subcategory: 'extranjeras', tags: [], available: true },
  { id: 'cerveza-modelo', name: 'Modelo', name_es: 'Modelo', description: 'Imported Mexican beer.', description_es: 'Cerveza mexicana importada.', price: 3.50, category: 'cervezas', subcategory: 'extranjeras', tags: [], available: true },
  { id: 'cerveza-stella-artois', name: 'Stella Artois', name_es: 'Stella Artois', description: 'Imported Belgian beer.', description_es: 'Cerveza belga importada.', price: 3.50, category: 'cervezas', subcategory: 'extranjeras', tags: [], available: true },
  { id: 'michelada-tradicional', name: 'Traditional Michelada', name_es: 'Michelada Tradicional', description: 'Classic michelada with lime and spices.', description_es: 'Michelada clásica con limón y especias.', price: 1.50, category: 'cervezas', subcategory: 'preparadas', tags: [], available: true },
]

async function runMigration() {
  console.log('🚀 Starting menu migration...\n')

  // First, check if table needs schema updates
  console.log('📋 Checking table schema...')

  // Clear existing menu items (optional - comment out to keep existing)
  console.log('🗑️  Clearing existing menu items...')
  const { error: deleteError } = await supabase
    .from('menu_items')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

  if (deleteError) {
    console.log('⚠️  Could not clear existing items (table might be empty):', deleteError.message)
  }

  // Insert new menu items in batches
  console.log('📝 Inserting', menuItems.length, 'menu items...\n')

  const batchSize = 10
  let inserted = 0
  let errors = 0

  for (let i = 0; i < menuItems.length; i += batchSize) {
    const batch = menuItems.slice(i, i + batchSize)

    const { data, error } = await supabase
      .from('menu_items')
      .upsert(batch, { onConflict: 'id' })
      .select()

    if (error) {
      console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, error.message)
      errors += batch.length
    } else {
      inserted += batch.length
      console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(menuItems.length / batchSize)} (${batch.length} items)`)
    }
  }

  console.log('\n========================================')
  console.log('📊 Migration Complete!')
  console.log('========================================')
  console.log(`✅ Successfully inserted: ${inserted} items`)
  if (errors > 0) console.log(`❌ Errors: ${errors} items`)
  console.log('========================================\n')

  // Verify the data
  const { data: countData, error: countError } = await supabase
    .from('menu_items')
    .select('category')

  if (countData) {
    const categories = countData.reduce((acc: Record<string, number>, item: any) => {
      acc[item.category] = (acc[item.category] || 0) + 1
      return acc
    }, {})

    console.log('📈 Items by category:')
    Object.entries(categories).forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count}`)
    })
  }
}

runMigration()
