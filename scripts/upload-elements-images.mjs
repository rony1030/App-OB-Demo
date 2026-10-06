import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://whrimmszdeghblbktivp.supabase.co';
const supabaseKey = 'sb_publishable_Au-aayWtou-etfPRvaBShg_ksAdxsLa';

const supabase = createClient(supabaseUrl, supabaseKey);

const localDir = path.resolve('public/images/projects/elements');
const files = fs.readdirSync(localDir);

async function main() {
  console.log('Uploading images to Supabase storage bucket: public-assets...');
  
  for (const file of files) {
    if (file.endsWith('.ico')) continue;
    const filePath = path.join(localDir, file);
    const fileBuffer = fs.readFileSync(filePath);
    const contentType = file.endsWith('.png') ? 'image/png' : 'image/jpeg';
    
    // Upload to bello-valdez-enterprise/projects/elements/
    const targetPath = `bello-valdez-enterprise/projects/elements/${file}`;
    console.log(`Uploading ${file} -> ${targetPath}...`);
    
    const { data, error } = await supabase.storage
      .from('public-assets')
      .upload(targetPath, fileBuffer, {
        contentType,
        upsert: true,
      });
      
    if (error) {
      console.error(`Failed to upload ${targetPath}:`, error.message);
    } else {
      console.log(`Success: ${targetPath}`);
    }
  }
  console.log('All images uploaded!');
}

main().catch(console.error);
