import {test,expect} from '@playwright/test';
import pg from 'pg';
test('first owner is created from accessible local UI once, then logs in and setup closes',async({page,browser})=>{
 const connection=new URL(process.env['DATABASE_URL']??'');if(connection.pathname!=='/lumina_initial_setup_e2e'||connection.hostname!=='127.0.0.1')throw new Error('Isolated local database required');
 const database=new pg.Client({connectionString:connection.href});await database.connect();
 const email='first-ui-owner@example.test';const password=process.env['QA_SETUP_PASSWORD']!;
 try {
  await page.goto('/login');await page.getByRole('link',{name:'Crear primera cuenta'}).click();await expect(page).toHaveURL(/configuracion-inicial/);
  await expect(page.getByRole('heading',{name:'Primera cuenta'})).toBeVisible();
  for(const width of [360,768,1280]){
   await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   await expect(page.getByRole('button',{name:'Crear mi cuenta',exact:true})).toBeVisible();
   await page.screenshot({path:`docs/qa-visual/initial-setup-${width}.png`,fullPage:true});
  }
  await page.getByRole('button',{name:'Crear mi cuenta',exact:true}).click();await expect(page.locator('input[name="name"]')).toBeFocused();
  for(const name of ['name','email','password','passwordConfirmation']){
   const input=page.locator(`input[name="${name}"]`);await expect(input).toHaveAttribute('aria-invalid','true');
   const ids=(await input.getAttribute('aria-describedby'))!.split(' ');for(const id of ids)await expect(page.locator(`[id="${id}"]`)).toBeVisible();
  }
  await expect(page.locator('input[name="password"]')).toHaveAttribute('minlength','12');await expect(page.locator('input[name="password"]')).toHaveAttribute('maxlength','128');
  await page.locator('input[name="name"]').fill('Dueña inicial UI sintética');await page.keyboard.press('Tab');await expect(page.locator('input[name="email"]')).toBeFocused();await page.keyboard.insertText(email);
  await page.keyboard.press('Tab');await expect(page.locator('input[name="password"]')).toBeFocused();await page.keyboard.insertText('short');
  await page.locator('input[name="passwordConfirmation"]').fill('short');await page.getByRole('button',{name:'Crear mi cuenta',exact:true}).click();await expect(page.locator('#setup-password-error')).toHaveText('Usa una contraseña de 12 a 128 caracteres.');
  await page.locator('input[name="password"]').fill(password);await page.locator('input[name="passwordConfirmation"]').fill(password+'different');await page.getByRole('button',{name:'Crear mi cuenta',exact:true}).click();await expect(page.locator('#setup-passwordConfirmation-error')).toHaveText('Las contraseñas deben coincidir.');
  expect(Number((await database.query('SELECT count(*) n FROM public."user"')).rows[0].n)).toBe(0);
  await page.locator('input[name="passwordConfirmation"]').fill(password);
  let release!:()=>void;const barrier=new Promise<void>(resolve=>{release=resolve;});
  await page.route('**/configuracion-inicial',async route=>{if(route.request().method()==='POST')await barrier;await route.continue();});
  await page.getByRole('button',{name:'Crear mi cuenta',exact:true}).click();await expect(page.getByRole('button',{name:'Creando cuenta…'})).toBeDisabled();await expect(page.locator('form')).toHaveAttribute('aria-busy','true');await expect(page.locator('input[name="email"]')).toBeDisabled();release();
  await expect(page).toHaveURL(/login\?cuenta=creada/);await expect(page.getByRole('status')).toContainText('Tu cuenta está lista');await expect(page.getByRole('link',{name:'Crear primera cuenta'})).toHaveCount(0);
  expect(Number((await database.query('SELECT count(*) n FROM public."user"')).rows[0].n)).toBe(1);
  await page.locator('input[name="email"]').fill(email);await page.locator('input[name="password"]').fill(password);await page.getByRole('button',{name:'Entrar',exact:true}).click();await expect(page).toHaveURL(/resumen/);await expect(page.getByRole('heading',{name:'Resumen',exact:true})).toBeVisible();
  const anonymous=await browser.newContext();const other=await anonymous.newPage();await other.goto('/configuracion-inicial');await expect(other).toHaveURL(/login/);await expect(other.getByRole('link',{name:'Crear primera cuenta'})).toHaveCount(0);
  await other.getByRole('link',{name:'Crear cuenta',exact:true}).click();await expect(other).toHaveURL(/registro/);
  await expect(other.getByRole('heading',{name:'Crear cuenta',exact:true})).toBeVisible();
  await expect(other.locator('input[name="activationCode"]')).toHaveCount(0);
  for(const width of [360,768,1280]){
   await other.setViewportSize({width,height:900});expect(await other.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   await other.screenshot({path:`docs/qa-visual/registro-${width}.png`,fullPage:true});
  }
  await other.locator('input[name="name"]').fill('Segunda dueña UI sintética');await other.locator('input[name="email"]').fill('second-ui-owner@example.test');
  await other.locator('input[name="password"]').fill(password);await other.locator('input[name="passwordConfirmation"]').fill(password);
  await other.getByRole('button',{name:'Crear mi cuenta',exact:true}).click();await expect(other).toHaveURL(/login\?cuenta=creada/);
  await other.locator('input[name="email"]').fill('second-ui-owner@example.test');await other.locator('input[name="password"]').fill(password);
  await other.getByRole('button',{name:'Entrar',exact:true}).click();await expect(other).toHaveURL(/resumen/);await expect(other.getByRole('heading',{name:'Resumen',exact:true})).toBeVisible();
  expect(Number((await database.query('SELECT count(*) n FROM public."user" WHERE "activeAccess"=true')).rows[0].n)).toBe(2);
  await anonymous.close();
 }finally{await database.end();}
});
