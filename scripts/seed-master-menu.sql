-- ═══════════════════════════════════════════════════════════════════════════
-- SIMMER DOWN - MASTER MENU SEED DATA
-- Complete menu from user extraction with ingredients and allergens
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- LOCATIONS (4 from user data)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO locations_v2 (code, name_es, name_en, brand, tagline_es, tagline_en, whatsapp, whatsapp_full, delivery_enabled, features) VALUES
  ('santa-ana', 'Simmer Down Santa Ana', 'Simmer Down Santa Ana', 'simmer-down', 'El Fuego Original', 'The Original Fire', '7890-1234', '+503 7890-1234', true, ARRAY['Classic menu', 'Original location']),
  ('san-benito', 'Simmer Down San Benito', 'Simmer Down San Benito', 'simmer-down', 'Calor Urbano', 'Urban Heat', '7487-7792', '+503 7487-7792', true, ARRAY['Classic menu', 'San Salvador location', 'Delivery available']),
  ('lago-coatepeque', 'Simmer Down Lago de Coatepeque', 'Simmer Down Lake Coatepeque', 'simmer-down', 'Sabores del Lago', 'Lakeside Flavors', '7890-9012', '+503 7890-9012', true, ARRAY['Lake view', 'Premium seafood', 'Ceviches', 'Weekend specials', 'Premium pricing']),
  ('la-majada', 'Simmer Garden La Majada', 'Simmer Garden La Majada', 'simmer-garden', '¡Escapa de la ciudad!', 'Escape the city!', '6990-4674', '+503 6990-4674', true, ARRAY['Garden atmosphere', 'Hamburguesa Casanova', 'Expanded coffee menu'])
ON CONFLICT (code) DO UPDATE SET
  name_es = EXCLUDED.name_es,
  whatsapp = EXCLUDED.whatsapp,
  whatsapp_full = EXCLUDED.whatsapp_full;

-- ═══════════════════════════════════════════════════════════════════════════
-- CATEGORIES
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO menu_categories (code, name_es, name_en, icon, display_order, note_es, note_en) VALUES
  ('entradas', 'Entradas', 'Starters', '🍽️', 1, NULL, NULL),
  ('ensaladas', 'Ensaladas', 'Salads', '🥗', 2, NULL, NULL),
  ('pastas', 'Nuestras Pastas', 'Our Pastas', '🍝', 3, 'Todas nuestras pastas acompañadas de pan tostado al ajo', 'All our pastas served with garlic toast'),
  ('pizzas', 'Pizzas Clásicas', 'Classic Pizzas', '🍕', 4, 'Personal $5.75 | Grande $14.99', 'Personal $5.75 | Large $14.99'),
  ('pizzas-especiales', 'Pizzas Especiales', 'Specialty Pizzas', '🍕', 5, 'Personal $6.25 | Grande $17.99', 'Personal $6.25 | Large $17.99'),
  ('platos-fuertes', 'Platos Fuertes', 'Main Dishes', '🥩', 6, NULL, NULL),
  ('mariscos', 'Mariscos', 'Seafood', '🦐', 7, NULL, NULL),
  ('bebidas-frias', 'Bebidas Frías', 'Cold Drinks', '🍹', 8, NULL, NULL),
  ('bebidas-calientes', 'Bebidas Calientes', 'Hot Drinks', '☕', 9, NULL, NULL),
  ('cervezas', 'Cervezas', 'Beers', '🍺', 10, NULL, NULL),
  ('postres', 'Postres', 'Desserts', '🍰', 11, NULL, NULL),
  ('menu-infantil', 'Menú Infantil', 'Kids Menu', '👶', 12, NULL, NULL)
ON CONFLICT (code) DO UPDATE SET
  name_es = EXCLUDED.name_es,
  display_order = EXCLUDED.display_order;

