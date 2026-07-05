/**
 * Simple test runner for backend tests
 * Runs all *.test.mjs files and reports results
 */

import { glob } from 'glob';
import { pathToFileURL } from 'url';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

async function runTests() {
  console.log('\n🧪 Running ParentScript backend tests...\n');

  const testFiles = await glob('**/*.test.mjs', {
    ignore: 'node_modules/**',
    cwd: process.cwd(),
  });

  for (const file of testFiles) {
    console.log(`\n📄 ${file}`);

    try {
      const module = await import(pathToFileURL(file).href);

      if (module.tests) {
        for (const test of module.tests) {
          totalTests++;
          try {
            await test.fn();
            console.log(`  ✓ ${test.name}`);
            passedTests++;
          } catch (error) {
            console.log(`  ✗ ${test.name}`);
            console.log(`    ${error.message}`);
            failedTests++;
          }
        }
      }
    } catch (error) {
      console.error(`  ✗ Failed to load test file: ${error.message}`);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`\n📊 Test Results:`);
  console.log(`   Total:  ${totalTests}`);
  console.log(`   ✓ Pass:  ${passedTests}`);
  console.log(`   ✗ Fail:  ${failedTests}`);
  console.log(`\n${failedTests === 0 ? '✅ All tests passed!' : '❌ Some tests failed'}\n`);

  process.exit(failedTests > 0 ? 1 : 0);
}

runTests();
