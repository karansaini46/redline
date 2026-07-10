import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

async function setup() {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  
  console.log("Checking buckets...")
  const { data: buckets } = await supabase.storage.listBuckets()
  
  if (!buckets?.find(b => b.name === 'contracts')) {
    console.log("Creating 'contracts' bucket...")
    const { data, error } = await supabase.storage.createBucket('contracts', {
      public: false, // Contracts should not be publicly accessible
      fileSizeLimit: 20 * 1024 * 1024 // 20 MB
    })
    
    if (error) {
      console.error("❌ Failed to create bucket:", error.message)
      process.exit(1)
    }
    console.log("✅ 'contracts' bucket created successfully!")
  } else {
    console.log("✅ 'contracts' bucket already exists.")
  }
}

setup()