-- ═══════════════════════════════════════════════════════════════════════════
-- INGREDIENTS (Comprehensive list with allergens)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO ingredients (code, name_es, name_en, allergens, dietary_tags, ingredient_type) VALUES
  -- PROTEINS
  ('beef-coulotte', 'Carne Coulotte', 'Coulotte Beef', '{}', '{}', 'protein'),
  ('beef-tenderloin', 'Lomito de Res', 'Beef Tenderloin', '{}', '{}', 'protein'),
  ('beef-fajitas', 'Fajitas de Res', 'Beef Fajitas', '{}', '{}', 'protein'),
  ('filet-mignon', 'Filet Mignon', 'Filet Mignon', '{}', '{}', 'protein'),
  ('grilled-chicken', 'Pechuga de Pollo a la Plancha', 'Grilled Chicken Breast', '{}', '{}', 'protein'),
  ('chicken-fajitas', 'Fajitas de Pollo', 'Chicken Fajitas', '{}', '{}', 'protein'),
  ('breaded-chicken', 'Pechuga Empanizada', 'Breaded Chicken', '{gluten}', '{}', 'protein'),
  ('shrimp', 'Camarones', 'Shrimp', '{shellfish}', '{}', 'protein'),
  ('jumbo-shrimp', 'Camarones Jumbo', 'Jumbo Shrimp', '{shellfish}', '{}', 'protein'),
  ('clams', 'Almejas', 'Clams', '{shellfish}', '{}', 'protein'),
  ('squid', 'Calamar', 'Squid', '{shellfish}', '{}', 'protein'),
  ('mussels', 'Mejillones', 'Mussels', '{shellfish}', '{}', 'protein'),
  ('fresh-fish', 'Pescado Fresco', 'Fresh Fish', '{fish}', '{}', 'protein'),
  ('whole-fish', 'Pescado Entero', 'Whole Fish', '{fish}', '{}', 'protein'),
  ('bacon', 'Tocino', 'Bacon', '{}', '{}', 'protein'),
  ('crispy-bacon', 'Tocino Crujiente', 'Crispy Bacon', '{}', '{}', 'protein'),
  ('ham', 'Jamón', 'Ham', '{}', '{}', 'protein'),
  ('prosciutto', 'Jamón Prosciutto', 'Prosciutto', '{}', '{}', 'protein'),
  ('pepperoni', 'Pepperoni', 'Pepperoni', '{}', '{}', 'protein'),
  ('salami', 'Salami', 'Salami', '{}', '{}', 'protein'),
  ('salami-pamplona', 'Salami di Pamplona', 'Pamplona Salami', '{}', '{}', 'protein'),
  ('chorizo-argentino', 'Chorizo Argentino', 'Argentine Chorizo', '{}', '{}', 'protein'),
  ('chorizo-iberico', 'Chorizo Ibérico', 'Iberian Chorizo', '{}', '{}', 'protein'),
  ('chistorra', 'Chistorra', 'Chistorra Sausage', '{}', '{}', 'protein'),
  ('loroco', 'Loroco', 'Loroco Flower', '{}', '{vegetarian}', 'protein'),

  -- CHEESES
  ('mozzarella', 'Queso Mozzarella', 'Mozzarella Cheese', '{dairy}', '{vegetarian}', 'cheese'),
  ('cheddar', 'Queso Cheddar', 'Cheddar Cheese', '{dairy}', '{vegetarian}', 'cheese'),
  ('parmesan', 'Queso Parmesano', 'Parmesan Cheese', '{dairy}', '{vegetarian}', 'cheese'),
  ('cream-cheese', 'Queso Crema', 'Cream Cheese', '{dairy}', '{vegetarian}', 'cheese'),
  ('queso-criollo', 'Queso Criollo', 'Criollo Cheese', '{dairy}', '{vegetarian}', 'cheese'),
  ('cheese-blend', 'Mix de Quesos', 'Cheese Blend', '{dairy}', '{vegetarian}', 'cheese'),
  ('melted-cheese', 'Queso Derretido', 'Melted Cheese', '{dairy}', '{vegetarian}', 'cheese'),

  -- VEGETABLES
  ('fresh-mushrooms', 'Champiñones Frescos', 'Fresh Mushrooms', '{}', '{vegetarian,vegan}', 'vegetable'),
  ('onion', 'Cebolla', 'Onion', '{}', '{vegetarian,vegan}', 'vegetable'),
  ('caramelized-onion', 'Cebolla Caramelizada', 'Caramelized Onion', '{}', '{vegetarian,vegan}', 'vegetable'),
  ('red-onion', 'Cebolla Morada', 'Red Onion', '{}', '{vegetarian,vegan}', 'vegetable'),
  ('pickled-onion', 'Cebolla Encurtida', 'Pickled Onion', '{}', '{vegetarian,vegan}', 'vegetable'),
  ('green-onion', 'Cebollín', 'Green Onion', '{}', '{vegetarian,vegan}', 'vegetable'),
  ('green-peppers', 'Pimientos Verdes', 'Green Peppers', '{}', '{vegetarian,vegan}', 'vegetable'),
  ('roasted-peppers', 'Pimientos Asados', 'Roasted Peppers', '{}', '{vegetarian,vegan}', 'vegetable'),
  ('jalapeno', 'Jalapeño', 'Jalapeño', '{}', '{vegetarian,vegan,spicy}', 'vegetable'),
  ('cherry-tomatoes', 'Tomates Cherry', 'Cherry Tomatoes', '{}', '{vegetarian,vegan}', 'vegetable'),
  ('fresh-tomatoes', 'Tomates Frescos', 'Fresh Tomatoes', '{}', '{vegetarian,vegan}', 'vegetable'),
  ('sun-dried-tomatoes', 'Tomates Deshidratados', 'Sun-Dried Tomatoes', '{}', '{vegetarian,vegan}', 'vegetable'),
  ('lettuce', 'Lechuga Fresca', 'Fresh Lettuce', '{}', '{vegetarian,vegan}', 'vegetable'),
  ('cucumber', 'Pepino', 'Cucumber', '{}', '{vegetarian,vegan}', 'vegetable'),
  ('carrot', 'Zanahoria', 'Carrot', '{}', '{vegetarian,vegan}', 'vegetable'),
  ('broccoli', 'Brócoli', 'Broccoli', '{}', '{vegetarian,vegan}', 'vegetable'),
  ('avocado', 'Aguacate', 'Avocado', '{}', '{vegetarian,vegan}', 'vegetable'),
  ('sweet-corn', 'Elote Dulce', 'Sweet Corn', '{}', '{vegetarian,vegan}', 'vegetable'),
  ('black-olives', 'Aceitunas Negras', 'Black Olives', '{}', '{vegetarian,vegan}', 'vegetable'),
  ('green-olives', 'Aceitunas Verdes', 'Green Olives', '{}', '{vegetarian,vegan}', 'vegetable'),
  ('green-apple', 'Manzana Verde', 'Green Apple', '{}', '{vegetarian,vegan}', 'vegetable'),
  ('pineapple', 'Piña', 'Pineapple', '{}', '{vegetarian,vegan}', 'vegetable'),
  ('fresh-basil', 'Albahaca Fresca', 'Fresh Basil', '{}', '{vegetarian,vegan}', 'vegetable'),
  ('fresh-cilantro', 'Cilantro Fresco', 'Fresh Cilantro', '{}', '{vegetarian,vegan}', 'vegetable'),

  -- SAUCES
  ('pomodoro-sauce', 'Salsa Pomodoro', 'Pomodoro Sauce', '{}', '{vegetarian,vegan}', 'sauce'),
  ('alfredo-sauce', 'Salsa Alfredo', 'Alfredo Sauce', '{dairy}', '{vegetarian}', 'sauce'),
  ('bolognese-sauce', 'Salsa Bolognesa', 'Bolognese Sauce', '{}', '{}', 'sauce'),
  ('bbq-sauce', 'Salsa BBQ', 'BBQ Sauce', '{}', '{vegetarian,vegan}', 'sauce'),
  ('chimichurri', 'Chimichurri', 'Chimichurri', '{}', '{vegetarian,vegan}', 'sauce'),
  ('garlic-sauce', 'Salsa de Ajo', 'Garlic Sauce', '{}', '{vegetarian,vegan}', 'sauce'),
  ('pesto', 'Pesto de Albahaca', 'Basil Pesto', '{dairy,nuts}', '{vegetarian}', 'sauce'),
  ('maitre-butter', 'Mantequilla Maître', 'Maître Butter', '{dairy}', '{vegetarian}', 'sauce'),
  ('avocado-salsa', 'Salsa de Aguacate', 'Avocado Salsa', '{}', '{vegetarian,vegan}', 'sauce'),
  ('punta-jalapena', 'Salsa Punta Jalapeña', 'Punta Jalapeña Sauce', '{}', '{vegetarian,spicy}', 'sauce'),
  ('yogurlantro', 'Aderezo Yogurlantro', 'Yogurt-Cilantro Dressing', '{dairy}', '{vegetarian}', 'sauce'),
  ('pink-dressing', 'Aderezo Rosa', 'Pink Dressing', '{dairy,eggs}', '{vegetarian}', 'sauce'),
  ('refried-beans', 'Frijoles Fritos', 'Refried Beans', '{}', '{vegetarian,vegan}', 'sauce'),

  -- CARBS
  ('pizza-dough', 'Masa de Pizza', 'Pizza Dough', '{gluten}', '{vegetarian,vegan}', 'base'),
  ('fettuccine', 'Fettuccine', 'Fettuccine', '{gluten,eggs}', '{vegetarian}', 'base'),
  ('penne', 'Penne', 'Penne', '{gluten}', '{vegetarian,vegan}', 'base'),
  ('lasagna-sheets', 'Láminas de Lasagna', 'Lasagna Sheets', '{gluten,eggs}', '{vegetarian}', 'base'),
  ('garlic-bread', 'Pan Tostado al Ajo', 'Garlic Toast', '{gluten,dairy}', '{vegetarian}', 'base'),
  ('tortillas', 'Tortillas', 'Tortillas', '{gluten}', '{vegetarian,vegan}', 'base'),
  ('corn-chips', 'Chips de Maíz', 'Corn Chips', '{}', '{vegetarian,vegan,gluten_free}', 'base'),
  ('plantain-chips', 'Chips de Plátano', 'Plantain Chips', '{}', '{vegetarian,vegan,gluten_free}', 'base'),
  ('croutons', 'Crotones', 'Croutons', '{gluten}', '{vegetarian}', 'base'),
  ('potato-rounds', 'Rondeles de Papa', 'Potato Rounds', '{}', '{vegetarian,vegan,gluten_free}', 'base'),
  ('french-fries', 'Papas Francesas', 'French Fries', '{}', '{vegetarian,vegan,gluten_free}', 'base'),
  ('mashed-potatoes', 'Puré de Papa', 'Mashed Potatoes', '{dairy}', '{vegetarian}', 'base'),

  -- TOPPINGS & GARNISH
  ('almonds', 'Almendras', 'Almonds', '{nuts}', '{vegetarian,vegan}', 'topping'),
  ('sesame', 'Ajonjolí', 'Sesame', '{sesame}', '{vegetarian,vegan}', 'topping'),
  ('capers', 'Alcaparras', 'Capers', '{}', '{vegetarian,vegan}', 'topping'),

  -- BEVERAGES
  ('espresso', 'Espresso', 'Espresso', '{}', '{vegetarian,vegan}', 'beverage'),
  ('steamed-milk', 'Leche Vaporizada', 'Steamed Milk', '{dairy}', '{vegetarian}', 'beverage'),
  ('vanilla-syrup', 'Jarabe de Vainilla', 'Vanilla Syrup', '{}', '{vegetarian,vegan}', 'beverage'),
  ('chocolate', 'Chocolate', 'Chocolate', '{dairy}', '{vegetarian}', 'beverage'),
  ('vanilla-ice-cream', 'Helado de Vainilla', 'Vanilla Ice Cream', '{dairy,eggs}', '{vegetarian}', 'beverage'),
  ('orange-juice', 'Jugo de Naranja', 'Orange Juice', '{}', '{vegetarian,vegan}', 'beverage'),

  -- DESSERT COMPONENTS
  ('brownie', 'Brownie', 'Brownie', '{gluten,dairy,eggs}', '{vegetarian}', 'dessert'),
  ('cheesecake', 'Cheesecake', 'Cheesecake', '{gluten,dairy,eggs}', '{vegetarian}', 'dessert'),
  ('panna-cotta', 'Panna Cotta', 'Panna Cotta', '{dairy}', '{vegetarian}', 'dessert'),
  ('chocolate-ganache', 'Ganache de Chocolate', 'Chocolate Ganache', '{dairy}', '{vegetarian}', 'dessert'),
  ('strawberries', 'Fresas', 'Strawberries', '{}', '{vegetarian,vegan}', 'dessert'),
  ('red-fruits', 'Frutos Rojos', 'Red Fruits', '{}', '{vegetarian,vegan}', 'dessert'),
  ('passion-fruit', 'Maracuyá', 'Passion Fruit', '{}', '{vegetarian,vegan}', 'dessert')

