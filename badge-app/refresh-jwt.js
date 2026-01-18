import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function refreshToken() {
  try {
    console.log('🔄 Generating new Snowflake JWT token...');
    
    // Generate new JWT token using Snow CLI
    const jwt = execSync(
      'snow connection generate-jwt --account nwzwzxm-tp92130 --user HarshShukla --private-key-path .\\snowflake_key',
      { encoding: 'utf-8', cwd: __dirname }
    ).trim();
    
    if (!jwt) {
      console.error('❌ Failed to generate JWT token (empty response)');
      return;
    }
    
    console.log('✅ JWT token generated successfully');
    console.log('🔄 Updating Convex environment variable...');
    
    // Update Convex environment variable
    // Note: Use --prod flag if you want to update production environment
    // Remove --prod to update dev environment
    execSync(
      `npx convex env set SNOWFLAKE_BEARER_TOKEN "${jwt}"`,
      { stdio: 'inherit', cwd: __dirname }
    );
    
    console.log('✅ JWT token updated in Convex at', new Date().toISOString());
    console.log('⏰ Next refresh in 50 minutes\n');
  } catch (error) {
    console.error('❌ Error refreshing JWT token:', error.message);
    console.error('Will retry in 50 minutes...\n');
  }
}

// Run immediately on start
console.log('🚀 Starting Snowflake JWT refresh service...');
console.log('⏱️  Token will refresh every 50 minutes\n');
refreshToken();

// Run every 50 minutes (3000000 milliseconds)
setInterval(refreshToken, 10 * 60 * 1000);
