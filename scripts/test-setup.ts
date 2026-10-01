import {config} from 'dotenv';
config({path:'.runtime/test.env',override:true,quiet:true});
const testUrl=new URL(process.env['DATABASE_URL']??'');
if(testUrl.pathname!=='/lumina_test'||!['127.0.0.1','localhost'].includes(testUrl.hostname))throw new Error('QA requires the isolated local lumina_test database');