ON CONFLICT (code) DO UPDATE SET
  name_es = EXCLUDED.name_es,
  allergens = EXCLUDED.allergens,
  dietary_tags = EXCLUDED.dietary_tags;

-- ═══════════════════════════════════════════════════════════════════════════
-- MENU ITEMS - ENTRADAS
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO menu_items_v2 (code, name_es, name_en, description_es, description_en, category_code, price_regular, is_best_seller, is_signature, is_spicy) VALUES
  ('molcajete-coulotte', 'Molcajete Coulotte', 'Molcajete Coulotte',
   'Carne coulotte, salsa aguacate, mix de cebolla, jalapeño, cebollín ajo tuteado, servido con tortilla en molcajete tradicional',
   'Beef coulotte, avocado salsa, onion mix, jalapeño, sautéed green onion and garlic, served with tortilla in traditional molcajete',
   'entradas', 13.99, true, true, true),

  ('fundido-camaron-pollo', 'Fundido Camarón y Pollo', 'Shrimp & Chicken Fundido',
   'Camarones y pechuga a la plancha con salsa pomodoro, mozzarella derretido, servido con pan al ajo',
   'Grilled shrimp and chicken breast with pomodoro sauce, melted mozzarella, served with garlic bread',
   'entradas', 7.99, false, false, false),

  ('fundido-champinones', 'Fundido de Champiñones', 'Mushroom Fundido',
   'Champiñones frescos con mezcla de quesos, salsa pomodoro, servido con pan al ajo',
   'Fresh mushrooms with cheese blend, pomodoro sauce, served with garlic bread',
   'entradas', 7.99, false, false, false),

  ('fundido-filet-mignon', 'Fundido Filet Mignon', 'Filet Mignon Fundido',
   'Cortes premium de filet mignon con mezcla de quesos derretidos y pan al ajo',
   'Premium filet mignon cuts with melted cheese blend and garlic bread',
   'entradas', 7.99, false, false, false),

  ('cheese-balls', 'Cheese Balls', 'Cheese Balls',
   'Bolitas crujientes de mezcla de quesos servidas con salsa pomodoro',
   'Crispy mixed cheese balls served with pomodoro dipping sauce',
   'entradas', 6.99, false, false, false),

  ('patatas-tocino', 'Patatas con Tocino', 'Bacon Potatoes',
   'Rondeles de papa, tocino crujiente, salsa pomodoro, queso mozzarella',
   'Potato rounds, crispy bacon, pomodoro sauce, mozzarella cheese',
   'entradas', 5.99, false, false, false),

  ('camarones-empanizados', 'Camarones Empanizados', 'Breaded Shrimp',
   'Camarones empanizados con papas fritas, salsa a elegir (búfalo / cilantro parmesano / teriyaki picante)',
   'Breaded shrimp with french fries, choice of sauce (buffalo / cilantro parmesan / spicy teriyaki)',
   'entradas', 9.99, false, false, false),

  -- LAGO-ONLY CEVICHES
  ('leche-de-tigre', 'Leche de Tigre', 'Tiger''s Milk Ceviche',
   'Pescado blanco fresco y camarones marinados en cítricos con cebolla morada, cilantro, limón, servido con chips de plátano',
   'Fresh white fish and shrimp marinated in citrus with red onion, cilantro, lemon, served with plantain chips',
   'entradas', 13.99, true, true, true),

  ('ceviche-tropical', 'Ceviche Tropical', 'Tropical Ceviche',
   'Ceviche de pescado fresco con piña tropical, cebolla morada, cilantro, servido con chips de plátano crujientes',
   'Fresh fish ceviche with tropical pineapple, red onion, cilantro, served with crispy plantain chips',
   'entradas', 13.99, true, false, false),

  ('aguachile-camaron', 'Aguachile de Camarón', 'Shrimp Aguachile',
   'Camarones frescos en aguachile verde picante con pepino, cebolla morada, jalapeño, cilantro, ajo, chips de plátano',
   'Fresh shrimp in spicy green aguachile with cucumber, red onion, jalapeño, cilantro, garlic, plantain chips',
   'entradas', 11.99, false, false, true)
