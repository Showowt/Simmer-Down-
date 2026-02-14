// Simplified migration using only existing columns
// Usage: npx tsx scripts/run-migration-simple.ts

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
})

// Menu items using only existing columns: id, name, description, price, image_url, category, available
const menuItems = [
  // ENTRADAS
  { id: 'leche-de-tigra', name: 'Leche de Tigra', description: 'Pescado / Leche de Tigra / Camote Glaseado / Elotitos / Cebolla Morada / Cilantro / Jugo de Limón / Tajadas de Plátano.', price: 13.99, category: 'entradas', available: true, image_url: 'https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=600&q=80' },
  { id: 'ceviche-tropical', name: 'Ceviche Tropical', description: 'Pescado / Salsa Tropical / Cebolla Morada / Piña / Cilantro / Tajadas de Plátano.', price: 13.99, category: 'entradas', available: true, image_url: 'https://images.unsplash.com/photo-1582361171586-2cb89fa27951?w=600&q=80' },
  { id: 'aguachile-camaron', name: 'Aguachile de Camarón', description: 'Camarón / Salsa Aguachile / Cebolla Morada / Pepino / Cilantro / Chile Jalapeño / Apio / Tajadas de Plátano.', price: 11.99, category: 'entradas', available: true, image_url: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&q=80' },
  { id: 'molcajete-coulotte', name: 'Molcajete Coulotte', description: 'Carne Coulotte / Salsa Aguacate / Mix de Cebolla / Jalapeño / Cebollín Ají / Tuétano / Tortilla.', price: 13.99, category: 'entradas', available: true, image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80' },
  { id: 'camarones-empanizados', name: 'Camarones Empanizados', description: 'Camarones / Papas Fritas / Salsa a Elección: Salsa Búfalo, Salsa Cilantro Parmesano, Salsa Teriyaki Picante.', price: 9.99, category: 'entradas', available: true, image_url: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&q=80' },
  { id: 'patatas-tocino', name: 'Patatas con Tocino', description: 'Rondeles de Papa / Tocino Crunch / Salsa Pomodoro / Queso Mozzarella.', price: 5.99, category: 'entradas', available: true, image_url: 'https://images.unsplash.com/photo-1518013431117-eb1465fa5752?w=600&q=80' },
  { id: 'fundido-camaron-pollo', name: 'Fundido Camarón y Pollo', description: 'Camarones / Pechuga al Grill / Salsa Pomodoro / Queso Mozzarella / Pan con Ajo.', price: 7.99, category: 'entradas', available: true, image_url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&q=80' },
  { id: 'cheese-balls', name: 'Cheese Balls', description: 'Bolitas de Mix de Quesos / Salsa Pomodoro / Pan con Ajo.', price: 6.99, category: 'entradas', available: true, image_url: 'https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=600&q=80' },

  // ENSALADAS
  { id: 'ensalada-gambas', name: 'Ensalada Gambas', description: 'Camarones a la plancha, lechugas, tomates cherrys, zanahoria, pepino, aguacate, elote dulce; servida con crotones y aderezo rosa.', price: 9.99, category: 'ensaladas', available: true, image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&q=80' },
  { id: 'ensalada-criolla', name: 'Ensalada Criolla', description: 'Lechuga fresca, lomito de res, aguacate, champiñones, tomates cherrys, elote dulce, cebolla morada; servida con aderezo yogurlantro y chips de maíz.', price: 8.99, category: 'ensaladas', available: true, image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80' },
  { id: 'ensalada-impecable', name: 'Ensalada Impecable', description: 'Lechuga fresca, trozos de pechuga de pollo a la plancha, manzana verde, zanahoria fresca, elote dulce, aguacate, tocino, almendras.', price: 9.99, category: 'ensaladas', available: true, image_url: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=600&q=80' },

  // PASTAS
  { id: 'fettuccine-mar-tierra', name: 'Fettuccine Mar y Tierra', description: 'Pasta fettuccine bañada en salsa Alfredo con una deliciosa fusión de mariscos y pollo.', price: 9.99, category: 'pastas', available: true, image_url: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=600&q=80' },
  { id: 'lasagna-bolognesa', name: 'Lasagna Bolognesa', description: 'Tradicional combinación de pasta rellena de salsa Bolognesa y un mix de quesos mozzarella y queso crema.', price: 9.99, category: 'pastas', available: true, image_url: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=600&q=80' },
  { id: 'penne-brocoli-tocino', name: 'Penne Brócoli Tocino', description: 'Pasta penne con tocino crocante, brócoli, trozos de pechuga; bañada con salsa Alfredo y mozzarella gratinado.', price: 7.99, category: 'pastas', available: true, image_url: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&q=80' },

  // PIZZAS
  { id: 'pizza-fungie', name: 'Pizza Fungie', description: 'Pizza vegetariana de cebollas y hongos al chimichurri. Personal $5.75 / Grande $14.99', price: 5.75, category: 'pizzas', available: true, image_url: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=600&q=80' },
  { id: 'pizza-maradona', name: 'Pizza Maradona', description: '¡El tributo a una leyenda! Chorizo argentino nivel D10S, pimientos verdes, cebolla y chimichurri. Personal $5.75 / Grande $14.99', price: 5.75, category: 'pizzas', available: true, image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80' },
  { id: 'pizza-brazuca', name: 'Pizza Brazuca', description: 'Fusión de piña y salami; cubierto en salsa de ajo y jalapeños. Personal $5.75 / Grande $14.99', price: 5.75, category: 'pizzas', available: true, image_url: 'https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=600&q=80' },
  { id: 'pizza-vegetariana', name: 'Pizza Vegetariana', description: 'Pimientos verdes, cebolla, tomates frescos, champiñones, lascas de zanahoria y brócoli. Personal $5.75 / Grande $14.99', price: 5.75, category: 'pizzas', available: true, image_url: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=600&q=80' },
  { id: 'pizza-picollo', name: 'Pizza Picollo', description: 'Pechuga marinada al grill, salsa de ajo y un toque de cilantro. Personal $5.75 / Grande $14.99', price: 5.75, category: 'pizzas', available: true, image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80' },
  { id: 'pizza-jamon-pepperoni', name: 'Pizza Jamón o Pepperoni', description: 'Clásica pizza de jamón o pepperoni. Personal $5.75 / Grande $14.99', price: 5.75, category: 'pizzas', available: true, image_url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&q=80' },
  { id: 'pizza-margherita', name: 'Pizza Margherita', description: 'Tomates cherrys marinados y albahaca fresca. Personal $5.75 / Grande $14.99', price: 5.75, category: 'pizzas', available: true, image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80' },
  { id: 'pizza-hawaiana', name: 'Pizza Hawaiana', description: 'Jamón, piña, pimientos asados cubiertos de mozzarella y cheddar. Personal $5.75 / Grande $14.99', price: 5.75, category: 'pizzas', available: true, image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80' },
  { id: 'pizza-verde-mella', name: 'Pizza Verde Mella', description: 'Fajitas de pollo al grill, manzana verde, rebanadas de almendras y tocino. Personal $5.75 / Grande $14.99', price: 5.75, category: 'pizzas', available: true, image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80' },
  { id: 'pizza-loroka', name: 'Pizza La Loroka', description: 'Loroco, tocino y pepperoni. Personal $5.75 / Grande $14.99', price: 5.75, category: 'pizzas', available: true, image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80' },
  { id: 'pizza-cuatro-quesos', name: 'Pizza Qu4tro Quesos', description: 'Queso criollo especial, parmesano, mozzarella, queso Philadelphia y albahaca fresca. Personal $5.75 / Grande $14.99', price: 5.75, category: 'pizzas', available: true, image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80' },
  { id: 'pizza-ghiottone', name: 'Pizza Ghiottone (Especial)', description: 'Pepperoni, cebolla, tomate, salami, jamón, chorizo, aceitunas negras y hongos naturales. Personal $8.25 / Grande $17.99', price: 8.25, category: 'pizzas', available: true, image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80' },
  { id: 'pizza-memorable', name: 'Pizza La Memorable (Especial)', description: 'Rajas de pollo, cebolla marinada, elotito, cubierta en salsa BBQ. Personal $8.25 / Grande $17.99', price: 8.25, category: 'pizzas', available: true, image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80' },
  { id: 'pizza-don-cangrejo', name: 'Pizza Don Cangrejo (Especial)', description: 'Camarones frescos y almejas marinados, cebolla, pimientos verdes, con Alfredo. Personal $8.25 / Grande $17.99', price: 8.25, category: 'pizzas', available: true, image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80' },
  { id: 'pizza-pescattore', name: 'Pizza La Pescattore (Especial)', description: 'Calamari, almejas, camarones, cebolla y pimentón ahumado. Personal $8.25 / Grande $17.99', price: 8.25, category: 'pizzas', available: true, image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80' },
  { id: 'pizza-campesina', name: 'Pizza La Campesina (Especial)', description: 'Fajitas de res, chorizo ibérico, mozzarella, frijoles fritos, salsa de aguacate. Personal $8.25 / Grande $17.99', price: 8.25, category: 'pizzas', available: true, image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80' },
  { id: 'pizza-gamberetti', name: 'Pizza Gamberetti (Especial)', description: 'Camarones frescos, piña, salsa Alfredo y pesto de albahaca. Personal $8.25 / Grande $17.99', price: 8.25, category: 'pizzas', available: true, image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80' },

  // PLATOS FUERTES
  { id: 'terramar-maitre', name: 'Terramar al Maître', description: 'Combinación de lomito de res y camarones jumbo; acompañado de rondeles de papa, vegetales y mantequilla Maître.', price: 22.50, category: 'platos-fuertes', available: true, image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80' },
  { id: 'medallon-lomito-maitre', name: 'Medallón de Lomito al Maître', description: 'Corte estilo New York albardado con tocino; acompañado de salteado de hongos y cherrys; coronado con mantequilla Maître.', price: 19.99, category: 'platos-fuertes', available: true, image_url: 'https://images.unsplash.com/photo-1558030006-450675393462?w=600&q=80' },
  { id: 'mariskada', name: 'Mariskada', description: 'Sopa mariskada con camarones, almejas, calamares y pescado; en caldo cremoso de coco. Disponible: Sábado y Domingo', price: 17.99, category: 'platos-fuertes', available: true, image_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80' },
  { id: 'pechuga-capresse', name: 'Pechuga Capresse', description: 'Pechuga rellena de queso mozzarella, tomates deshidratados y pesto; en una cama de puré de papa.', price: 14.99, category: 'platos-fuertes', available: true, image_url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&q=80' },
  { id: 'hamburguesa-casanova', name: 'Hamburguesa Casanova', description: 'Doble carne 100% res, fusión de tocino, hongos y cebolla morada, queso mozzarella; con papas francesas.', price: 12.50, category: 'platos-fuertes', available: true, image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80' },
  { id: 'pescado-parrilla', name: 'Pescado a la Parrilla', description: 'Pescado entero a la parrilla, con chimichurri, tortillas fritas y cebolla encurtida.', price: 22.50, category: 'platos-fuertes', available: true, image_url: 'https://images.unsplash.com/photo-1534766555764-ce878a5e3a2b?w=600&q=80' },

  // BEBIDAS
  { id: 'frozen-positive-vibration', name: 'Frozen Positive Vibration', description: 'Frozen tricolor: kiwi, mango y fresa.', price: 3.75, category: 'bebidas', available: true, image_url: null },
  { id: 'frozen-pina', name: 'Frozen Piña', description: 'Refrescante bebida frozen de piña.', price: 3.75, category: 'bebidas', available: true, image_url: null },
  { id: 'frozen-fresa', name: 'Frozen Fresa', description: 'Refrescante bebida frozen de fresa.', price: 3.75, category: 'bebidas', available: true, image_url: null },
  { id: 'frozen-maracuya', name: 'Frozen Maracuyá', description: 'Refrescante bebida frozen de maracuyá.', price: 3.75, category: 'bebidas', available: true, image_url: null },
  { id: 'limonada-tradicional', name: 'Limonada Tradicional', description: 'Limonada fresca tradicional.', price: 3.25, category: 'bebidas', available: true, image_url: null },
  { id: 'limonada-fresa', name: 'Limonada Fresa', description: 'Limonada fresca con fresa.', price: 3.25, category: 'bebidas', available: true, image_url: null },
  { id: 'limonada-hierba-buena', name: 'Limonada Hierba Buena', description: 'Limonada fresca con hierba buena.', price: 3.25, category: 'bebidas', available: true, image_url: null },
  { id: 'tamarindo', name: 'Tamarindo', description: 'Refresco de tamarindo 100% natural.', price: 2.95, category: 'bebidas', available: true, image_url: null },
  { id: 'horchata', name: 'Horchata', description: 'Refresco de horchata tradicional.', price: 2.95, category: 'bebidas', available: true, image_url: null },
  { id: 'te-durazno', name: 'Té Durazno', description: 'Té helado de durazno.', price: 2.95, category: 'bebidas', available: true, image_url: null },
  { id: 'agua', name: 'Agua', description: 'Agua embotellada 600ml.', price: 1.99, category: 'bebidas', available: true, image_url: null },
  { id: 'sodas', name: 'Sodas', description: 'Sodas variadas.', price: 1.99, category: 'bebidas', available: true, image_url: null },
  { id: 'cafe-americano', name: 'Café Americano', description: 'Café americano clásico.', price: 1.50, category: 'bebidas', available: true, image_url: null },
  { id: 'cappuccino', name: 'Cappuccino', description: 'Cappuccino clásico.', price: 2.99, category: 'bebidas', available: true, image_url: null },
  { id: 'latte', name: 'Latte', description: 'Latte clásico.', price: 2.99, category: 'bebidas', available: true, image_url: null },
  { id: 'chocolate-caliente', name: 'Chocolate', description: 'Chocolate caliente.', price: 2.99, category: 'bebidas', available: true, image_url: null },

  // POSTRES
  { id: 'brownie-helado', name: 'Brownie con Helado', description: 'Brownie caliente con helado de vainilla, salsa de chocolate y almendras.', price: 3.99, category: 'postres', available: true, image_url: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=600&q=80' },
  { id: 'ganache-chocolate', name: 'Ganache de Chocolate', description: 'Delicioso postre de ganache de chocolate.', price: 3.99, category: 'postres', available: true, image_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&q=80' },
  { id: 'cheesecake-fresa', name: 'Cheesecake de Fresa', description: 'Cremoso cheesecake de fresa.', price: 3.99, category: 'postres', available: true, image_url: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&q=80' },
  { id: 'panna-cotta', name: 'Panna Cotta', description: 'Clásica panna cotta italiana con frutos rojos.', price: 3.99, category: 'postres', available: true, image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80' },

  // CERVEZAS
  { id: 'cerveza-puente-quemado', name: 'Puente Quemado', description: 'Cerveza artesanal Santaneca.', price: 5.00, category: 'cervezas', available: true, image_url: null },
  { id: 'cerveza-regia-chola', name: 'Regia Chola', description: 'Cerveza salvadoreña.', price: 4.25, category: 'cervezas', available: true, image_url: null },
  { id: 'cerveza-suprema', name: 'Suprema', description: 'Cerveza salvadoreña.', price: 2.50, category: 'cervezas', available: true, image_url: null },
  { id: 'cerveza-pilsener', name: 'Pilsener', description: 'Cerveza salvadoreña.', price: 2.25, category: 'cervezas', available: true, image_url: null },
  { id: 'cerveza-corona', name: 'Corona', description: 'Cerveza mexicana importada.', price: 3.50, category: 'cervezas', available: true, image_url: null },
  { id: 'cerveza-heineken', name: 'Heineken', description: 'Cerveza holandesa importada.', price: 3.50, category: 'cervezas', available: true, image_url: null },
  { id: 'cerveza-modelo', name: 'Modelo', description: 'Cerveza mexicana importada.', price: 3.50, category: 'cervezas', available: true, image_url: null },
  { id: 'cerveza-stella-artois', name: 'Stella Artois', description: 'Cerveza belga importada.', price: 3.50, category: 'cervezas', available: true, image_url: null },
  { id: 'michelada-tradicional', name: 'Michelada Tradicional', description: 'Michelada clásica con limón y especias.', price: 1.50, category: 'cervezas', available: true, image_url: null },

  // MENÚ INFANTIL
  { id: 'chunks-pollo', name: 'Chunks de Pollo', description: 'Trozos de pechugas empanizados; acompañados con papas francesas y té.', price: 5.99, category: 'menu-infantil', available: true, image_url: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&q=80' },
  { id: 'cangreburguer', name: 'Cangreburguer', description: 'Hamburguesa tradicional de pollo; acompañada de papas francesas y té.', price: 5.50, category: 'menu-infantil', available: true, image_url: 'https://images.unsplash.com/photo-1550317138-10000687a72b?w=600&q=80' },
]

async function runMigration() {
  console.log('🚀 Starting simplified menu migration...\n')

  // Clear existing menu items
  console.log('🗑️  Clearing existing menu items...')
  const { error: deleteError } = await supabase
    .from('menu_items')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')

  if (deleteError) {
    console.log('⚠️  Could not clear existing items:', deleteError.message)
  }

  // Insert new menu items in batches
  console.log('📝 Inserting', menuItems.length, 'menu items...\n')

  const batchSize = 10
  let inserted = 0
  let errors = 0

  for (let i = 0; i < menuItems.length; i += batchSize) {
    // Remove the id field from each item - let Supabase auto-generate UUIDs
    const batch = menuItems.slice(i, i + batchSize).map(({ id, ...rest }) => rest)

    const { data, error } = await supabase
      .from('menu_items')
      .insert(batch)
      .select()

    if (error) {
      console.error(`❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error.message)
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
  const { data: countData } = await supabase
    .from('menu_items')
    .select('category')

  if (countData) {
    const categories = countData.reduce((acc: Record<string, number>, item: any) => {
      acc[item.category] = (acc[item.category] || 0) + 1
      return acc
    }, {})

    console.log('📈 Items by category:')
    Object.entries(categories).sort().forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count}`)
    })
  }
}

runMigration()
