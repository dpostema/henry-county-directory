import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const bucketName = "business-images";
  console.log(`Checking if bucket "${bucketName}" exists...`);
  
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    console.error("Error listing buckets:", listError);
    return;
  }

  const exists = buckets.some(b => b.name === bucketName);
  if (exists) {
    console.log(`Bucket "${bucketName}" already exists.`);
  } else {
    console.log(`Creating bucket "${bucketName}"...`);
    const { data, error } = await supabase.storage.createBucket(bucketName, {
      public: true,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'],
      fileSizeLimit: 5242880 // 5MB
    });

    if (error) {
      console.error("Error creating bucket:", error);
    } else {
      console.log(`Successfully created bucket "${bucketName}"`);
    }
  }
}

main();