ON CONFLICT (code) DO UPDATE SET
  description_es = EXCLUDED.description_es,
  price_regular = EXCLUDED.price_regular;

-- ═══════════════════════════════════════════════════════════════════════════
-- MENU ITEMS - ENSALADAS
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO menu_items_v2 (code, name_es, name_en, description_es, description_en, category_code, price_regular, is_best_seller) VALUES
  ('ensalada-gambas', 'Ensalada Gambas', 'Shrimp Salad',
   'Camarones a la plancha, lechugas, tomates cherry, zanahoria, pepino, aguacate, elote dulce; con crotones y aderezo rosa',
   'Grilled shrimp over fresh lettuce with cherry tomatoes, carrot, cucumber, avocado, sweet corn, croutons, pink dressing',
   'ensaladas', 9.99, false),

  ('ensalada-criolla', 'Ensalada Criolla', 'Creole Salad',
   'Lechuga fresca, lomito de res, aguacate, champiñones, tomates cherry, elote dulce, cebolla morada; aderezo yogurlantro; chips de maíz',
   'Fresh lettuce with beef tenderloin strips, avocado, mushrooms, cherry tomatoes, sweet corn, red onion, yogurt-cilantro dressing, corn chips',
   'ensaladas', 8.99, false),

  ('ensalada-impecable', 'Ensalada Impecable', 'Impeccable Salad',
   'Lechuga fresca, trozos de pechuga de pollo a la plancha, manzana verde, zanahoria fresca, elote dulce, aguacate, tocino, almendras y tomates cherry; aderezo yogurlantro; chips de maíz',
   'Fresh lettuce, grilled chicken breast pieces, green apple, fresh carrot, sweet corn, avocado, bacon, almonds and cherry tomatoes; yogurt-cilantro dressing; corn chips',
   'ensaladas', 9.99, true)
ON CONFLICT (code) DO UPDATE SET
  description_es = EXCLUDED.description_es,
  price_regular = EXCLUDED.price_regular;

-- ═══════════════════════════════════════════════════════════════════════════
-- MENU ITEMS - PASTAS
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO menu_items_v2 (code, name_es, name_en, description_es, description_en, category_code, price_regular, is_best_seller) VALUES
  ('fettuccine-calamaridina', 'Fettuccine Calamaridina', 'Calamaridina Fettuccine',
   'Salsa calamaridina; camarón jumbo, almejas, calamar y mejillones. Servido con pan tostado al ajo',
   'Calamaridina sauce; jumbo shrimp, clams, squid and mussels. Served with garlic toast',
   'pastas', 13.00, true),

  ('fettuccine-mar-y-tierra', 'Fettuccine Mar y Tierra', 'Surf & Turf Fettuccine',
   'Salsa Alfredo; fusión de mariscos y pollo. Servido con pan tostado al ajo',
   'Alfredo sauce; seafood and chicken fusion. Served with garlic toast',
   'pastas', 9.99, true),

  ('lasagna-bolognesa', 'Lasagna Bolognesa', 'Bolognese Lasagna',
   'Salsa bolognesa + mix de quesos mozzarella y queso crema. Servido con pan tostado al ajo',
   'Bolognese sauce + mozzarella and cream cheese mix. Served with garlic toast',
   'pastas', 9.99, false),

  ('penne-brocoli-tocino', 'Penne Brócoli Tocino', 'Broccoli Bacon Penne',
   'Tocino crocante, brócoli, trozos de pechuga; bañada en Alfredo; mozzarella gratinado. Servido con pan tostado al ajo',
   'Crispy bacon, broccoli, chicken breast pieces; Alfredo sauce; gratinated mozzarella. Served with garlic toast',
   'pastas', 7.99, false)
ON CONFLICT (code) DO UPDATE SET
  description_es = EXCLUDED.description_es,
  price_regular = EXCLUDED.price_regular;

