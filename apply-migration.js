import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    const migrationSQL = readFileSync(
      './supabase/migrations/20251220080651_remove_problematic_quote_status_trigger.sql',
      'utf8'
    );

    const cleanSQL = migrationSQL
      .split('\n')
      .filter(line => !line.trim().startsWith('/*') && !line.trim().startsWith('*') && !line.trim().startsWith('--'))
      .join('\n')
      .replace(/\/\*[\s\S]*?\*\//g, '');

    const statements = cleanSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log('Applying migration to remove problematic trigger...');

    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 50)}...`);
      const { error } = await supabase.rpc('exec_sql', { sql: statement });

      if (error) {
        console.error('Error:', error.message);
      } else {
        console.log('✓ Success');
      }
    }

    console.log('\nMigration applied successfully!');
  } catch (error) {
    console.error('Failed to apply migration:', error.message);
    console.log('\nPlease apply the migration manually via Supabase Dashboard:');
    console.log('1. Go to https://aqcvftydzrsvahiuurts.supabase.co');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run these commands:');
    console.log('   DROP TRIGGER IF EXISTS update_quote_status_trigger ON designer_quotes;');
    console.log('   DROP FUNCTION IF EXISTS update_quote_status_on_send();');
  }
}

applyMigration();
