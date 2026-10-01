import {defineConfig,devices} from '@playwright/test';
import {config} from 'dotenv';
config({path:'.runtime/initial-setup-e2e.env',override:true,quiet:true});
const database=new URL(process.env['DATABASE_URL']??'');
if(database.pathname!=='/lumina_initial_setup_e2e'||database.hostname!=='127.0.0.1')throw new Error('Initial setup browser QA requires its isolated local database');
export default defineConfig({testDir:'./tests/initial-setup-e2e',fullyParallel:false,workers:1,retries:0,timeout:60000,outputDir:'.runtime/initial-setup-results',use:{baseURL:'http://localhost:3002',trace:'off'},projects:[{name:'chromium',use:{...devices['Desktop Chrome']}}],webServer:{command:'node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3002',url:'http://localhost:3002/login',reuseExistingServer:false,timeout:120000}});