-- ═══════════════════════════════════════════════════════════════════════════
-- MENU ITEMS - PIZZAS BASE ($5.75 / $14.99)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO menu_items_v2 (code, name_es, name_en, description_es, description_en, category_code, price_personal, price_regular, is_best_seller, is_signature) VALUES
  ('pizza-fungi', 'Pizza Fungie', 'Mushroom Pizza',
   'Cebolla + hongos al chimichurri',
   'Onion + mushrooms with chimichurri',
   'pizzas', 5.75, 14.99, false, false),

  ('pizza-pepperoni', 'Pizza Pepperoni', 'Pepperoni Pizza',
   'Pepperoni clásico sobre mozzarella derretido',
   'Classic pepperoni over melted mozzarella',
   'pizzas', 5.75, 14.99, false, false),

  ('pizza-maradona', 'Pizza Maradona', 'Maradona Pizza',
   'Chorizo argentino + pimientos verdes + cebolla + chimichurri',
   'Argentine chorizo + green peppers + onion + chimichurri',
   'pizzas', 5.75, 14.99, true, true),

  ('pizza-brazuca', 'Pizza Brazuca', 'Brazuca Pizza',
   'Piña + salami; cubierta en salsa de ajo y jalapeños',
   'Pineapple + salami; covered in garlic sauce and jalapeños',
   'pizzas', 5.75, 14.99, false, false),

  ('pizza-vegetariana', 'Pizza Vegetariana', 'Vegetarian Pizza',
   'Pimientos verdes, cebolla, tomates frescos, champiñones, lascas de zanahoria, brócoli marinados',
   'Green peppers, onion, fresh tomatoes, mushrooms, carrot strips, marinated broccoli',
   'pizzas', 5.75, 14.99, false, false),

  ('pizza-piccolo', 'Pizza Piccolo', 'Piccolo Pizza',
   'Pechuga marinada al grill + salsa de ajo + toque de cilantro',
   'Grilled marinated chicken breast + garlic sauce + cilantro touch',
   'pizzas', 5.75, 14.99, false, false),

  ('pizza-margherita', 'Pizza Margherita', 'Margherita Pizza',
   'Tomates cherry marinados + albahaca fresca',
   'Marinated cherry tomatoes + fresh basil',
   'pizzas', 5.75, 14.99, false, false),

  ('pizza-hawaiana', 'Pizza La Hawaiana', 'Hawaiian Pizza',
   'Jamón + piña + pimientos asados; cubierta de mozzarella y cheddar',
   'Ham + pineapple + roasted peppers; mozzarella and cheddar topping',
   'pizzas', 5.75, 14.99, false, false),

  ('pizza-verde-mella', 'Pizza Verde Mella', 'Green Apple Pizza',
   'Fajitas de pollo al grill, manzana verde, rebanadas de almendra',
   'Grilled chicken fajitas, green apple, almond slices',
   'pizzas', 5.75, 14.99, false, false),

  ('pizza-loroka', 'Pizza La Loroka', 'La Loroka Pizza',
   'Simple y deliciosa: loroco, tocino y pepperoni',
   'Simple and delicious: loroco, bacon and pepperoni',
   'pizzas', 5.75, 14.99, true, true),

  ('pizza-cuatro-quesos', 'Pizza Cuatro Quesos', 'Four Cheese Pizza',
   'Queso criollo especial, parmesano, mozzarella, queso crema + albahaca fresca',
   'Special criollo cheese, parmesan, mozzarella, cream cheese + fresh basil',
   'pizzas', 5.75, 14.99, false, false)
ON CONFLICT (code) DO UPDATE SET
  description_es = EXCLUDED.description_es,
  price_personal = EXCLUDED.price_personal,
  price_regular = EXCLUDED.price_regular;

-- ═══════════════════════════════════════════════════════════════════════════
-- MENU ITEMS - PIZZAS ESPECIALES ($6.25 / $17.99)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO menu_items_v2 (code, name_es, name_en, description_es, description_en, category_code, price_personal, price_regular, is_best_seller, is_signature) VALUES
  ('pizza-castellana', 'Pizza La Castellana', 'La Castellana Pizza',
   'Salami di pamplona, chistorra y chorizo ibérico',
   'Pamplona salami, chistorra and Iberian chorizo',
   'pizzas-especiales', 6.25, 17.99, false, false),

  ('pizza-prosciutto', 'Pizza Prosciutto', 'Prosciutto Pizza',
   'Tomates deshidratados, jamón prosciutto, pesto de albahaca',
   'Sun-dried tomatoes, prosciutto ham, basil pesto',
   'pizzas-especiales', 6.25, 17.99, false, false),

  ('pizza-ghiottone', 'Pizza Ghiottone', 'Ghiottone Pizza',
   'Tomates deshidratados, salami, jamón, pepperoni, chorizo, aceitunas negras y hongos',
   'Sun-dried tomatoes, salami, ham, pepperoni, chorizo, black olives and mushrooms',
   'pizzas-especiales', 6.25, 17.99, true, true),

  ('pizza-memorable', 'Pizza La Memorable', 'La Memorable Pizza',
   'Fajitas de res y pollo, elotito amarillo, cubierta en salsa BBQ, toque de ajonjolí',
   'Beef and chicken fajitas, sweet corn, BBQ sauce, sesame touch',
   'pizzas-especiales', 6.25, 17.99, true, true),

  ('pizza-don-cangrejo', 'Pizza Don Cangrejo', 'Don Cangrejo Pizza',
   'Camarones frescos y almejas marinadas, cebolla, pimientos verdes, toque de aguacate fresco',
   'Fresh shrimp and marinated clams, onion, green peppers, fresh avocado touch',
   'pizzas-especiales', 6.25, 17.99, false, false),

  ('pizza-pescatore', 'Pizza La Pescatore', 'La Pescatore Pizza',
   'Calamar, almejas, camarones, cebolla morada y pimientos marinados',
   'Squid, clams, shrimp, red onion and marinated peppers',
   'pizzas-especiales', 6.25, 17.99, false, false),

  ('pizza-punta-jalapena', 'Pizza Punta Jalapeña', 'Punta Jalapeña Pizza',
   'Lomito de res, mozzarella, cilantro fresco, salsa punta jalapeña',
   'Beef tenderloin, mozzarella, fresh cilantro, punta jalapeña sauce',
   'pizzas-especiales', 6.25, 17.99, false, true),

  ('pizza-campesina', 'Pizza La Campesina', 'La Campesina Pizza',
   'Fajitas de res, chorizo ibérico, cubierta con mozzarella, decorada con frijoles fritos, salsa de aguacate y cilantro fresco; acompañada de cebolla encurtida',
   'Beef fajitas, Iberian chorizo, mozzarella topping, decorated with refried beans, avocado salsa and fresh cilantro; served with pickled onion',
   'pizzas-especiales', 6.25, 17.99, false, true),

  ('pizza-gamberetti', 'Pizza Gamberetti', 'Gamberetti Pizza',
   'Camarones frescos, piña, salsa Alfredo y pesto de albahaca',
   'Fresh shrimp, pineapple, Alfredo sauce and basil pesto',
   'pizzas-especiales', 6.25, 17.99, false, false)
