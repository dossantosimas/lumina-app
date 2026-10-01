import {defineConfig,devices} from '@playwright/test';
import {config} from 'dotenv';
config({path:'.runtime/test.env',override:true,quiet:true});
const url=new URL(process.env['DATABASE_URL']??'');
if(url.pathname!=='/lumina_test'||!['localhost','127.0.0.1'].includes(url.hostname))throw new Error('Browser QA requires isolated local lumina_test');
export default defineConfig({testDir:'./tests/e2e',globalSetup:'./tests/support/e2e-setup.ts',fullyParallel:false,workers:1,retries:0,timeout:45000,use:{baseURL:'http://localhost:3001',trace:'retain-on-failure'},projects:[{name:'chromium',use:{...devices['Desktop Chrome']}}],webServer:{command:`node node_modules/next/dist/bin/next ${process.env['QA_E2E_BUILT']==='1'?'start':'dev'} --hostname 127.0.0.1 --port 3001`,url:'http://localhost:3001/login',reuseExistingServer:!process.env['CI'],timeout:120000}});
