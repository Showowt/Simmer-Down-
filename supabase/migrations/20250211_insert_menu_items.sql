-- Simmer Down Pizza - Lago de Coatepeque Menu
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/qusvynxzslpmjoqfabyq/sql

-- Clear existing menu items first
DELETE FROM menu_items;

-- ENTRADAS
INSERT INTO menu_items (name, description, price, category, available, image_url) VALUES
('Leche de Tigra', 'Pescado / Leche de Tigra / Camote Glaseado / Elotitos / Cebolla Morada / Cilantro / Jugo de Limón / Tajadas de Plátano.', 13.99, 'entradas', true, 'https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=600&q=80'),
('Ceviche Tropical', 'Pescado / Salsa Tropical / Cebolla Morada / Piña / Cilantro / Tajadas de Plátano.', 13.99, 'entradas', true, 'https://images.unsplash.com/photo-1582361171586-2cb89fa27951?w=600&q=80'),
('Aguachile de Camarón', 'Camarón / Salsa Aguachile / Cebolla Morada / Pepino / Cilantro / Chile Jalapeño / Apio / Tajadas de Plátano.', 11.99, 'entradas', true, 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&q=80'),
('Molcajete Coulotte', 'Carne Coulotte / Salsa Aguacate / Mix de Cebolla / Jalapeño / Cebollín Ají / Tuétano / Tortilla.', 13.99, 'entradas', true, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80'),
('Camarones Empanizados', 'Camarones / Papas Fritas / Salsa a Elección: Salsa Búfalo, Salsa Cilantro Parmesano, Salsa Teriyaki Picante.', 9.99, 'entradas', true, 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&q=80'),
('Patatas con Tocino', 'Rondeles de Papa / Tocino Crunch / Salsa Pomodoro / Queso Mozzarella.', 5.99, 'entradas', true, 'https://images.unsplash.com/photo-1518013431117-eb1465fa5752?w=600&q=80'),
('Fundido Camarón y Pollo', 'Camarones / Pechuga al Grill / Salsa Pomodoro / Queso Mozzarella / Pan con Ajo.', 7.99, 'entradas', true, 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&q=80'),
('Cheese Balls', 'Bolitas de Mix de Quesos / Salsa Pomodoro / Pan con Ajo.', 6.99, 'entradas', true, 'https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=600&q=80');

-- ENSALADAS
INSERT INTO menu_items (name, description, price, category, available, image_url) VALUES
('Ensalada Gambas', 'Camarones a la plancha, lechugas, tomates cherrys, zanahoria, pepino, aguacate, elote dulce; servida con crotones y aderezo rosa.', 9.99, 'ensaladas', true, 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&q=80'),
('Ensalada Criolla', 'Lechuga fresca, lomito de res, aguacate, champiñones, tomates cherrys, elote dulce, cebolla morada; servida con aderezo yogurlantro y chips de maíz.', 8.99, 'ensaladas', true, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80'),
('Ensalada Impecable', 'Lechuga fresca, trozos de pechuga de pollo a la plancha, manzana verde, zanahoria fresca, elote dulce, aguacate, tocino, almendras.', 9.99, 'ensaladas', true, 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=600&q=80');

-- PASTAS
INSERT INTO menu_items (name, description, price, category, available, image_url) VALUES
('Fettuccine Mar y Tierra', 'Pasta fettuccine bañada en salsa Alfredo con una deliciosa fusión de mariscos y pollo.', 9.99, 'pastas', true, 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=600&q=80'),
('Lasagna Bolognesa', 'Tradicional combinación de pasta rellena de salsa Bolognesa y un mix de quesos mozzarella y queso crema.', 9.99, 'pastas', true, 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=600&q=80'),
('Penne Brócoli Tocino', 'Pasta penne con tocino crocante, brócoli, trozos de pechuga; bañada con salsa Alfredo y mozzarella gratinado.', 7.99, 'pastas', true, 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&q=80');

-- PIZZAS CLÁSICAS
INSERT INTO menu_items (name, description, price, category, available, image_url) VALUES
('Pizza Fungie', 'Pizza vegetariana de cebollas y hongos al chimichurri. Personal $5.75 / Grande $14.99', 5.75, 'pizzas', true, 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=600&q=80'),
('Pizza Maradona', '¡El tributo a una leyenda! Chorizo argentino nivel D10S, pimientos verdes, cebolla y chimichurri. Personal $5.75 / Grande $14.99', 5.75, 'pizzas', true, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80'),
('Pizza Brazuca', 'Fusión de piña y salami; cubierto en salsa de ajo y jalapeños. Personal $5.75 / Grande $14.99', 5.75, 'pizzas', true, 'https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=600&q=80'),
('Pizza Vegetariana', 'Pimientos verdes, cebolla, tomates frescos, champiñones, lascas de zanahoria y brócoli. Personal $5.75 / Grande $14.99', 5.75, 'pizzas', true, 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=600&q=80'),
('Pizza Picollo', 'Pechuga marinada al grill, salsa de ajo y un toque de cilantro. Personal $5.75 / Grande $14.99', 5.75, 'pizzas', true, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80'),
('Pizza Jamón o Pepperoni', 'Clásica pizza de jamón o pepperoni. Personal $5.75 / Grande $14.99', 5.75, 'pizzas', true, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&q=80'),
('Pizza Margherita', 'Tomates cherrys marinados y albahaca fresca. Personal $5.75 / Grande $14.99', 5.75, 'pizzas', true, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80'),
('Pizza Hawaiana', 'Jamón, piña, pimientos asados cubiertos de mozzarella y cheddar. Personal $5.75 / Grande $14.99', 5.75, 'pizzas', true, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80'),
('Pizza Verde Mella', 'Fajitas de pollo al grill, manzana verde, rebanadas de almendras y tocino. Personal $5.75 / Grande $14.99', 5.75, 'pizzas', true, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80'),
('Pizza La Loroka', 'Loroco, tocino y pepperoni. Personal $5.75 / Grande $14.99', 5.75, 'pizzas', true, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80'),
('Pizza Qu4tro Quesos', 'Queso criollo especial, parmesano, mozzarella, queso Philadelphia y albahaca fresca. Personal $5.75 / Grande $14.99', 5.75, 'pizzas', true, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80');

-- PIZZAS ESPECIALES
INSERT INTO menu_items (name, description, price, category, available, image_url) VALUES
('Pizza Ghiottone', 'Pepperoni, cebolla, tomate, salami, jamón, chorizo, aceitunas negras y hongos naturales. Personal $8.25 / Grande $17.99', 8.25, 'pizzas', true, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80'),
('Pizza La Memorable', 'Rajas de pollo, cebolla marinada, elotito, cubierta en salsa BBQ. Personal $8.25 / Grande $17.99', 8.25, 'pizzas', true, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80'),
('Pizza Don Cangrejo', 'Camarones frescos y almejas marinados, cebolla, pimientos verdes, con Alfredo. Personal $8.25 / Grande $17.99', 8.25, 'pizzas', true, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80'),
('Pizza La Pescattore', 'Calamari, almejas, camarones, cebolla y pimentón ahumado. Personal $8.25 / Grande $17.99', 8.25, 'pizzas', true, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80'),
('Pizza La Campesina', 'Fajitas de res, chorizo ibérico, mozzarella, frijoles fritos, salsa de aguacate. Personal $8.25 / Grande $17.99', 8.25, 'pizzas', true, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80'),
('Pizza Gamberetti', 'Camarones frescos, piña, salsa Alfredo y pesto de albahaca. Personal $8.25 / Grande $17.99', 8.25, 'pizzas', true, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80');

-- PLATOS FUERTES
INSERT INTO menu_items (name, description, price, category, available, image_url) VALUES
('Terramar al Maître', 'Combinación de lomito de res y camarones jumbo; acompañado de rondeles de papa, vegetales y mantequilla Maître.', 22.50, 'platos-fuertes', true, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80'),
('Medallón de Lomito al Maître', 'Corte estilo New York albardado con tocino; acompañado de salteado de hongos y cherrys; coronado con mantequilla Maître.', 19.99, 'platos-fuertes', true, 'https://images.unsplash.com/photo-1558030006-450675393462?w=600&q=80'),
('Mariskada', 'Sopa mariskada con camarones, almejas, calamares y pescado; en caldo cremoso de coco. Disponible: Sábado y Domingo', 17.99, 'platos-fuertes', true, 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80'),
('Pechuga Capresse', 'Pechuga rellena de queso mozzarella, tomates deshidratados y pesto; en una cama de puré de papa.', 14.99, 'platos-fuertes', true, 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&q=80'),
('Hamburguesa Casanova', 'Doble carne 100% res, fusión de tocino, hongos y cebolla morada, queso mozzarella; con papas francesas.', 12.50, 'platos-fuertes', true, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80'),
('Pescado a la Parrilla', 'Pescado entero a la parrilla, con chimichurri, tortillas fritas y cebolla encurtida.', 22.50, 'platos-fuertes', true, 'https://images.unsplash.com/photo-1534766555764-ce878a5e3a2b?w=600&q=80');

-- BEBIDAS
INSERT INTO menu_items (name, description, price, category, available, image_url) VALUES
('Frozen Positive Vibration', 'Frozen tricolor: kiwi, mango y fresa.', 3.75, 'bebidas', true, NULL),
('Frozen Piña', 'Refrescante bebida frozen de piña.', 3.75, 'bebidas', true, NULL),
('Frozen Fresa', 'Refrescante bebida frozen de fresa.', 3.75, 'bebidas', true, NULL),
('Frozen Maracuyá', 'Refrescante bebida frozen de maracuyá.', 3.75, 'bebidas', true, NULL),
('Limonada Tradicional', 'Limonada fresca tradicional.', 3.25, 'bebidas', true, NULL),
('Limonada Fresa', 'Limonada fresca con fresa.', 3.25, 'bebidas', true, NULL),
('Limonada Hierba Buena', 'Limonada fresca con hierba buena.', 3.25, 'bebidas', true, NULL),
('Tamarindo', 'Refresco de tamarindo 100% natural.', 2.95, 'bebidas', true, NULL),
('Horchata', 'Refresco de horchata tradicional.', 2.95, 'bebidas', true, NULL),
('Té Durazno', 'Té helado de durazno.', 2.95, 'bebidas', true, NULL),
('Agua', 'Agua embotellada 600ml.', 1.99, 'bebidas', true, NULL),
('Sodas', 'Sodas variadas.', 1.99, 'bebidas', true, NULL),
('Café Americano', 'Café americano clásico.', 1.50, 'bebidas', true, NULL),
('Cappuccino', 'Café cappuccino con espuma de leche.', 2.75, 'bebidas', true, NULL),
('Capuchino Vainilla', 'Cappuccino con toque de vainilla.', 2.95, 'bebidas', true, NULL);

-- POSTRES
INSERT INTO menu_items (name, description, price, category, available, image_url) VALUES
('Volcán de Chocolate', 'Bizcocho de chocolate con centro fundido; acompañado de helado de vainilla.', 5.99, 'postres', true, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&q=80'),
('Cheesecake de Fresas', 'Porción de cheesecake con salsa de fresas frescas.', 5.50, 'postres', true, 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=600&q=80'),
('Brownie con Helado', 'Brownie tibio de chocolate con helado de vainilla.', 4.99, 'postres', true, 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=600&q=80'),
('Tiramisú', 'Postre italiano clásico con café y mascarpone.', 5.99, 'postres', true, 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&q=80');

-- CERVEZAS
INSERT INTO menu_items (name, description, price, category, available, image_url) VALUES
('Cerveza Pilsener', 'Cerveza Pilsener fría.', 2.50, 'cervezas', true, NULL),
('Cerveza Corona', 'Cerveza Corona fría.', 3.50, 'cervezas', true, NULL),
('Cerveza Modelo', 'Cerveza Modelo fría.', 3.50, 'cervezas', true, NULL),
('Cerveza Artesanal', 'Selección de cerveza artesanal local.', 4.50, 'cervezas', true, NULL),
('Michelada Tradicional', 'Michelada clásica con limón y especias.', 1.50, 'cervezas', true, NULL);

-- MENÚ INFANTIL
INSERT INTO menu_items (name, description, price, category, available, image_url) VALUES
('Chunks de Pollo', 'Trozos de pechugas empanizados; acompañados con papas francesas y té.', 5.99, 'menu-infantil', true, 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&q=80'),
('Cangreburguer', 'Hamburguesa tradicional de pollo; acompañada de papas francesas y té.', 5.50, 'menu-infantil', true, 'https://images.unsplash.com/photo-1550317138-10000687a72b?w=600&q=80');

-- Verify the insert
SELECT category, COUNT(*) as count FROM menu_items GROUP BY category ORDER BY category;