ON CONFLICT (code) DO UPDATE SET
  description_es = EXCLUDED.description_es,
  price_personal = EXCLUDED.price_personal,
  price_regular = EXCLUDED.price_regular;

-- ═══════════════════════════════════════════════════════════════════════════
-- MENU ITEMS - PLATOS FUERTES
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO menu_items_v2 (code, name_es, name_en, description_es, description_en, category_code, price_regular, is_best_seller, is_signature) VALUES
  ('terramar-al-maitre', 'Terramar al Maître', 'Terramar al Maître',
   'Lomito de res + camarones jumbo; acompañados de rondeles de papa, vegetales; coronado con mantequilla maître',
   'Beef tenderloin + jumbo shrimp; served with potato rounds, vegetables; topped with maître butter',
   'platos-fuertes', 19.99, true, true),

  ('medallon-lomito-maitre', 'Medallón de Lomito al Maître', 'Medallion al Maître',
   'Corte estilo New York albardado con tocino; salteados de hongos y cherrys; mantequilla maître - BEST SELLER #1',
   'New York-style cut wrapped in bacon; sautéed mushrooms and cherry tomatoes; maître butter - BEST SELLER #1',
   'platos-fuertes', 17.75, true, true),

  ('pechuga-capresse', 'Pechuga Capresse', 'Capresse Chicken',
   'Rellena de mozzarella, tomates deshidratados y pesto; en cama de puré de papa con vegetales',
   'Stuffed with mozzarella, sun-dried tomatoes and pesto; on mashed potato bed with vegetables',
   'platos-fuertes', 14.99, false, false),

  ('hamburguesa-casanova', 'Hamburguesa Casanova', 'Casanova Burger',
   'Doble carne 100% res, fusión de tocino, hongos y cebolla morada; queso mozzarella derretido; papas francesas',
   'Double 100% beef patty, bacon, mushroom and red onion fusion; melted mozzarella; french fries',
   'platos-fuertes', 11.99, true, false),

  ('pescado-parrilla', 'Pescado a la Parrilla', 'Grilled Fish',
   'Pescado entero a la parrilla con chimichurri; tortillas fritas + cebolla encurtida',
   'Whole grilled fish with chimichurri; fried tortillas + pickled onion',
   'platos-fuertes', 22.50, true, true),

  ('mariscada', 'Mariscada', 'Seafood Stew',
   'Sopa mariscada: camarones, almejas, calamares, mejillones y pescado (especial de fin de semana)',
   'Seafood soup: shrimp, clams, squid, mussels and fish (weekend special)',
   'mariscos', 17.99, true, true)
ON CONFLICT (code) DO UPDATE SET
  description_es = EXCLUDED.description_es,
  price_regular = EXCLUDED.price_regular;

-- ═══════════════════════════════════════════════════════════════════════════
-- LOCATION OVERRIDES (Lago Coatepeque Premium Pricing)
-- ═══════════════════════════════════════════════════════════════════════════

-- Get location IDs for overrides
DO $$
DECLARE
  lago_id UUID;
  garden_id UUID;
BEGIN
  SELECT id INTO lago_id FROM locations_v2 WHERE code = 'lago-coatepeque';
  SELECT id INTO garden_id FROM locations_v2 WHERE code = 'la-majada';

  -- Lago Coatepeque premium pricing
  INSERT INTO location_menu_overrides (location_id, menu_item_id, price_regular_override, is_featured, special_notes_es)
  SELECT
    lago_id,
    mi.id,
    CASE mi.code
      WHEN 'terramar-al-maitre' THEN 22.50
      WHEN 'medallon-lomito-maitre' THEN 19.99
      WHEN 'hamburguesa-casanova' THEN 12.50
      ELSE NULL
    END,
    mi.code IN ('leche-de-tigre', 'ceviche-tropical', 'aguachile-camaron', 'pescado-parrilla', 'mariscada'),
    CASE
      WHEN mi.code IN ('leche-de-tigre', 'ceviche-tropical', 'aguachile-camaron', 'pescado-parrilla')
      THEN 'Especialidad del Lago'
      WHEN mi.code = 'mariscada' THEN 'Disponible sábado y domingo'
      ELSE NULL
    END
  FROM menu_items_v2 mi
  WHERE mi.code IN (
    'terramar-al-maitre', 'medallon-lomito-maitre', 'hamburguesa-casanova',
    'leche-de-tigre', 'ceviche-tropical', 'aguachile-camaron', 'pescado-parrilla', 'mariscada'
  )
  ON CONFLICT (location_id, menu_item_id) DO UPDATE SET
    price_regular_override = EXCLUDED.price_regular_override,
    is_featured = EXCLUDED.is_featured;

  -- Make lake-only items unavailable at other locations
  INSERT INTO location_menu_overrides (location_id, menu_item_id, is_available)
  SELECT
    loc.id,
    mi.id,
    false
  FROM locations_v2 loc
  CROSS JOIN menu_items_v2 mi
  WHERE loc.code != 'lago-coatepeque'
    AND mi.code IN ('leche-de-tigre', 'ceviche-tropical', 'aguachile-camaron', 'pescado-parrilla', 'mariscada')
  ON CONFLICT (location_id, menu_item_id) DO UPDATE SET
    is_available = false;

  -- Hamburguesa Casanova only at Garden and Lake
  INSERT INTO location_menu_overrides (location_id, menu_item_id, is_available)
  SELECT
    loc.id,
    mi.id,
    false
  FROM locations_v2 loc
  CROSS JOIN menu_items_v2 mi
  WHERE loc.code NOT IN ('lago-coatepeque', 'la-majada')
    AND mi.code = 'hamburguesa-casanova'
  ON CONFLICT (location_id, menu_item_id) DO UPDATE SET
    is_available = false;

