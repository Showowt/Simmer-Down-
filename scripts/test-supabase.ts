// Test Supabase Connection and Tables
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log("🔌 Testing Supabase connection...\n");
  console.log(`URL: ${supabaseUrl}\n`);

  // Test 1: Check existing tables
  console.log("📋 Checking existing tables...");

  const tables = [
    "profiles",
    "menu_items",
    "locations",
    "orders",
    "contact_submissions",
    "events",
    "specials",
    "locations_v2",
    "menu_categories",
    "ingredients",
    "menu_items_v2",
  ];

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select("*").limit(1);
    if (error) {
      console.log(`  ❌ ${table}: ${error.message}`);
    } else {
      console.log(`  ✅ ${table}: exists (${data?.length || 0} sample rows)`);
    }
  }

  // Test 2: Count menu items
  console.log("\n📊 Menu Stats:");
  const { count: menuCount } = await supabase
    .from("menu_items")
    .select("*", { count: "exact", head: true });
  console.log(`  menu_items: ${menuCount || 0} items`);

  // Test 3: Count locations
  const { data: locs } = await supabase.from("locations").select("name");
  console.log(`  locations: ${locs?.length || 0} locations`);
  if (locs) {
    locs.forEach((l) => console.log(`    - ${l.name}`));
  }

  console.log("\n✅ Connection test complete!");
}

testConnection().catch(console.error);
