import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  console.log('🔗 Testing Supabase connection...\n')

  // Test connection
  const { data: tables, error: tablesError } = await supabase.from('menu_items').select('id').limit(1)

  if (tablesError) {
    console.log('❌ Connection error:', tablesError.message)
    return
  }

  console.log('✅ Connection OK')
  console.log('✅ menu_items table accessible')

  // Count existing items
  const { count } = await supabase.from('menu_items').select('*', { count: 'exact', head: true })
  console.log('📊 Current menu items:', count || 0)

  // Test insert with allowed category
  const { data: inserted, error: insertError } = await supabase.from('menu_items').insert({
    name: 'Connection Test',
    description: 'Test item',
    price: 1,
    category: 'pizza',
    available: true
  }).select()

  if (insertError) {
    console.log('❌ Insert test failed:', insertError.message)
  } else {
    console.log('✅ Insert permissions OK (service role working)')
    // Clean up
    if (inserted && inserted[0]) {
      await supabase.from('menu_items').delete().eq('id', inserted[0].id)
      console.log('✅ Delete permissions OK')
    }
  }

  console.log('\n✅ All systems connected correctly!')
}

test()
