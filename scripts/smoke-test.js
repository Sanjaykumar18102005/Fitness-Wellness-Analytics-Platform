const http = require('http');

const targetUrl = process.argv[2] || 'http://localhost:3000';
const timestamp = Date.now();
const testEmail = `smoke_${timestamp}@fitclub.com`;
const testPassword = 'SmokeTestPassword123!';

console.log('=========================================================');
console.log(`🔥 Running Post-Deployment Smoke Tests against: ${targetUrl}`);
console.log('=========================================================');

function makeRequest(url, method, payload = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
    });

    req.on('error', (err) => reject(err));

    if (payload) {
      req.write(JSON.stringify(payload));
    }
    req.end();
  });
}

async function runSmokeTests() {
  try {
    // 1. Health Check Endpoint
    console.log(`[CHECK 1/3] Testing GET ${targetUrl}/api/health-check...`);
    const healthRes = await makeRequest(`${targetUrl}/api/health-check`, 'GET');
    if (healthRes.statusCode !== 200) {
      throw new Error(`Health check returned HTTP ${healthRes.statusCode}`);
    }
    console.log('✅ [PASS] Health check endpoint returned HTTP 200 OK');

    // 2. Member Registration Endpoint
    console.log(`[CHECK 2/3] Testing POST ${targetUrl}/api/auth/register (${testEmail})...`);
    const registerRes = await makeRequest(`${targetUrl}/api/auth/register`, 'POST', {
      email: testEmail,
      password: testPassword,
      name: 'Smoke Tester',
      role: 'member',
    });
    if (registerRes.statusCode !== 201) {
      throw new Error(`Member registration returned HTTP ${registerRes.statusCode}: ${registerRes.body}`);
    }
    console.log('✅ [PASS] Member registration succeeded with HTTP 201 Created');

    // 3. Member Login Endpoint
    console.log(`[CHECK 3/3] Testing POST ${targetUrl}/api/auth/login...`);
    const loginRes = await makeRequest(`${targetUrl}/api/auth/login`, 'POST', {
      email: testEmail,
      password: testPassword,
    });
    if (loginRes.statusCode !== 200) {
      throw new Error(`Member login returned HTTP ${loginRes.statusCode}: ${loginRes.body}`);
    }
    console.log('✅ [PASS] User authentication verified successfully');

    console.log('=========================================================');
    console.log('🎉 ALL POST-DEPLOYMENT SMOKE TESTS PASSED SUCCESSFULLY!');
    console.log('=========================================================');
    process.exit(0);
  } catch (err) {
    console.error(`❌ [FAIL] Smoke test failed: ${err.message}`);
    process.exit(1);
  }
}

runSmokeTests();
