-- Simmer Down - Lago de Coatepeque Menu Data
-- Extracted from SDLAGOFINAL2025.pdf

-- First, update the menu_items table to support new categories
ALTER TABLE menu_items
  ALTER COLUMN category TYPE varchar(50);

-- Add new columns if they don't exist
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS subcategory varchar(50);
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS name_es varchar(255);
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS description_es text;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS price_grand decimal(10,2);
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS tags text[];
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS availability_note text;

-- Clear existing demo data
DELETE FROM menu_items WHERE id IN (
  SELECT id FROM menu_items WHERE name LIKE 'The Salvadoreño%' OR name LIKE 'Margherita DOP%'
);

-- Insert real menu items from Lago de Coatepeque

-- ========== ENTRADAS ==========
INSERT INTO menu_items (id, name, name_es, description, description_es, price, category, subcategory, tags, available, image_url) VALUES
('leche-de-tigra', 'Leche de Tigra', 'Leche de Tigra', 'Fresh fish in tiger milk with glazed sweet potato, corn, purple onion, cilantro, lime juice, and plantain chips.', 'Pescado / Leche de Tigra / Camote Glaseado / Elotitos / Cebolla Morada / Cilantro / Jugo de Limón / Tajadas de Plátano.', 13.99, 'entradas', NULL, ARRAY['seafood', 'signature'], true, 'https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=600&q=80'),
('ceviche-tropical', 'Tropical Ceviche', 'Ceviche Tropical', 'Fresh fish with tropical salsa, purple onion, pineapple, cilantro, and plantain chips.', 'Pescado / Salsa Tropical / Cebolla Morada / Piña / Cilantro / Tajadas de Plátano.', 13.99, 'entradas', NULL, ARRAY['seafood'], true, 'https://images.unsplash.com/photo-1582361171586-2cb89fa27951?w=600&q=80'),
('aguachile-camaron', 'Shrimp Aguachile', 'Aguachile de Camarón', 'Shrimp in aguachile sauce with purple onion, cucumber, cilantro, jalapeño, celery, and plantain chips.', 'Camarón / Salsa Aguachile / Cebolla Morada / Pepino / Cilantro / Chile Jalapeño / Apio / Tajadas de Plátano.', 11.99, 'entradas', NULL, ARRAY['seafood', 'spicy'], true, 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&q=80'),
('molcajete-coulotte', 'Molcajete Coulotte', 'Molcajete Coulotte', 'Coulotte steak with avocado salsa, onion mix, jalapeño, green onion, bone marrow, and tortilla.', 'Carne Coulotte / Salsa Aguacate / Mix de Cebolla / Jalapeño / Cebollín Ají / Tuétano / Tortilla.', 13.99, 'entradas', NULL, ARRAY['beef', 'signature'], true, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80'),
('camarones-empanizados', 'Breaded Shrimp', 'Camarones Empanizados', 'Breaded shrimp with french fries and choice of sauce: Buffalo, Cilantro Parmesan, or Spicy Teriyaki.', 'Camarones / Papas Fritas / Salsa a Elección: Salsa Búfalo, Salsa Cilantro Parmesano, Salsa Teriyaki Picante.', 9.99, 'entradas', NULL, ARRAY['seafood'], true, 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&q=80'),
('patatas-tocino', 'Bacon Potatoes', 'Patatas con Tocino', 'Potato rounds with crunchy bacon, pomodoro sauce, and mozzarella cheese.', 'Rondeles de Papa / Tocino Crunch / Salsa Pomodoro / Queso Mozzarella.', 5.99, 'entradas', NULL, ARRAY[]::text[], true, 'https://images.unsplash.com/photo-1518013431117-eb1465fa5752?w=600&q=80'),
('fundido-camaron-pollo', 'Shrimp & Chicken Fundido', 'Fundido Camarón y Pollo', 'Grilled shrimp and chicken breast with pomodoro sauce, mozzarella cheese, and garlic bread.', 'Camarones / Pechuga al Grill / Salsa Pomodoro / Queso Mozzarella / Pan con Ajo.', 7.99, 'entradas', NULL, ARRAY['seafood', 'chicken'], true, 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&q=80'),
('cheese-balls', 'Cheese Balls', 'Cheese Balls', 'Mixed cheese balls with pomodoro sauce and garlic bread.', 'Bolitas de Mix de Quesos / Salsa Pomodoro / Pan con Ajo.', 6.99, 'entradas', NULL, ARRAY['vegetarian'], true, 'https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=600&q=80');

-- ========== ENSALADAS ==========
INSERT INTO menu_items (id, name, name_es, description, description_es, price, category, subcategory, tags, available, image_url) VALUES
('ensalada-gambas', 'Shrimp Salad', 'Ensalada Gambas', 'Delicious combination of grilled shrimp, lettuce, cherry tomatoes, carrot, cucumber, avocado, sweet corn; served with croutons and pink dressing.', 'Deliciosa combinación de camarones a la plancha, lechugas, tomates cherrys, zanahoria, pepino, aguacate, elote dulce; servida con crotones y aderezo rosa.', 9.99, 'ensaladas', NULL, ARRAY['seafood', 'healthy'], true, 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&q=80'),
('ensalada-criolla', 'Criolla Salad', 'Ensalada Criolla', 'Fresh lettuce, beef tenderloin, avocado, mushrooms, cherry tomatoes, sweet corn, purple onion; served with yogurt cilantro dressing and corn chips.', 'Lechuga fresca, lomito de res, aguacate, champiñones, tomates cherrys, elote dulce, cebolla morada; servida con aderezo yogurlantro y chips de maíz.', 8.99, 'ensaladas', NULL, ARRAY['beef', 'healthy'], true, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80'),
('ensalada-impecable', 'Impeccable Salad', 'Ensalada Impecable', 'Fresh lettuce, grilled chicken breast pieces, green apple, fresh carrot, sweet corn, avocado, bacon, almonds, cherry tomatoes; served with yogurt cilantro dressing and corn chips.', 'Lechuga fresca, trozos de pechuga de pollo a la plancha, manzana verde, zanahoria fresca, elote dulce, aguacate, tocino, almendras, tomates cherry; servida con aderezo yogurlantro y chips de maíz.', 9.99, 'ensaladas', NULL, ARRAY['chicken', 'healthy', 'signature'], true, 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=600&q=80');

-- ========== PASTAS ==========
INSERT INTO menu_items (id, name, name_es, description, description_es, price, category, subcategory, tags, available, image_url) VALUES
('fettuccine-mar-tierra', 'Surf & Turf Fettuccine', 'Fettuccine Mar y Tierra', 'Fettuccine pasta bathed in Alfredo sauce with a delicious fusion of seafood and chicken.', 'Pasta fettuccine bañada en salsa Alfredo con una deliciosa fusión de mariscos y pollo.', 9.99, 'pastas', NULL, ARRAY['seafood', 'chicken'], true, 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=600&q=80'),
('lasagna-bolognesa', 'Lasagna Bolognese', 'Lasagna Bolognesa', 'Traditional combination of pasta filled with Bolognese sauce and a mix of mozzarella and cream cheese.', 'Tradicional combinación de pasta rellena de salsa Bolognesa y un mix de quesos mozzarella y queso crema.', 9.99, 'pastas', NULL, ARRAY['beef'], true, 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=600&q=80'),
('penne-brocoli-tocino', 'Bacon Broccoli Penne', 'Penne Brócoli Tocino', 'Delicious crunchy penne pasta with bacon, broccoli, chicken pieces; bathed in our delicious Alfredo sauce and gratinated mozzarella.', 'Deliciosa pasta penne con tocino crocante, brócoli, trozos de pechuga; bañada con nuestra deliciosa salsa Alfredo y mozzarella gratinado.', 7.99, 'pastas', NULL, ARRAY['chicken'], true, 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&q=80');

-- ========== PIZZAS CLÁSICAS ==========
INSERT INTO menu_items (id, name, name_es, description, description_es, price, price_grand, category, subcategory, tags, available, image_url) VALUES
('pizza-fungie', 'Fungie Pizza', 'Pizza Fungie', 'Vegetarian pizza with onions and mushrooms in chimichurri.', 'Pizza vegetariana de cebollas y hongos al chimichurri.', 5.75, 14.99, 'pizzas', 'clasicas', ARRAY['vegetarian'], true, 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=600&q=80'),
('pizza-con-pina', 'Pineapple Pizza', 'Pizza con Piña', 'Pepperoni, bacon, pineapple, and house basil pesto.', 'Pepperoni, tocino, piña y pesto de albahaca de la casa.', 5.75, 14.99, 'pizzas', 'clasicas', ARRAY[]::text[], true, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80'),
('pizza-maradona', 'Maradona Pizza', 'Pizza Maradona', 'A tribute to a legend! D10S level Argentine chorizo, green peppers, onion, and our special chimichurri.', '¡El tributo a una leyenda! Chorizo argentino nivel D10S, pimientos verdes, cebolla y nuestro especial chimichurri.', 5.75, 14.99, 'pizzas', 'clasicas', ARRAY['signature', 'spicy'], true, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80'),
('pizza-brazuca', 'Brazuca Pizza', 'Pizza Brazuca', 'A fusion of pineapple and salami; covered in garlic sauce and jalapeños.', 'Una fusión de piña y salami; cubierto en salsa de ajo y jalapeños.', 5.75, 14.99, 'pizzas', 'clasicas', ARRAY['spicy'], true, 'https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=600&q=80'),
('pizza-vegetariana', 'Vegetarian Pizza', 'Pizza Vegetariana', 'Green peppers, onion, fresh tomatoes, mushrooms, carrot slices, and marinated broccoli.', 'Pimientos verdes, cebolla, tomates frescos, champiñones, lascas de zanahoria y brócoli marinados.', 5.75, 14.99, 'pizzas', 'clasicas', ARRAY['vegetarian'], true, 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=600&q=80'),
('pizza-picollo', 'Picollo Pizza', 'Pizza Picollo', 'Marinated chicken breast on the grill, garlic sauce, and a touch of cilantro.', 'Pechuga marinada al grill, salsa de ajo y un toque de cilantro.', 5.75, 14.99, 'pizzas', 'clasicas', ARRAY['chicken'], true, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80'),
('pizza-jamon-pepperoni', 'Ham or Pepperoni Pizza', 'Pizza Jamón o Pepperoni', 'Classic ham or pepperoni pizza.', 'Clásica pizza de jamón o pepperoni.', 5.75, 14.99, 'pizzas', 'clasicas', ARRAY[]::text[], true, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&q=80'),
('pizza-margherita', 'Margherita Pizza', 'Pizza Margherita', 'Marinated cherry tomatoes and fresh basil.', 'Tomates cherrys marinados y albahaca fresca.', 5.75, 14.99, 'pizzas', 'clasicas', ARRAY['vegetarian'], true, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80'),
('pizza-hawaiana', 'Hawaiian Pizza', 'Pizza Hawaiana', 'Ham, pineapple, roasted peppers covered with mozzarella and cheddar.', 'Jamón, piña, pimientos asados cubiertos de mozzarella y cheddar.', 5.75, 14.99, 'pizzas', 'clasicas', ARRAY[]::text[], true, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80'),
('pizza-verde-mella', 'Verde Mella Pizza', 'Pizza Verde Mella', 'Grilled chicken fajitas, green apple, almond slices, and bacon.', 'Fajitas de pollo al grill, manzana verde, rebanadas de almendras y tocino.', 5.75, 14.99, 'pizzas', 'clasicas', ARRAY['chicken'], true, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80'),
('pizza-loroka', 'La Loroka Pizza', 'Pizza La Loroka', 'As simple as: loroco, bacon, and pepperoni.', 'Así de simple: loroco, tocino y pepperoni.', 5.75, 14.99, 'pizzas', 'clasicas', ARRAY['signature'], true, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80'),
('pizza-cuatro-quesos', 'Four Cheese Pizza', 'Pizza Qu4tro Quesos', 'Special Creole cheese, Parmesan, mozzarella, Philadelphia cheese, and fresh basil.', 'Queso criollo especial, parmesano, mozzarella, queso Philadelphia y albahaca fresca.', 5.75, 14.99, 'pizzas', 'clasicas', ARRAY['vegetarian'], true, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80');

-- ========== PIZZAS ESPECIALES ==========
INSERT INTO menu_items (id, name, name_es, description, description_es, price, price_grand, category, subcategory, tags, available, image_url) VALUES
('pizza-ghiottone', 'Ghiottone Pizza', 'Pizza Ghiottone', 'Pepperoni, onion, tomato, salami, ham, pepperoni, chorizo, black olives, and natural mushrooms.', 'Pepperoni, cebolla, tomate, salami, jamón, pepperoni, chorizo, aceitunas negras y hongos naturales.', 8.25, 17.99, 'pizzas', 'especiales', ARRAY['signature'], true, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80'),
('pizza-memorable', 'La Memorable Pizza', 'Pizza La Memorable', 'Chicken breast slices, marinated onion, sweet corn, covered in our BBQ sauce with a touch of aioli.', 'Rajas de rey pollo, cebolla marinada, elotito amarilla, cubierta en nuestra salsa BBQ, con un toque de aijoili.', 8.25, 17.99, 'pizzas', 'especiales', ARRAY['chicken', 'signature'], true, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80'),
('pizza-don-cangrejo', 'Don Cangrejo Pizza', 'Pizza Don Cangrejo', 'Fresh shrimp and marinated clams, onion, green peppers, with a touch of fresh Alfredo.', 'Camarones frescos y almejas marinados, cebolla, pimientos verdes, con un toque de Alfredo fresco.', 8.25, 17.99, 'pizzas', 'especiales', ARRAY['seafood'], true, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80'),
('pizza-pescattore', 'La Pescattore Pizza', 'Pizza La Pescattore', 'Calamari, clams, shrimp, onion, and smoked paprika.', 'Calamari, almejas, camarones, cebolla y pimentón ahumado.', 8.25, 17.99, 'pizzas', 'especiales', ARRAY['seafood'], true, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80'),
('pizza-punta-jalapena', 'Punta Jalapeña Pizza', 'Pizza Punta Jalapeña', 'Beef tenderloin, mozzarella, mushrooms, and our delicious spicy salsa.', 'Lomito de res, mozzarella, hongos y nuestra deliciosa salsa picante.', 8.25, 17.99, 'pizzas', 'especiales', ARRAY['beef', 'spicy'], true, 'https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=600&q=80'),
('pizza-campesina', 'La Campesina Pizza', 'Pizza La Campesina', 'Iberian pork fajitas, mozzarella with fried beans, avocado sauce, and a touch of fresh cilantro.', 'Fajitas de res, chorizo ibérico, cubierta de mozzarella, decorada con frijoles fritos, salsa de aguacate y un toque de cilantro fresco; acompañada de cebolla encurtida.', 8.25, 17.99, 'pizzas', 'especiales', ARRAY['beef', 'signature'], true, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80'),
('pizza-gamberetti', 'Gamberetti Pizza', 'Pizza Gamberetti', 'Fresh shrimp, pineapple, Alfredo sauce and basil pesto.', 'Camarones frescos, piña, salsa Alfredo y pesto de albahaca.', 8.25, 17.99, 'pizzas', 'especiales', ARRAY['seafood'], true, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80');

-- ========== PLATOS FUERTES ==========
INSERT INTO menu_items (id, name, name_es, description, description_es, price, category, subcategory, tags, available, availability_note, image_url) VALUES
('terramar-maitre', 'Terramar al Maître', 'Terramar al Maître', 'Combination of beef tenderloin and jumbo shrimp; accompanied by potato rounds, vegetables, and crowned with our Maître butter.', 'Combinación de lomito de res y camarones jumbo; acompañado de rondeles de papa, vegetales y coronado con nuestra mantequilla Maître.', 22.50, 'platos-fuertes', NULL, ARRAY['beef', 'seafood', 'signature'], true, NULL, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80'),
('medallon-lomito-maitre', 'Beef Medallion al Maître', 'Medallón de Lomito al Maître', 'New York style cut wrapped in bacon; accompanied by sautéed mushrooms and cherry tomatoes; crowned with our Maître butter.', 'Corte estilo New York albardado con tocino; acompañado de salteado de hongos y cherrys; coronado con nuestra mantequilla Maître.', 19.99, 'platos-fuertes', NULL, ARRAY['beef', 'signature'], true, NULL, 'https://images.unsplash.com/photo-1558030006-450675393462?w=600&q=80'),
('mariskada', 'Mariskada', 'Mariskada', 'Traditional seafood soup prepared with shrimp, clams, calamari, and fish; in a creamy coconut broth with local spices.', 'Tradicional sopa mariskada preparada con camarones, almejas, calamares, mejillones y pescado; en un caldo cremoso de coco con especies locales.', 17.99, 'platos-fuertes', NULL, ARRAY['seafood'], true, 'Disponible: Sábado y Domingo', 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80'),
('pechuga-capresse', 'Capresse Chicken Breast', 'Pechuga Capresse', 'Delicious chicken breast stuffed with mozzarella cheese, dehydrated tomatoes, and pesto; on a bed of mashed potatoes with vegetables.', 'Deliciosa pechuga rellena de queso mozzarella, tomates deshidratados y pesto; en una cama de puré de papa con vegetales.', 14.99, 'platos-fuertes', NULL, ARRAY['chicken'], true, NULL, 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&q=80'),
('hamburguesa-casanova', 'Casanova Burger', 'Hamburguesa Casanova', 'Double 100% beef patty, bacon fusion, mushrooms and purple onion, covered with melted mozzarella cheese; accompanied by French fries.', 'Doble carne 100% res, fusión de tocino, hongos y cebolla morada, cubierta de queso mozzarella derretido; acompañado de papas francesas.', 12.50, 'platos-fuertes', NULL, ARRAY['beef', 'signature'], true, NULL, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80'),
('pescado-parrilla', 'Grilled Fish', 'Pescado a la Parrilla', 'Whole grilled fish with chimichurri, fried tortillas, and pickled onion.', 'Pescado entero a la parrilla, con chimichurri, tortillas fritas y cebolla encurtida.', 22.50, 'platos-fuertes', NULL, ARRAY['seafood'], true, NULL, 'https://images.unsplash.com/photo-1534766555764-ce878a5e3a2b?w=600&q=80');

-- ========== MENÚ INFANTIL ==========
INSERT INTO menu_items (id, name, name_es, description, description_es, price, category, subcategory, tags, available, image_url) VALUES
('chunks-pollo', 'Chicken Chunks', 'Chunks de Pollo', 'Breaded chicken breast pieces; accompanied with French fries and drink.', 'Trozos de pechugas empanizados; acompañados con papas francesas y té.', 5.99, 'menu-infantil', NULL, ARRAY['chicken', 'kids'], true, 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&q=80'),
('cangreburguer', 'Cangreburguer', 'Cangreburguer', 'Traditional chicken burger; accompanied with French fries and drink.', 'Hamburguesa tradicional de pollo; acompañada de papas francesas y té.', 5.50, 'menu-infantil', NULL, ARRAY['chicken', 'kids'], true, 'https://images.unsplash.com/photo-1550317138-10000687a72b?w=600&q=80');

-- ========== BEBIDAS ==========
INSERT INTO menu_items (id, name, name_es, description, description_es, price, category, subcategory, tags, available, image_url) VALUES
('frozen-positive-vibration', 'Positive Vibration Frozen', 'Frozen Positive Vibration', 'Tri-color layered frozen: kiwi, mango, and strawberry.', 'Frozen tricolor: kiwi, mango y fresa.', 3.75, 'bebidas', 'frozen', ARRAY['signature'], true, NULL),
('frozen-pina', 'Pineapple Frozen', 'Frozen Piña', 'Refreshing pineapple frozen drink.', 'Refrescante bebida frozen de piña.', 3.75, 'bebidas', 'frozen', ARRAY[]::text[], true, NULL),
('frozen-fresa', 'Strawberry Frozen', 'Frozen Fresa', 'Refreshing strawberry frozen drink.', 'Refrescante bebida frozen de fresa.', 3.75, 'bebidas', 'frozen', ARRAY[]::text[], true, NULL),
('frozen-maracuya', 'Passion Fruit Frozen', 'Frozen Maracuyá', 'Refreshing passion fruit frozen drink.', 'Refrescante bebida frozen de maracuyá.', 3.75, 'bebidas', 'frozen', ARRAY[]::text[], true, NULL),
('limonada-tradicional', 'Traditional Lemonade', 'Limonada Tradicional', 'Classic fresh lemonade.', 'Limonada fresca tradicional.', 3.25, 'bebidas', 'limonadas', ARRAY[]::text[], true, NULL),
('limonada-fresa', 'Strawberry Lemonade', 'Limonada Fresa', 'Fresh lemonade with strawberry.', 'Limonada fresca con fresa.', 3.25, 'bebidas', 'limonadas', ARRAY[]::text[], true, NULL),
('limonada-hierba-buena', 'Mint Lemonade', 'Limonada Hierba Buena', 'Fresh lemonade with mint.', 'Limonada fresca con hierba buena.', 3.25, 'bebidas', 'limonadas', ARRAY[]::text[], true, NULL),
('tamarindo', 'Tamarind Drink', 'Tamarindo', '100% natural tamarind drink.', 'Refresco de tamarindo 100% natural.', 2.95, 'bebidas', 'refrescos', ARRAY[]::text[], true, NULL),
('horchata', 'Horchata', 'Horchata', 'Traditional horchata drink.', 'Refresco de horchata tradicional.', 2.95, 'bebidas', 'refrescos', ARRAY[]::text[], true, NULL),
('te-durazno', 'Peach Tea', 'Té Durazno', 'Fresh peach iced tea.', 'Té helado de durazno.', 2.95, 'bebidas', 'refrescos', ARRAY[]::text[], true, NULL),
('agua', 'Water', 'Agua', 'Bottled water 600ml.', 'Agua embotellada 600ml.', 1.99, 'bebidas', 'otros', ARRAY[]::text[], true, NULL),
('sodas', 'Sodas', 'Sodas', 'Assorted sodas.', 'Sodas variadas.', 1.99, 'bebidas', 'otros', ARRAY[]::text[], true, NULL),
('cafe-americano', 'Americano', 'Café Americano', 'Classic American coffee.', 'Café americano clásico.', 1.50, 'bebidas', 'calientes', ARRAY[]::text[], true, NULL),
('cappuccino', 'Cappuccino', 'Cappuccino', 'Classic cappuccino.', 'Cappuccino clásico.', 2.99, 'bebidas', 'calientes', ARRAY[]::text[], true, NULL),
('latte', 'Latte', 'Latte', 'Classic latte.', 'Latte clásico.', 2.99, 'bebidas', 'calientes', ARRAY[]::text[], true, NULL),
('chocolate-caliente', 'Hot Chocolate', 'Chocolate', 'Hot chocolate.', 'Chocolate caliente.', 2.99, 'bebidas', 'calientes', ARRAY[]::text[], true, NULL);

-- ========== POSTRES ==========
INSERT INTO menu_items (id, name, name_es, description, description_es, price, category, subcategory, tags, available, image_url) VALUES
('brownie-helado', 'Brownie with Ice Cream', 'Brownie con Helado', 'Warm brownie with vanilla ice cream, chocolate drizzle, and almonds.', 'Brownie caliente con helado de vainilla, salsa de chocolate y almendras.', 3.99, 'postres', NULL, ARRAY['signature'], true, 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=600&q=80'),
('ganache-chocolate', 'Chocolate Ganache', 'Ganache de Chocolate', 'Rich chocolate ganache dessert.', 'Delicioso postre de ganache de chocolate.', 3.99, 'postres', NULL, ARRAY[]::text[], true, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&q=80'),
('cheesecake-fresa', 'Strawberry Cheesecake', 'Cheesecake de Fresa', 'Creamy strawberry cheesecake.', 'Cremoso cheesecake de fresa.', 3.99, 'postres', NULL, ARRAY[]::text[], true, 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&q=80'),
('panna-cotta', 'Panna Cotta', 'Panna Cotta', 'Classic Italian panna cotta with red fruits.', 'Clásica panna cotta italiana con frutos rojos.', 3.99, 'postres', NULL, ARRAY['signature'], true, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80');

-- ========== CERVEZAS ==========
INSERT INTO menu_items (id, name, name_es, description, description_es, price, category, subcategory, tags, available, image_url) VALUES
('cerveza-puente-quemado', 'Puente Quemado', 'Puente Quemado', 'Artisanal beer from Santa Ana.', 'Cerveza artesanal Santaneca.', 5.00, 'cervezas', 'locales', ARRAY['craft'], true, NULL),
('cerveza-regia-chola', 'Regia Chola', 'Regia Chola', 'Local Salvadoran beer.', 'Cerveza salvadoreña.', 4.25, 'cervezas', 'locales', ARRAY[]::text[], true, NULL),
('cerveza-suprema', 'Suprema', 'Suprema', 'Local Salvadoran beer.', 'Cerveza salvadoreña.', 2.50, 'cervezas', 'locales', ARRAY[]::text[], true, NULL),
('cerveza-pilsener', 'Pilsener', 'Pilsener', 'Local Salvadoran beer.', 'Cerveza salvadoreña.', 2.25, 'cervezas', 'locales', ARRAY[]::text[], true, NULL),
('cerveza-corona', 'Corona', 'Corona', 'Imported Mexican beer.', 'Cerveza mexicana importada.', 3.50, 'cervezas', 'extranjeras', ARRAY[]::text[], true, NULL),
('cerveza-heineken', 'Heineken', 'Heineken', 'Imported Dutch beer.', 'Cerveza holandesa importada.', 3.50, 'cervezas', 'extranjeras', ARRAY[]::text[], true, NULL),
('cerveza-modelo', 'Modelo', 'Modelo', 'Imported Mexican beer.', 'Cerveza mexicana importada.', 3.50, 'cervezas', 'extranjeras', ARRAY[]::text[], true, NULL),
('cerveza-stella-artois', 'Stella Artois', 'Stella Artois', 'Imported Belgian beer.', 'Cerveza belga importada.', 3.50, 'cervezas', 'extranjeras', ARRAY[]::text[], true, NULL),
('michelada-tradicional', 'Traditional Michelada', 'Michelada Tradicional', 'Classic michelada with lime and spices.', 'Michelada clásica con limón y especias.', 1.50, 'cervezas', 'preparadas', ARRAY[]::text[], true, NULL);

-- Done!