END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- BEVERAGES (Cold, Hot, Beers)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO menu_items_v2 (code, name_es, name_en, description_es, description_en, category_code, price_regular) VALUES
  -- BEBIDAS FRÍAS
  ('frozen', 'Frozen', 'Frozen Drink',
   'Sabores: coco, piña, coco piña, fresa, fresa & hierba buena, hierba buena, maracuyá, positive vibration, sandía',
   'Flavors: coconut, pineapple, coconut pineapple, strawberry, strawberry & mint, mint, passion fruit, positive vibration, watermelon',
   'bebidas-frias', 3.75),
  ('limonadas', 'Limonadas', 'Lemonades',
   'Maracuyá, fresa, fresa & hierba buena, hierba buena, tradicional',
   'Passion fruit, strawberry, strawberry & mint, mint, traditional',
   'bebidas-frias', 3.25),
  ('amanecer', 'Amanecer', 'Sunrise Juice',
   'Naranja y zanahoria, 100% natural',
   'Orange and carrot, 100% natural',
   'bebidas-frias', 3.50),
  ('naranja-natural', 'Naranja Natural', 'Fresh Orange Juice',
   '100% natural',
   '100% natural',
   'bebidas-frias', 3.50),
  ('tamarindo', 'Tamarindo', 'Tamarind',
   '100% natural',
   '100% natural',
   'bebidas-frias', 2.95),
  ('horchata', 'Horchata', 'Horchata',
   'Bebida tradicional de arroz con canela',
   'Traditional rice drink with cinnamon',
   'bebidas-frias', 2.95),
  ('te-durazno', 'Té Durazno', 'Peach Tea',
   'Té helado de durazno',
   'Iced peach tea',
   'bebidas-frias', 2.95),
  ('agua', 'Agua', 'Water',
   'Agua 600ml',
   'Water 600ml',
   'bebidas-frias', 1.99),
  ('sodas', 'Sodas', 'Soft Drinks',
   'Refrescos variados',
   'Assorted soft drinks',
   'bebidas-frias', 1.99),

  -- BEBIDAS CALIENTES
  ('cappuccino', 'Cappuccino', 'Cappuccino',
   'Cappuccino clásico italiano',
   'Classic Italian cappuccino',
   'bebidas-calientes', 2.99),
  ('cappuccino-vainilla', 'Cappuccino Vainilla', 'Vanilla Cappuccino',
   'Cappuccino con jarabe de vainilla',
   'Cappuccino with vanilla syrup',
   'bebidas-calientes', 2.99),
  ('latte', 'Latte', 'Latte',
   'Café latte cremoso',
   'Creamy café latte',
   'bebidas-calientes', 2.99),
  ('latte-vainilla', 'Latte Vainilla', 'Vanilla Latte',
   'Latte con jarabe de vainilla',
   'Latte with vanilla syrup',
   'bebidas-calientes', 2.99),
  ('moccachino', 'Moccachino', 'Moccachino',
   'Espresso con chocolate y leche',
   'Espresso with chocolate and milk',
   'bebidas-calientes', 2.99),
  ('chocolate-caliente', 'Chocolate', 'Hot Chocolate',
   'Chocolate caliente cremoso',
   'Creamy hot chocolate',
   'bebidas-calientes', 2.99),
  ('cafe-americano', 'Café Americano', 'American Coffee',
   'Espresso con agua caliente',
   'Espresso with hot water',
   'bebidas-calientes', 1.50),
  ('affogato', 'Affogato', 'Affogato',
   'Helado de vainilla bañado en espresso caliente',
   'Vanilla ice cream drowned in hot espresso',
   'bebidas-calientes', 3.50),
  ('iced-orange-coffee', 'Iced Orange Coffee', 'Iced Orange Coffee',
   'Espresso frío con jugo de naranja y hielo',
   'Cold espresso with orange juice and ice',
   'bebidas-calientes', 3.50),

  -- CERVEZAS LOCALES
  ('puente-quemado', 'Puente Quemado', 'Puente Quemado',
   'Cerveza santaneca artesanal premium',
   'Premium local Santa Ana craft beer',
   'cervezas', 5.00),
  ('regia-chola', 'Regia Chola', 'Regia Chola',
   'Cerveza local salvadoreña',
   'Local Salvadoran beer',
   'cervezas', 4.25),
  ('suprema', 'Suprema', 'Suprema',
   'Cerveza salvadoreña clásica',
   'Classic Salvadoran beer',
   'cervezas', 2.50),
  ('pilsener', 'Pilsener', 'Pilsener',
   'Pilsener Salvadoreña',
   'Salvadoran Pilsener',
   'cervezas', 2.25),
  ('golden', 'Golden', 'Golden',
   'Cerveza Golden',
   'Golden Beer',
   'cervezas', 2.25),
  ('golden-extra', 'Golden Extra', 'Golden Extra',
   'Cerveza Golden Extra',
   'Golden Extra Beer',
   'cervezas', 2.25),

  -- CERVEZAS EXTRANJERAS
  ('corona', 'Corona', 'Corona',
   'Cerveza mexicana Corona Extra',
   'Mexican Corona Extra beer',
   'cervezas', 3.50),
  ('heineken', 'Heineken', 'Heineken',
   'Cerveza holandesa Heineken',
   'Dutch Heineken beer',
   'cervezas', 3.50),
  ('miller-draft', 'Miller Draft', 'Miller Draft',
   'Cerveza americana Miller Genuine Draft',
   'American Miller Genuine Draft beer',
   'cervezas', 3.50),
  ('modelo', 'Modelo', 'Modelo',
   'Cerveza mexicana Modelo Especial',
   'Mexican Modelo Especial beer',
   'cervezas', 3.50),
  ('blue-moon', 'Blue Moon', 'Blue Moon',
   'Cerveza de trigo estilo belga',
   'Belgian-style wheat ale',
   'cervezas', 3.50),
  ('stella-artois', 'Stella Artois', 'Stella Artois',
   'Pilsner belga premium',
   'Premium Belgian pilsner',
   'cervezas', 3.50),
  ('michelob-ultra', 'Michelob Ultra', 'Michelob Ultra',
   'Cerveza americana ligera',
   'American light beer',
   'cervezas', 3.50),
  ('michelada-tradicional', 'Michelada Tradicional', 'Traditional Michelada',
   'Michelada con limón, sal y especias',
   'Michelada with lime, salt and spices',
   'cervezas', 1.50),
  ('smirnoff-ice', 'Smirnoff Ice', 'Smirnoff Ice',
   'Bebida Smirnoff Ice',
   'Smirnoff Ice beverage',
   'cervezas', 3.75)
