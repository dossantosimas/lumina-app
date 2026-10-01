import {defineConfig} from 'vitest/config';
import {fileURLToPath} from 'node:url';
export default defineConfig({resolve:{alias:{'@':fileURLToPath(new URL('./src',import.meta.url)),'server-only':fileURLToPath(new URL('./tests/support/server-only.ts',import.meta.url))}},test:{include:[process.env['LUMINA_QA_LOAD']==='1'?'tests/performance/**/*.test.ts':'tests/integration/**/*.test.ts'],environment:'node',setupFiles:['./scripts/test-setup.ts'],fileParallelism:false,testTimeout:30000,hookTimeout:60000}});
