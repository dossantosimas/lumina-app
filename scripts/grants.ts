import pg from 'pg';
const url=process.env['DIRECT_URL'];if(!url)throw new Error('Falta DIRECT_URL de migración');
const runtimeRole=process.env['APP_DB_ROLE'];const operatorRole=process.env['OPERATOR_DB_ROLE'];
if(!runtimeRole||!operatorRole||![runtimeRole,operatorRole].every(r=>/^[a-z_][a-z0-9_]{0,62}$/.test(r)))throw new Error('Roles de base inválidos');
const client=new pg.Client({connectionString:url});
try {
 await client.connect();await client.query('BEGIN');await client.query("SET LOCAL lock_timeout='5s'; SET LOCAL statement_timeout='30s'");
 for(const role of [runtimeRole,operatorRole])await client.query(`REVOKE ALL ON ALL TABLES IN SCHEMA public FROM "${role}"`);
 await client.query(`GRANT USAGE ON SCHEMA public TO "${runtimeRole}","${operatorRole}"`);
 await client.query(`GRANT EXECUTE ON FUNCTION public.lock_active_owner(text) TO "${runtimeRole}"`);
 await client.query(`GRANT EXECUTE ON FUNCTION public.initial_owner_available(),public.reserve_initial_owner_attempt(),public.create_initial_owner(text,text,text,text) TO "${runtimeRole}"`);
 await client.query(`GRANT EXECUTE ON FUNCTION public.reserve_public_registration_attempt(),public.register_owner_account(text,text,text,text) TO "${runtimeRole}"`);
 await client.query(`GRANT SELECT,INSERT,UPDATE ON products,customers,sales_orders,expenses TO "${runtimeRole}"`);
 await client.query(`GRANT SELECT,INSERT,UPDATE,DELETE ON sales_order_lines TO "${runtimeRole}"`);
 await client.query(`GRANT SELECT,INSERT ON audit_events TO "${runtimeRole}"`);
 await client.query(`GRANT SELECT,INSERT,UPDATE ON idempotency_records TO "${runtimeRole}"`);
 await client.query(`GRANT SELECT ON "user","account" TO "${runtimeRole}"`);
 await client.query(`GRANT SELECT,INSERT,UPDATE,DELETE ON "session","verification","rateLimit" TO "${runtimeRole}"`);
 await client.query(`GRANT SELECT,INSERT,UPDATE,DELETE ON "user","account","session","verification","rateLimit" TO "${operatorRole}"`);
 await client.query('COMMIT');console.log('Permisos aplicados: runtime restringido y operador de cuentas separado.');
} catch {await client.query('ROLLBACK').catch(()=>{});throw new Error('No fue posible aplicar los permisos de base');} finally{await client.end();}