ON CONFLICT (code) DO UPDATE SET
  description_es = EXCLUDED.description_es,
  price_regular = EXCLUDED.price_regular;

-- ═══════════════════════════════════════════════════════════════════════════
-- POSTRES
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO menu_items_v2 (code, name_es, name_en, description_es, description_en, category_code, price_regular, is_best_seller) VALUES
  ('ganache-chocolate', 'Ganache de Chocolate', 'Chocolate Ganache',
   'Postre de ganache de chocolate premium',
   'Premium chocolate ganache dessert',
   'postres', 3.99, false),
  ('brownie-helado', 'Brownie con Helado', 'Brownie with Ice Cream',
   'Brownie de chocolate tibio con helado de vainilla',
   'Warm chocolate brownie with vanilla ice cream',
   'postres', 3.99, true),
  ('cheesecake-fresa', 'Cheesecake de Fresa', 'Strawberry Cheesecake',
   'Cheesecake estilo New York con fresas frescas',
   'New York style cheesecake with fresh strawberries',
   'postres', 3.99, false),
  ('panna-cotta', 'Panna Cotta', 'Panna Cotta',
   'Postre italiano de crema con opción: frutos rojos, maracuyá o fresa - TOP #1 POSTRE',
   'Italian cream dessert with choice: red fruits, passion fruit or strawberry - TOP #1 DESSERT',
   'postres', 3.99, true)
ON CONFLICT (code) DO UPDATE SET
  description_es = EXCLUDED.description_es,
  price_regular = EXCLUDED.price_regular;

-- ═══════════════════════════════════════════════════════════════════════════
-- MENÚ INFANTIL
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO menu_items_v2 (code, name_es, name_en, description_es, description_en, category_code, price_regular) VALUES
  ('chunks-pollo', 'Chunks de Pollo', 'Chicken Chunks',
   'Trozos de pechuga empanizados + papas francesas + té',
   'Breaded chicken breast pieces + french fries + tea',
   'menu-infantil', 5.99),
  ('cangreburger', 'Cangreburger', 'Crab Burger',
   'Hamburguesa de pollo + papas francesas + té',
   'Chicken burger + french fries + tea',
   'menu-infantil', 5.50)
ON CONFLICT (code) DO UPDATE SET
  description_es = EXCLUDED.description_es,
  price_regular = EXCLUDED.price_regular;

-- ═══════════════════════════════════════════════════════════════════════════
-- UPSELL PAIRINGS
-- ═══════════════════════════════════════════════════════════════════════════

-- Pizza + Beverage pairings
INSERT INTO upsell_pairings (primary_item_id, paired_item_id, pairing_type, pairing_strength, suggestion_es, suggestion_en)
SELECT
  pizza.id,
  beverage.id,
  'beverage',
  CASE
    WHEN beverage.code = 'puente-quemado' THEN 9
    WHEN beverage.code = 'frozen' THEN 8
    WHEN beverage.code = 'limonadas' THEN 7
    ELSE 5
  END,
  CASE
    WHEN beverage.code = 'puente-quemado' THEN '¡Perfecto con una cerveza artesanal Puente Quemado!'
    WHEN beverage.code = 'frozen' THEN '¡Refréscate con un delicioso Frozen!'
    WHEN beverage.code = 'limonadas' THEN '¡Acompaña con una limonada natural!'
    ELSE '¿Te gustaría una bebida?'
  END,
  CASE
    WHEN beverage.code = 'puente-quemado' THEN 'Perfect with a Puente Quemado craft beer!'
    WHEN beverage.code = 'frozen' THEN 'Refresh yourself with a delicious Frozen!'
    WHEN beverage.code = 'limonadas' THEN 'Pair it with a natural lemonade!'
    ELSE 'Would you like a drink?'
  END
FROM menu_items_v2 pizza
CROSS JOIN menu_items_v2 beverage
WHERE pizza.category_code IN ('pizzas', 'pizzas-especiales')
  AND beverage.code IN ('puente-quemado', 'frozen', 'limonadas')
ON CONFLICT (primary_item_id, paired_item_id) DO NOTHING;

-- Main dish + Dessert pairings
INSERT INTO upsell_pairings (primary_item_id, paired_item_id, pairing_type, pairing_strength, suggestion_es, suggestion_en)
SELECT
  main.id,
  dessert.id,
  'dessert',
  CASE
    WHEN dessert.code = 'panna-cotta' THEN 10
    WHEN dessert.code = 'brownie-helado' THEN 9
    ELSE 7
  END,
  CASE
    WHEN dessert.code = 'panna-cotta' THEN '¡No te pierdas nuestra Panna Cotta #1!'
    WHEN dessert.code = 'brownie-helado' THEN '¡El Brownie con Helado es el final perfecto!'
    ELSE '¿Un postre para terminar?'
  END,
  CASE
    WHEN dessert.code = 'panna-cotta' THEN 'Don''t miss our #1 Panna Cotta!'
    WHEN dessert.code = 'brownie-helado' THEN 'The Brownie with Ice Cream is the perfect ending!'
    ELSE 'A dessert to finish?'
  END
FROM menu_items_v2 main
CROSS JOIN menu_items_v2 dessert
WHERE main.category_code IN ('platos-fuertes', 'pastas')
  AND dessert.code IN ('panna-cotta', 'brownie-helado')
ON CONFLICT (primary_item_id, paired_item_id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- UPDATE ALLERGEN SUMMARIES (after ingredients are linked)
-- ═══════════════════════════════════════════════════════════════════════════

-- This will be run after menu_item_ingredients are populated
-- UPDATE menu_items_v2 SET allergen_summary = compute_menu_item_allergens(id);

-- ═══════════════════════════════════════════════════════════════════════════
-- SEED COMPLETE
-- ═══════════════════════════════════════════════════════════════════════════
