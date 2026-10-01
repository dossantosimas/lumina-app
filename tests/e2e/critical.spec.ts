import {test,expect,type Page,type BrowserContext} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {parse} from 'dotenv';
import {Client} from 'pg';
function accounts():{email:string;password:string;id:string;cookies:Parameters<BrowserContext['addCookies']>[0]}[]{return JSON.parse(readFileSync('.runtime/qa-account.json','utf8'));}
async function login(page:Page,index=0){const account=accounts()[index]!;await page.context().addCookies(account.cookies);await page.goto('/resumen');await expect(page).toHaveURL(/resumen/);}
async function expenseCount(concept:string){const url=new URL(parse(readFileSync('.runtime/test.env'))['DATABASE_URL']??'');if(url.pathname!=='/lumina_test'||url.hostname!=='127.0.0.1')throw new Error('Isolated QA database required');const db=new Client({connectionString:url.href});await db.connect();try{return Number((await db.query('SELECT count(*) n FROM expenses WHERE concept=$1',[concept])).rows[0].n);}finally{await db.end();}}
async function clientCount(name:string){const url=new URL(parse(readFileSync('.runtime/test.env'))['DATABASE_URL']??'');if(url.pathname!=='/lumina_test'||url.hostname!=='127.0.0.1')throw new Error('Isolated QA database required');const db=new Client({connectionString:url.href});await db.connect();try{return Number((await db.query('SELECT count(*) n FROM customers WHERE name=$1',[name])).rows[0].n);}finally{await db.end();}}
test('anonymous visitor receives no private page and auth public mutations are closed AC-013',async({page,request})=>{
 await page.goto('/pedidos');await expect(page).toHaveURL(/login/);
 for(const path of ['sign-up/email','update-user','change-password','request-password-reset','delete-user']){
  const response=await request.post(`/api/auth/${path}`,{data:{name:'Synthetic',activeAccess:true,email:'blocked@example.test',password:'BlockedSyntheticOnly123'}});
  expect(response.status()).toBeGreaterThanOrEqual(400);
 }
});
test('HTTP pages carry frame, content type and referrer safeguards',async({request})=>{
 const cookie=accounts()[0]!.cookies.map(c=>`${c.name}=${c.value}`).join('; ');
 for(const path of ['/login','/resumen']){
  const response=await request.get(path,{headers:{cookie}});expect(response.status()).toBe(200);const headers=response.headers();expect(headers['x-frame-options']).toBe('DENY');expect(headers['x-content-type-options']).toBe('nosniff');expect(headers['referrer-policy']).toBe('same-origin');expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
 }
});
test('two owners have shared persistent clients and keyboard usable forms AC-004/005/006 NFR-006',async({page,browser})=>{
 const name=`Cliente QA ${Date.now()}`;await login(page);await page.goto('/clientes');
 await page.getByRole('link',{name:/Nuevo cliente/}).click();await page.getByLabel('Nombre',{exact:false}).focus();await page.keyboard.insertText(name);
 await page.keyboard.press('Tab');await expect(page.getByLabel('Contacto',{exact:false})).toBeFocused();await page.keyboard.press('Tab');await expect(page.getByLabel('Notas',{exact:false})).toBeFocused();await page.keyboard.press('Tab');await expect(page.getByRole('button',{name:'Guardar cliente',exact:true})).toBeFocused();await page.keyboard.press('Enter');await expect(page.getByText(name,{exact:true}).first()).toBeVisible();
 const context=await browser.newContext();const other=await context.newPage();await login(other,1);await other.goto('/clientes');await expect(other.getByText(name,{exact:true}).first()).toBeVisible();await context.close();
});
test('multiline candle order survives archive/restore and customer archival AC-001/007/008/014/015',async({page})=>{
 await login(page);const name=`Pedido QA ${Date.now()}`;
 await page.goto('/clientes/nuevo');await page.getByLabel('Nombre',{exact:false}).fill(name);await page.getByRole('button',{name:'Guardar cliente',exact:true}).click();
 await expect(page.locator('h1')).toHaveText(name);const customerUrl=page.url();
 await page.goto('/pedidos/nuevo');const chooser=page.getByRole('combobox',{name:'Cliente (obligatorio)',exact:true});await chooser.fill(name);await expect(page.getByRole('option',{name,exact:true})).toBeVisible();await chooser.press('ArrowDown');await chooser.press('Enter');await expect(chooser).toHaveValue(name);
 await page.getByLabel('Descripción de la vela').fill('Vainilla mediana QA');await page.getByLabel('Cantidad',{exact:true}).fill('2');await page.getByLabel(/^Precio unitario \(COP\)/).fill('25000');
 await page.getByRole('button',{name:/Añadir vela/}).click();await page.getByLabel('Descripción de la vela').nth(1).fill('Lavanda QA');await page.getByLabel('Cantidad',{exact:true}).nth(1).fill('1');await page.getByLabel(/^Precio unitario \(COP\)/).nth(1).fill('35000');
 await expect(page.locator('.savebar-total')).toContainText('85.000');await page.getByRole('button',{name:'Guardar pedido',exact:true}).click();await expect(page.locator('h1')).toHaveText(name);await expect(page.locator('.order-total')).toContainText('85.000');const orderUrl=page.url();
 await page.goto(customerUrl);await page.getByRole('button',{name:'Archivar',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Archivar',exact:true}).click();await expect(page.getByText('REGISTRO ARCHIVADO',{exact:true})).toBeVisible();
 await page.goto(orderUrl);await expect(page.getByText('Cliente archivado',{exact:true})).toBeVisible();await expect(page.locator('.order-total')).toContainText('85.000');
 await page.getByRole('button',{name:'Archivar',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Archivar',exact:true}).click();await expect(page.getByText('REGISTRO ARCHIVADO',{exact:true})).toBeVisible();await expect(page.getByRole('link',{name:'Editar',exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Restaurar',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Restaurar',exact:true}).click();await expect(page.getByText('Registro restaurado',{exact:true})).toBeVisible();await expect(page.getByText('Cliente archivado',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Consultar historial',exact:true}).click();await expect(page.locator('.history-list')).toContainText('Restaurado');
});
test('whole invoice expense cancels archival without changing its amount AC-003/012',async({page})=>{
 await login(page);await page.goto('/gastos/nuevo');await page.getByLabel('Concepto',{exact:false}).fill(`Factura QA ${Date.now()}`);await page.getByLabel('Total (COP)',{exact:false}).fill('120000');await page.getByRole('button',{name:'Guardar gasto',exact:true}).click();await expect(page.locator('.detail-amount')).toContainText('120.000');
 await page.getByRole('button',{name:'Archivar',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Cancelar',exact:true}).click();await expect(page.getByText('REGISTRO ARCHIVADO',{exact:true})).toHaveCount(0);await expect(page.locator('.detail-amount')).toContainText('120.000');
});
test('connection failure preserves draft and never displays successful save NFR-004',async({page,context})=>{
 await login(page);await page.goto('/gastos/nuevo');const concept=`Borrador QA ${Date.now()}`;await page.getByLabel('Concepto',{exact:false}).fill(concept);await page.getByLabel('Total (COP)',{exact:false}).fill('100');
 await context.setOffline(true);await expect(page.getByRole('button',{name:'Guardar gasto',exact:true})).toBeDisabled();await expect(page.getByLabel('Concepto',{exact:false})).toHaveValue(concept);await expect(page.getByText('Registro guardado.',{exact:true})).toHaveCount(0);await context.setOffline(false);
});
test('lost response after committed save retries same operation without duplicate NFR-004',async({page})=>{
 await login(page);await page.goto('/gastos/nuevo');const concept=`Respuesta perdida QA ${Date.now()}`;await page.getByLabel('Concepto',{exact:false}).fill(concept);await page.getByLabel('Total (COP)',{exact:false}).fill('250,50');let aborted=false;
 await page.route('**/gastos/nuevo',async route=>{if(route.request().method()==='POST'&&route.request().headers()['next-action']&&!aborted){aborted=true;await route.fetch();await route.abort('failed');}else await route.continue();});
 await page.getByRole('button',{name:'Guardar gasto',exact:true}).click();await expect(page.getByRole('button',{name:'Comprobar guardado y reintentar',exact:true})).toBeVisible();expect(await expenseCount(concept)).toBe(1);await expect(page.getByLabel('Concepto',{exact:false})).toHaveValue(concept);
 await page.getByRole('button',{name:'Comprobar guardado y reintentar',exact:true}).click();await expect(page.locator('h1')).toHaveText(concept);expect(await expenseCount(concept)).toBe(1);
});
test('concurrent editing preserves rejected draft and exposes comparison NFR-003',async({page,browser})=>{
 await login(page);await page.goto('/gastos/nuevo');const concept=`Conflicto QA ${Date.now()}`;await page.getByLabel('Concepto',{exact:false}).fill(concept);await page.getByLabel('Total (COP)',{exact:false}).fill('100');await page.getByRole('button',{name:'Guardar gasto',exact:true}).click();await expect(page.locator('h1')).toHaveText(concept);const detail=page.url().split('?')[0]!;
 const context=await browser.newContext();const other=await context.newPage();await login(other,1);await page.goto(detail+'/editar');await other.goto(detail+'/editar');await page.getByLabel('Concepto',{exact:false}).fill(concept+' ganador');await other.getByLabel('Concepto',{exact:false}).fill(concept+' borrador');await page.getByRole('button',{name:'Guardar gasto',exact:true}).click();await expect(page.locator('h1')).toHaveText(concept+' ganador');await other.getByRole('button',{name:'Guardar gasto',exact:true}).click();await expect(other.getByText('Este registro cambió mientras lo editabas.',{exact:false})).toBeVisible();await expect(other.getByLabel('Concepto',{exact:false})).toHaveValue(concept+' borrador');
 await other.getByRole('button',{name:'Comparar cambios',exact:true}).click();await expect(other.getByRole('dialog')).toContainText(concept+' borrador');await expect(other.getByRole('dialog')).toContainText(concept+' ganador');await other.keyboard.press('Escape');await expect(other.getByRole('dialog')).toHaveCount(0);await expect(other.getByRole('button',{name:'Comparar cambios',exact:true})).toBeFocused();await context.close();
});
test('duplicate names remain deliberate and rapid submits create one additional client',async({page})=>{
 await login(page);const name=`Duplicado QA ${Date.now()}`;await page.goto('/clientes/nuevo');await page.getByLabel('Nombre',{exact:false}).fill(name);await page.getByRole('button',{name:'Guardar cliente',exact:true}).click();await expect(page.locator('h1')).toHaveText(name);expect(await clientCount(name)).toBe(1);
 await page.goto('/clientes/nuevo');await page.getByLabel('Nombre',{exact:false}).fill(name);await page.getByRole('button',{name:'Guardar cliente',exact:true}).click();await expect(page.getByText('Revisa las posibles coincidencias.',{exact:false})).toBeVisible();expect(await clientCount(name)).toBe(1);
 await page.locator('form.editor').evaluate((form:HTMLFormElement)=>{form.requestSubmit();form.requestSubmit();});await expect(page.locator('h1')).toHaveText(name);expect(await clientCount(name)).toBe(2);
});
test('return from client detail preserves search and archive filter',async({page})=>{
 await login(page);const name=`Filtro QA ${Date.now()}`;await page.goto('/clientes/nuevo');await page.getByLabel('Nombre',{exact:false}).fill(name);await page.getByRole('button',{name:'Guardar cliente',exact:true}).click();await expect(page.locator('h1')).toHaveText(name);
 await page.goto('/clientes');await page.getByLabel('Buscar',{exact:true}).fill(name);await page.getByRole('combobox',{name:'Mostrar',exact:true}).selectOption('all');await page.getByRole('button',{name:'Buscar',exact:true}).click();await expect(page.locator('.resource-table tbody tr')).toHaveCount(1);await page.locator('.resource-table .record-primary a').click();await page.getByRole('link',{name:/Volver a clientes/}).click();await expect(page.getByLabel('Buscar',{exact:true})).toHaveValue(name);await expect(page.getByRole('combobox',{name:'Mostrar',exact:true})).toHaveValue('all');
});
test('login form accepts an authorized synthetic owner',async({page})=>{
 const account=accounts()[0]!;await page.goto('/login');await page.getByLabel('Correo',{exact:true}).fill(account.email);await page.getByLabel('Contraseña',{exact:true}).fill(account.password);await page.getByRole('button',{name:'Entrar',exact:true}).click();await expect(page).toHaveURL(/resumen/);
});
for(const width of [360,768,1280])test(`main pages fit ${width}px without horizontal overflow NFR-001`,async({page})=>{
 await page.setViewportSize({width,height:900});await login(page);
 for(const path of ['/resumen','/pedidos','/clientes','/gastos']){
  await page.goto(path);await expect(page.locator('h1')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
});
