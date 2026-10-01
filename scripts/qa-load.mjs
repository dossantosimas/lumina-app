import {spawnSync} from 'node:child_process';
const r=spawnSync(process.execPath,['node_modules/vitest/vitest.mjs','run','--config','vitest.integration.config.ts'],{stdio:'inherit',env:{...process.env,LUMINA_QA_LOAD:'1'}});
process.exitCode=r.status??1;
