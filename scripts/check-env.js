import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const requiredEnv = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_OPENAI_API_KEY'
];

const optionalEnv = ['VITE_GOOGLE_BOOKS_API_KEY'];

const missingRequired = requiredEnv.filter((name) => !process.env[name]);
if (missingRequired.length > 0) {
  console.error('Missing required env vars:', missingRequired.join(', '));
  process.exit(1);
}

const presentOptional = optionalEnv.filter((name) => process.env[name]);
console.log('All required env vars are present.');
if (presentOptional.length > 0) {
  console.log('Optional env vars detected:', presentOptional.join(', '));
} else {
  console.log('Optional env vars not configured.');
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const openAiKey = process.env.VITE_OPENAI_API_KEY;
const googleBooksKey = process.env.VITE_GOOGLE_BOOKS_API_KEY || '';

if (!/^https?:\/\/[\w-]+\.supabase\.co\/?$/.test(supabaseUrl)) {
  console.warn('WARNING: VITE_SUPABASE_URL does not look like a standard Supabase project URL.');
}

if (supabaseAnonKey?.startsWith('sb_secret_')) {
  console.warn(
    'WARNING: VITE_SUPABASE_ANON_KEY looks like a service role key (sb_secret_*).'
  );
  console.warn('Use the Supabase anon/public key instead, not the service key.');
}

if (!openAiKey.startsWith('sk-')) {
  console.warn('WARNING: VITE_OPENAI_API_KEY does not start with `sk-`. Verify this is a valid OpenAI API key.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabase() {
  try {
    const { error } = await supabase.auth.getSession();
    if (error) throw error;
    console.log('Supabase connectivity: OK');
  } catch (err) {
    console.error('Supabase connectivity failed:', err.message || err);
    if (
      err?.message &&
      (err.message.toLowerCase().includes('invalid') ||
        err.message.toLowerCase().includes('jwt') ||
        err.message.toLowerCase().includes('unregistered') ||
        err.message.toLowerCase().includes('unauthorized'))
    ) {
      console.error('→ This usually means the Supabase URL or anon key is invalid or not registered for this project.');
    }
    process.exitCode = 1;
  }
}

async function testOpenAI() {
  try {
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: {
        Authorization: `Bearer ${openAiKey}`,
      },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`${res.status} ${res.statusText} — ${body}`);
    }
    console.log('OpenAI connectivity: OK');
  } catch (err) {
    console.error('OpenAI connectivity failed:', err.message || err);
    if (err?.message && err.message.includes('401')) {
      console.error('→ This usually means VITE_OPENAI_API_KEY is missing, invalid, or revoked.');
    }
    process.exitCode = 1;
  }
}

async function testGoogleBooks() {
  try {
    const url = new URL('https://www.googleapis.com/books/v1/volumes');
    url.searchParams.set('q', 'harry potter');
    url.searchParams.set('maxResults', '1');
    if (googleBooksKey) url.searchParams.set('key', googleBooksKey);

    const res = await fetch(url.toString());
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`${res.status} ${res.statusText} — ${body}`);
    }
    console.log('Google Books connectivity: OK');
  } catch (err) {
    if (googleBooksKey) {
      console.error('Google Books connectivity failed:', err.message || err);
      if (err?.message && err.message.includes('403')) {
        console.error('→ This usually means VITE_GOOGLE_BOOKS_API_KEY is invalid, missing API access, or restricted.');
      }
    } else {
      console.warn('Google Books API key is not configured; skipping key validation.');
    }
    process.exitCode = 1;
  }
}

async function main() {
  await testSupabase();
  await testOpenAI();
  await testGoogleBooks();

  if (process.exitCode === 1) {
    console.error('\nOne or more connectivity checks failed.');
    process.exit(1);
  }
  console.log('\nEnvironment and connectivity verified.');
}

main();
