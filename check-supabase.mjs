import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

async function testConnection() {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env")
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  
  console.log(`Connecting to: ${supabaseUrl}`)
  
  try {
    // Attempt to list buckets to verify storage access
    const { data, error } = await supabase.storage.listBuckets()
    
    if (error) {
      console.error("❌ Failed to connect to Supabase Storage:", error.message)
      process.exit(1)
    }
    
    console.log("✅ Successfully connected to Supabase!")
    console.log("Available Storage Buckets:")
    if (data && data.length > 0) {
      data.forEach(b => console.log(` - ${b.name}`))
    } else {
      console.log(" - (No buckets found)")
    }
    
  } catch (err) {
    console.error("❌ Unexpected connection error:", err)
    process.exit(1)
  }
}

testConnection()
