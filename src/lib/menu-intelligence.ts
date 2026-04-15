// ═══════════════════════════════════════════════════════════════════════════
// SIMMER DOWN - MENU INTELLIGENCE ENGINE
// Powers chatbot's ability to answer complex menu questions
// ═══════════════════════════════════════════════════════════════════════════

import {
  MENU,
  LOCATIONS,
  CATEGORIES,
  LocationId,
  MenuItem,
  getMenuByLocation,
  getMenuByCategory,
  getBestSellers,
  searchMenu,
  getVegetarianItems,
  getSeafoodItems,
  getItemPrice,
  formatPrice,
} from "@/data/simmer-menu";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface IntelligentMenuItem extends MenuItem {
  ingredients_es: string[];
  ingredients_en: string[];
  allergen_tags: string[];
  effective_price: number;
  effective_price_personal?: number;
  formatted_price: string;
  is_available_at_location: boolean;
  upsell_suggestions?: UpsellSuggestion[];
}

export interface UpsellSuggestion {
  item: MenuItem;
  type: "beverage" | "dessert" | "side";
  suggestion_es: string;
  suggestion_en: string;
}

export interface AllergenInfo {
  code: string;
  name_es: string;
  name_en: string;
  emoji: string;
  items_containing: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// INGREDIENT DATABASE (Extracted from user's menu data)
// ─────────────────────────────────────────────────────────────────────────────

interface IngredientData {
  es: string[];
  en: string[];
  allergens: string[];
}

const ITEM_INGREDIENTS: Record<string, IngredientData> = {
  // ENTRADAS
  "molcajete-coulotte": {
    es: [
      "carne coulotte",
      "salsa aguacate",
      "mix de cebolla",
      "jalapeño",
      "cebollín",
      "ajo tuteado",
      "tortilla",
    ],
    en: [
      "coulotte beef",
      "avocado salsa",
      "onion mix",
      "jalapeño",
      "green onion",
      "sautéed garlic",
      "tortilla",
    ],
    allergens: ["gluten"],
  },
  "fundido-camaron-pollo": {
    es: [
      "camarones",
      "pechuga de pollo",
      "salsa pomodoro",
      "queso mozzarella",
      "pan al ajo",
    ],
    en: [
      "shrimp",
      "chicken breast",
      "pomodoro sauce",
      "mozzarella cheese",
      "garlic bread",
    ],
    allergens: ["shellfish", "dairy", "gluten"],
  },
  "fundido-champinones": {
    es: [
      "champiñones frescos",
      "mezcla de quesos",
      "salsa pomodoro",
      "pan al ajo",
    ],
    en: ["fresh mushrooms", "cheese blend", "pomodoro sauce", "garlic bread"],
    allergens: ["dairy", "gluten"],
  },
  "fundido-filet-mignon": {
    es: ["filet mignon", "mezcla de quesos derretidos", "pan al ajo"],
    en: ["filet mignon", "melted cheese blend", "garlic bread"],
    allergens: ["dairy", "gluten"],
  },
  "cheese-balls": {
    es: ["mezcla de quesos", "empanizado", "salsa pomodoro"],
    en: ["mixed cheese", "breading", "pomodoro sauce"],
    allergens: ["dairy", "gluten"],
  },
  "patatas-tocino": {
    es: [
      "rondeles de papa",
      "tocino crujiente",
      "salsa pomodoro",
      "queso mozzarella",
    ],
    en: [
      "potato rounds",
      "crispy bacon",
      "pomodoro sauce",
      "mozzarella cheese",
    ],
    allergens: ["dairy"],
  },
  "camarones-empanizados": {
    es: [
      "camarones empanizados",
      "papas fritas",
      "salsa búfalo/cilantro parmesano/teriyaki",
    ],
    en: [
      "breaded shrimp",
      "french fries",
      "buffalo/cilantro parmesan/teriyaki sauce",
    ],
    allergens: ["shellfish", "gluten", "dairy"],
  },
  "leche-de-tigre": {
    es: [
      "pescado blanco fresco",
      "camarones",
      "cebolla morada",
      "cilantro",
      "limón",
      "chips de plátano",
    ],
    en: [
      "fresh white fish",
      "shrimp",
      "red onion",
      "cilantro",
      "lemon",
      "plantain chips",
    ],
    allergens: ["fish", "shellfish"],
  },
  "ceviche-tropical": {
    es: [
      "pescado fresco",
      "piña tropical",
      "cebolla morada",
      "cilantro",
      "chips de plátano",
    ],
    en: [
      "fresh fish",
      "tropical pineapple",
      "red onion",
      "cilantro",
      "plantain chips",
    ],
    allergens: ["fish"],
  },
  "aguachile-camaron": {
    es: [
      "camarones frescos",
      "aguachile verde",
      "pepino",
      "cebolla morada",
      "jalapeño",
      "cilantro",
      "ajo",
      "chips de plátano",
    ],
    en: [
      "fresh shrimp",
      "green aguachile",
      "cucumber",
      "red onion",
      "jalapeño",
      "cilantro",
      "garlic",
      "plantain chips",
    ],
    allergens: ["shellfish"],
  },

  // ENSALADAS
  "ensalada-gambas": {
    es: [
      "camarones a la plancha",
      "lechugas",
      "tomates cherry",
      "zanahoria",
      "pepino",
      "aguacate",
      "elote dulce",
      "crotones",
      "aderezo rosa",
    ],
    en: [
      "grilled shrimp",
      "lettuce",
      "cherry tomatoes",
      "carrot",
      "cucumber",
      "avocado",
      "sweet corn",
      "croutons",
      "pink dressing",
    ],
    allergens: ["shellfish", "gluten", "dairy", "eggs"],
  },
  "ensalada-criolla": {
    es: [
      "lechuga fresca",
      "lomito de res",
      "aguacate",
      "champiñones",
      "tomates cherry",
      "elote dulce",
      "cebolla morada",
      "aderezo yogurlantro",
      "chips de maíz",
    ],
    en: [
      "fresh lettuce",
      "beef tenderloin",
      "avocado",
      "mushrooms",
      "cherry tomatoes",
      "sweet corn",
      "red onion",
      "yogurt-cilantro dressing",
      "corn chips",
    ],
    allergens: ["dairy"],
  },
  "ensalada-impecable": {
    es: [
      "lechuga fresca",
      "pechuga de pollo a la plancha",
      "manzana verde",
      "zanahoria fresca",
      "elote dulce",
      "aguacate",
      "tocino",
      "almendras",
      "tomates cherry",
      "aderezo yogurlantro",
      "chips de maíz",
    ],
    en: [
      "fresh lettuce",
      "grilled chicken breast",
      "green apple",
      "fresh carrot",
      "sweet corn",
      "avocado",
      "bacon",
      "almonds",
      "cherry tomatoes",
      "yogurt-cilantro dressing",
      "corn chips",
    ],
    allergens: ["dairy", "nuts"],
  },

  // PASTAS
  "fettuccine-calamardina": {
    es: [
      "fettuccine",
      "salsa calamaridina",
      "camarón jumbo",
      "almejas",
      "calamar",
      "mejillones",
      "pan tostado al ajo",
    ],
    en: [
      "fettuccine",
      "calamaridina sauce",
      "jumbo shrimp",
      "clams",
      "squid",
      "mussels",
      "garlic toast",
    ],
    allergens: ["gluten", "shellfish", "eggs"],
  },
  "fettuccine-mar-y-tierra": {
    es: [
      "fettuccine",
      "salsa Alfredo",
      "mariscos mixtos",
      "pollo",
      "pan tostado al ajo",
    ],
    en: [
      "fettuccine",
      "Alfredo sauce",
      "mixed seafood",
      "chicken",
      "garlic toast",
    ],
    allergens: ["gluten", "dairy", "shellfish", "eggs"],
  },
  "lasagna-bolognesa": {
    es: [
      "láminas de lasagna",
      "salsa bolognesa",
      "queso mozzarella",
      "queso crema",
      "pan tostado al ajo",
    ],
    en: [
      "lasagna sheets",
      "bolognese sauce",
      "mozzarella cheese",
      "cream cheese",
      "garlic toast",
    ],
    allergens: ["gluten", "dairy", "eggs"],
  },
  "penne-brocoli-tocino": {
    es: [
      "penne",
      "tocino crocante",
      "brócoli",
      "trozos de pechuga",
      "salsa Alfredo",
      "mozzarella gratinado",
      "pan tostado al ajo",
    ],
    en: [
      "penne",
      "crispy bacon",
      "broccoli",
      "chicken breast pieces",
      "Alfredo sauce",
      "gratinated mozzarella",
      "garlic toast",
    ],
    allergens: ["gluten", "dairy"],
  },

  // PIZZAS CLÁSICAS
  "pizza-fungi": {
    es: ["masa de pizza", "mozzarella", "cebolla", "hongos", "chimichurri"],
    en: ["pizza dough", "mozzarella", "onion", "mushrooms", "chimichurri"],
    allergens: ["gluten", "dairy"],
  },
  "pizza-pepperoni": {
    es: ["masa de pizza", "mozzarella", "pepperoni"],
    en: ["pizza dough", "mozzarella", "pepperoni"],
    allergens: ["gluten", "dairy"],
  },
  "pizza-maradona": {
    es: [
      "masa de pizza",
      "mozzarella",
      "chorizo argentino",
      "pimientos verdes",
      "cebolla",
      "chimichurri",
    ],
    en: [
      "pizza dough",
      "mozzarella",
      "Argentine chorizo",
      "green peppers",
      "onion",
      "chimichurri",
    ],
    allergens: ["gluten", "dairy"],
  },
  "pizza-brazuca": {
    es: [
      "masa de pizza",
      "mozzarella",
      "piña",
      "salami",
      "salsa de ajo",
      "jalapeños",
    ],
    en: [
      "pizza dough",
      "mozzarella",
      "pineapple",
      "salami",
      "garlic sauce",
      "jalapeños",
    ],
    allergens: ["gluten", "dairy"],
  },
  "pizza-vegetariana": {
    es: [
      "masa de pizza",
      "mozzarella",
      "pimientos verdes",
      "cebolla",
      "tomates frescos",
      "champiñones",
      "zanahoria",
      "brócoli marinado",
    ],
    en: [
      "pizza dough",
      "mozzarella",
      "green peppers",
      "onion",
      "fresh tomatoes",
      "mushrooms",
      "carrot",
      "marinated broccoli",
    ],
    allergens: ["gluten", "dairy"],
  },
  "pizza-piccolo": {
    es: [
      "masa de pizza",
      "mozzarella",
      "pechuga marinada al grill",
      "salsa de ajo",
      "cilantro",
    ],
    en: [
      "pizza dough",
      "mozzarella",
      "grilled marinated chicken",
      "garlic sauce",
      "cilantro",
    ],
    allergens: ["gluten", "dairy"],
  },
  "pizza-margherita": {
    es: [
      "masa de pizza",
      "mozzarella",
      "tomates cherry marinados",
      "albahaca fresca",
    ],
    en: [
      "pizza dough",
      "mozzarella",
      "marinated cherry tomatoes",
      "fresh basil",
    ],
    allergens: ["gluten", "dairy"],
  },
  "pizza-hawaiana": {
    es: [
      "masa de pizza",
      "mozzarella",
      "cheddar",
      "jamón",
      "piña",
      "pimientos asados",
    ],
    en: [
      "pizza dough",
      "mozzarella",
      "cheddar",
      "ham",
      "pineapple",
      "roasted peppers",
    ],
    allergens: ["gluten", "dairy"],
  },
  "pizza-verde-mella": {
    es: [
      "masa de pizza",
      "mozzarella",
      "fajitas de pollo al grill",
      "manzana verde",
      "rebanadas de almendra",
    ],
    en: [
      "pizza dough",
      "mozzarella",
      "grilled chicken fajitas",
      "green apple",
      "almond slices",
    ],
    allergens: ["gluten", "dairy", "nuts"],
  },
  "pizza-loroka": {
    es: ["masa de pizza", "mozzarella", "loroco", "tocino", "pepperoni"],
    en: ["pizza dough", "mozzarella", "loroco flower", "bacon", "pepperoni"],
    allergens: ["gluten", "dairy"],
  },
  "pizza-cuatro-quesos": {
    es: [
      "masa de pizza",
      "queso criollo",
      "parmesano",
      "mozzarella",
      "queso crema",
      "albahaca fresca",
    ],
    en: [
      "pizza dough",
      "criollo cheese",
      "parmesan",
      "mozzarella",
      "cream cheese",
      "fresh basil",
    ],
    allergens: ["gluten", "dairy"],
  },

  // PIZZAS ESPECIALES
  "pizza-castellana": {
    es: [
      "masa de pizza",
      "mozzarella",
      "salami di pamplona",
      "chistorra",
      "chorizo ibérico",
    ],
    en: [
      "pizza dough",
      "mozzarella",
      "Pamplona salami",
      "chistorra",
      "Iberian chorizo",
    ],
    allergens: ["gluten", "dairy"],
  },
  "pizza-prosciutto": {
    es: [
      "masa de pizza",
      "mozzarella",
      "tomates deshidratados",
      "jamón prosciutto",
      "pesto de albahaca",
    ],
    en: [
      "pizza dough",
      "mozzarella",
      "sun-dried tomatoes",
      "prosciutto ham",
      "basil pesto",
    ],
    allergens: ["gluten", "dairy", "nuts"],
  },
  "pizza-ghiottone": {
    es: [
      "masa de pizza",
      "mozzarella",
      "tomates deshidratados",
      "salami",
      "jamón",
      "pepperoni",
      "chorizo",
      "aceitunas negras",
      "hongos",
    ],
    en: [
      "pizza dough",
      "mozzarella",
      "sun-dried tomatoes",
      "salami",
      "ham",
      "pepperoni",
      "chorizo",
      "black olives",
      "mushrooms",
    ],
    allergens: ["gluten", "dairy"],
  },
  "pizza-memorable": {
    es: [
      "masa de pizza",
      "mozzarella",
      "fajitas de res",
      "fajitas de pollo",
      "elote",
      "salsa BBQ",
      "ajonjolí",
    ],
    en: [
      "pizza dough",
      "mozzarella",
      "beef fajitas",
      "chicken fajitas",
      "corn",
      "BBQ sauce",
      "sesame",
    ],
    allergens: ["gluten", "dairy", "sesame"],
  },
  "pizza-don-cangrejo": {
    es: [
      "masa de pizza",
      "mozzarella",
      "camarones frescos",
      "almejas marinadas",
      "cebolla",
      "pimientos verdes",
      "aguacate fresco",
    ],
    en: [
      "pizza dough",
      "mozzarella",
      "fresh shrimp",
      "marinated clams",
      "onion",
      "green peppers",
      "fresh avocado",
    ],
    allergens: ["gluten", "dairy", "shellfish"],
  },
  "pizza-pescatore": {
    es: [
      "masa de pizza",
      "mozzarella",
      "calamar",
      "almejas",
      "camarones",
      "cebolla morada",
      "pimientos marinados",
    ],
    en: [
      "pizza dough",
      "mozzarella",
      "squid",
      "clams",
      "shrimp",
      "red onion",
      "marinated peppers",
    ],
    allergens: ["gluten", "dairy", "shellfish"],
  },
  "pizza-punta-jalapena": {
    es: [
      "masa de pizza",
      "mozzarella",
      "lomito de res",
      "cilantro fresco",
      "salsa punta jalapeña",
    ],
    en: [
      "pizza dough",
      "mozzarella",
      "beef tenderloin",
      "fresh cilantro",
      "punta jalapeña sauce",
    ],
    allergens: ["gluten", "dairy"],
  },
  "pizza-campesina": {
    es: [
      "masa de pizza",
      "mozzarella",
      "fajitas de res",
      "chorizo ibérico",
      "frijoles fritos",
      "salsa de aguacate",
      "cilantro fresco",
      "cebolla encurtida",
    ],
    en: [
      "pizza dough",
      "mozzarella",
      "beef fajitas",
      "Iberian chorizo",
      "refried beans",
      "avocado salsa",
      "fresh cilantro",
      "pickled onion",
    ],
    allergens: ["gluten", "dairy"],
  },
  "pizza-gamberetti": {
    es: [
      "masa de pizza",
      "mozzarella",
      "camarones frescos",
      "piña",
      "salsa Alfredo",
      "pesto de albahaca",
    ],
    en: [
      "pizza dough",
      "mozzarella",
      "fresh shrimp",
      "pineapple",
      "Alfredo sauce",
      "basil pesto",
    ],
    allergens: ["gluten", "dairy", "shellfish", "nuts"],
  },

  // PLATOS FUERTES
  "terramar-al-maitre": {
    es: [
      "lomito de res",
      "camarones jumbo",
      "rondeles de papa",
      "vegetales",
      "mantequilla maître",
    ],
    en: [
      "beef tenderloin",
      "jumbo shrimp",
      "potato rounds",
      "vegetables",
      "maître butter",
    ],
    allergens: ["shellfish", "dairy"],
  },
  "medallon-lomito-maitre": {
    es: [
      "corte estilo New York",
      "tocino",
      "hongos salteados",
      "tomates cherry",
      "mantequilla maître",
    ],
    en: [
      "New York-style cut",
      "bacon",
      "sautéed mushrooms",
      "cherry tomatoes",
      "maître butter",
    ],
    allergens: ["dairy"],
  },
  "pechuga-capresse": {
    es: [
      "pechuga de pollo",
      "mozzarella",
      "tomates deshidratados",
      "pesto",
      "puré de papa",
      "vegetales",
    ],
    en: [
      "chicken breast",
      "mozzarella",
      "sun-dried tomatoes",
      "pesto",
      "mashed potatoes",
      "vegetables",
    ],
    allergens: ["dairy", "nuts"],
  },
  "hamburguesa-casanova": {
    es: [
      "doble carne 100% res",
      "tocino",
      "hongos",
      "cebolla morada",
      "queso mozzarella",
      "papas francesas",
    ],
    en: [
      "double 100% beef patty",
      "bacon",
      "mushrooms",
      "red onion",
      "mozzarella cheese",
      "french fries",
    ],
    allergens: ["gluten", "dairy"],
  },
  "pescado-parrilla": {
    es: [
      "pescado entero",
      "chimichurri",
      "tortillas fritas",
      "cebolla encurtida",
    ],
    en: ["whole fish", "chimichurri", "fried tortillas", "pickled onion"],
    allergens: ["fish", "gluten"],
  },
  mariscada: {
    es: [
      "camarones",
      "almejas",
      "calamares",
      "mejillones",
      "pescado",
      "caldo especial",
    ],
    en: ["shrimp", "clams", "squid", "mussels", "fish", "special broth"],
    allergens: ["shellfish", "fish"],
  },

  // POSTRES
  "ganache-chocolate": {
    es: ["ganache de chocolate", "decoración dulce"],
    en: ["chocolate ganache", "sweet decoration"],
    allergens: ["dairy"],
  },
  "brownie-helado": {
    es: ["brownie de chocolate", "helado de vainilla", "chocolate drizzle"],
    en: ["chocolate brownie", "vanilla ice cream", "chocolate drizzle"],
    allergens: ["gluten", "dairy", "eggs"],
  },
  "cheesecake-fresa": {
    es: ["cheesecake estilo New York", "fresas frescas", "base de galleta"],
    en: ["New York style cheesecake", "fresh strawberries", "cookie base"],
    allergens: ["gluten", "dairy", "eggs"],
  },
  "panna-cotta": {
    es: ["crema panna cotta", "opción: frutos rojos/maracuyá/fresa"],
    en: ["panna cotta cream", "choice: red fruits/passion fruit/strawberry"],
    allergens: ["dairy"],
  },

  // MENÚ INFANTIL
  "chunks-pollo": {
    es: ["pechuga empanizada", "papas francesas", "té"],
    en: ["breaded chicken breast", "french fries", "tea"],
    allergens: ["gluten"],
  },
  cangreburger: {
    es: ["hamburguesa de pollo", "papas francesas", "té"],
    en: ["chicken burger", "french fries", "tea"],
    allergens: ["gluten"],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// ALLERGEN DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

const ALLERGENS: Record<string, { es: string; en: string; emoji: string }> = {
  gluten: { es: "Gluten", en: "Gluten", emoji: "🌾" },
  dairy: { es: "Lácteos", en: "Dairy", emoji: "🥛" },
  shellfish: { es: "Mariscos", en: "Shellfish", emoji: "🦐" },
  fish: { es: "Pescado", en: "Fish", emoji: "🐟" },
  eggs: { es: "Huevos", en: "Eggs", emoji: "🥚" },
  nuts: { es: "Frutos Secos", en: "Tree Nuts", emoji: "🥜" },
  sesame: { es: "Sésamo", en: "Sesame", emoji: "⚪" },
};

// ─────────────────────────────────────────────────────────────────────────────
// UPSELL PAIRING RULES
// ─────────────────────────────────────────────────────────────────────────────

const UPSELL_RULES: Record<
  string,
  { beverages: string[]; desserts: string[] }
> = {
  pizzas: {
    beverages: ["puente-quemado", "frozen", "limonadas"],
    desserts: ["panna-cotta", "brownie-helado"],
  },
  "pizzas-especiales": {
    beverages: ["puente-quemado", "corona", "frozen"],
    desserts: ["panna-cotta", "cheesecake-fresa"],
  },
  "platos-fuertes": {
    beverages: ["puente-quemado", "corona", "limonadas"],
    desserts: ["panna-cotta", "brownie-helado", "cheesecake-fresa"],
  },
  pastas: {
    beverages: ["corona", "limonadas", "refrescos-naturales"],
    desserts: ["panna-cotta", "ganache-chocolate"],
  },
  mariscos: {
    beverages: ["corona", "frozen", "limonadas"],
    desserts: ["panna-cotta", "cheesecake-fresa"],
  },
};

const UPSELL_SUGGESTIONS_ES: Record<string, string> = {
  "puente-quemado": "¡Perfecto con una cerveza artesanal Puente Quemado! 🍺",
  frozen: "¡Refréscate con un delicioso Frozen! ❄️",
  limonadas: "¡Acompaña con una limonada natural! 🍋",
  corona: "¿Una Corona bien fría para acompañar? 🍺",
  "panna-cotta": "¡No te pierdas nuestra Panna Cotta #1! 🍰",
  "brownie-helado": "¡El Brownie con Helado es el final perfecto! 🍫",
  "cheesecake-fresa": "¡Termina con un Cheesecake de Fresa! 🍓",
  "ganache-chocolate": "¿Un Ganache de Chocolate para cerrar? 🍫",
};

const UPSELL_SUGGESTIONS_EN: Record<string, string> = {
  "puente-quemado": "Perfect with a Puente Quemado craft beer! 🍺",
  frozen: "Refresh yourself with a delicious Frozen! ❄️",
  limonadas: "Pair it with a natural lemonade! 🍋",
  corona: "A cold Corona to go with it? 🍺",
  "panna-cotta": "Don't miss our #1 Panna Cotta! 🍰",
  "brownie-helado": "The Brownie with Ice Cream is the perfect ending! 🍫",
  "cheesecake-fresa": "Finish with a Strawberry Cheesecake! 🍓",
  "ganache-chocolate": "A Chocolate Ganache to close? 🍫",
};

// ─────────────────────────────────────────────────────────────────────────────
// INTELLIGENCE FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get item with full ingredient list
 * Answers: "What's in X?"
 */
export function getItemIngredients(
  itemCode: string,
  lang: "es" | "en" = "es",
): { ingredients: string[]; allergens: string[] } | null {
  const data = ITEM_INGREDIENTS[itemCode];
  if (!data) return null;

  return {
    ingredients: lang === "es" ? data.es : data.en,
    allergens: data.allergens,
  };
}

/**
 * Format ingredients response for chatbot
 */
export function formatIngredientsResponse(
  item: MenuItem,
  lang: "es" | "en" = "es",
): string {
  const data = ITEM_INGREDIENTS[item.id];
  if (!data) {
    return lang === "es"
      ? `${item.name}: ${item.description}`
      : `${item.name}: ${item.description}`;
  }

  const ingredients = lang === "es" ? data.es : data.en;
  const allergenList = data.allergens
    .map(
      (a) =>
        `${ALLERGENS[a]?.emoji || "⚠️"} ${lang === "es" ? ALLERGENS[a]?.es : ALLERGENS[a]?.en}`,
    )
    .join(", ");

  if (lang === "es") {
    let response = `**${item.name}**\n\n`;
    response += `🍽️ **Ingredientes:**\n${ingredients.join(", ")}\n\n`;
    if (data.allergens.length > 0) {
      response += `⚠️ **Alérgenos:** ${allergenList}`;
    }
    return response;
  } else {
    let response = `**${item.name}**\n\n`;
    response += `🍽️ **Ingredients:**\n${ingredients.join(", ")}\n\n`;
    if (data.allergens.length > 0) {
      response += `⚠️ **Allergens:** ${allergenList}`;
    }
    return response;
  }
}

/**
 * Find items by flavor/ingredient preference
 * Answers: "What do you recommend if I like Y?"
 */
export function findItemsByPreference(
  preference: string,
  locationId?: LocationId,
): MenuItem[] {
  const lowerPref = preference.toLowerCase();
  const matches: MenuItem[] = [];

  // Check each item's ingredients for matches
  for (const item of MENU) {
    if (locationId && !item.locations.includes(locationId)) continue;

    const data = ITEM_INGREDIENTS[item.id];
    if (data) {
      const allIngredients = [...data.es, ...data.en].map((i) =>
        i.toLowerCase(),
      );
      if (allIngredients.some((ing) => ing.includes(lowerPref))) {
        matches.push(item);
      }
    }

    // Also check name and description
    if (
      item.name.toLowerCase().includes(lowerPref) ||
      item.description.toLowerCase().includes(lowerPref)
    ) {
      if (!matches.find((m) => m.id === item.id)) {
        matches.push(item);
      }
    }
  }

  // Sort by best seller first
  return matches.sort(
    (a, b) => (b.bestSeller ? 1 : 0) - (a.bestSeller ? 1 : 0),
  );
}

/**
 * Find items WITHOUT a specific allergen
 * Answers: "What can I eat if I'm allergic to X?"
 */
export function findItemsWithoutAllergen(
  allergen: string,
  locationId?: LocationId,
  category?: string,
): MenuItem[] {
  const lowerAllergen = allergen.toLowerCase();
  const matches: MenuItem[] = [];

  for (const item of MENU) {
    if (locationId && !item.locations.includes(locationId)) continue;
    if (category && item.category !== category) continue;

    const data = ITEM_INGREDIENTS[item.id];
    if (data && !data.allergens.includes(lowerAllergen)) {
      matches.push(item);
    }
  }

  return matches.sort(
    (a, b) => (b.bestSeller ? 1 : 0) - (a.bestSeller ? 1 : 0),
  );
}

/**
 * Get items containing a specific allergen (for warnings)
 */
export function findItemsWithAllergen(
  allergen: string,
  locationId?: LocationId,
): MenuItem[] {
  const lowerAllergen = allergen.toLowerCase();
  const matches: MenuItem[] = [];

  for (const item of MENU) {
    if (locationId && !item.locations.includes(locationId)) continue;

    const data = ITEM_INGREDIENTS[item.id];
    if (data && data.allergens.includes(lowerAllergen)) {
      matches.push(item);
    }
  }

  return matches;
}

/**
 * Get price with size options
 * Answers: "What's the price for personal vs grande?"
 */
export function formatPriceWithSizes(
  item: MenuItem,
  locationId?: LocationId,
): string {
  const price = getItemPrice(item, locationId);

  if (item.pricePersonal) {
    return `Personal: $${item.pricePersonal.toFixed(2)} | Grande: $${price.toFixed(2)}`;
  }

  return `$${price.toFixed(2)}`;
}

/**
 * Get locations with delivery
 * Answers: "Which location has delivery?"
 */
export function getLocationsWithDelivery(): (typeof LOCATIONS)[LocationId][] {
  return Object.values(LOCATIONS);
}

/**
 * Find closest location (simplified - returns all)
 * Answers: "Which location is closest?"
 */
export function getLocationInfo(
  locationCode?: string,
): (typeof LOCATIONS)[LocationId] | (typeof LOCATIONS)[LocationId][] {
  if (locationCode) {
    const code = locationCode as LocationId;
    return LOCATIONS[code] || Object.values(LOCATIONS);
  }
  return Object.values(LOCATIONS);
}

/**
 * Get upsell suggestions for an item
 * Powers upsell recommendations
 */
export function getUpsellSuggestions(
  item: MenuItem,
  locationId?: LocationId,
): UpsellSuggestion[] {
  const rules = UPSELL_RULES[item.category];
  if (!rules) return [];

  const suggestions: UpsellSuggestion[] = [];

  // Add beverage suggestion
  const beverageCode = rules.beverages[0];
  const beverageItem = MENU.find((m) => m.id === beverageCode);
  if (beverageItem) {
    suggestions.push({
      item: beverageItem,
      type: "beverage",
      suggestion_es:
        UPSELL_SUGGESTIONS_ES[beverageCode] || "¿Una bebida para acompañar?",
      suggestion_en:
        UPSELL_SUGGESTIONS_EN[beverageCode] || "A drink to go with it?",
    });
  }

  // Add dessert suggestion
  const dessertCode = rules.desserts[0];
  const dessertItem = MENU.find((m) => m.id === dessertCode);
  if (dessertItem) {
    suggestions.push({
      item: dessertItem,
      type: "dessert",
      suggestion_es:
        UPSELL_SUGGESTIONS_ES[dessertCode] || "¿Un postre para terminar?",
      suggestion_en:
        UPSELL_SUGGESTIONS_EN[dessertCode] || "A dessert to finish?",
    });
  }

  return suggestions;
}

/**
 * Generate complete upsell message
 */
export function generateUpsellMessage(
  item: MenuItem,
  lang: "es" | "en" = "es",
): string {
  const suggestions = getUpsellSuggestions(item);
  if (suggestions.length === 0) return "";

  const messages = suggestions.map((s) =>
    lang === "es" ? s.suggestion_es : s.suggestion_en,
  );

  if (lang === "es") {
    return `\n\n💡 **¿Te gustaría agregar?**\n${messages.join("\n")}`;
  } else {
    return `\n\n💡 **Would you like to add?**\n${messages.join("\n")}`;
  }
}

/**
 * Get allergen warning for a specific item
 */
export function getAllergenWarning(
  item: MenuItem,
  lang: "es" | "en" = "es",
): string | null {
  const data = ITEM_INGREDIENTS[item.id];
  if (!data || data.allergens.length === 0) return null;

  const allergenList = data.allergens
    .map(
      (a) =>
        `${ALLERGENS[a]?.emoji || "⚠️"} ${lang === "es" ? ALLERGENS[a]?.es : ALLERGENS[a]?.en}`,
    )
    .join(", ");

  if (lang === "es") {
    return `⚠️ **Contiene:** ${allergenList}`;
  } else {
    return `⚠️ **Contains:** ${allergenList}`;
  }
}

/**
 * Main intelligence function - enriches menu item with all data
 */
export function enrichMenuItem(
  item: MenuItem,
  locationId?: LocationId,
): IntelligentMenuItem {
  const ingredientData = ITEM_INGREDIENTS[item.id];
  const price = getItemPrice(item, locationId);

  return {
    ...item,
    ingredients_es: ingredientData?.es || [],
    ingredients_en: ingredientData?.en || [],
    allergen_tags: ingredientData?.allergens || [],
    effective_price: price,
    effective_price_personal: item.pricePersonal,
    formatted_price: formatPriceWithSizes(item, locationId),
    is_available_at_location: locationId
      ? item.locations.includes(locationId)
      : true,
    upsell_suggestions: getUpsellSuggestions(item, locationId),
  };
}

// Export all the base menu functions too
export {
  MENU,
  LOCATIONS,
  CATEGORIES,
  getMenuByLocation,
  getMenuByCategory,
  getBestSellers,
  searchMenu,
  getVegetarianItems,
  getSeafoodItems,
  getItemPrice,
  formatPrice,
};

export type { LocationId, MenuItem };
