// Explicit disposable URL only; never loads the application .env.
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error('Set TEST_DATABASE_URL to a new disposable PostgreSQL database');
const target = new URL(url);
if (!['localhost', '127.0.0.1'].includes(target.hostname) || !target.pathname.startsWith('/shaikhs_disposable_')) throw new Error('Refusing a non-disposable/non-local database');
const env = { ...process.env, DATABASE_URL: url };
function run(args) {
  const result = spawnSync(process.execPath, ['node_modules/prisma/build/index.js', ...args], { env, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`Prisma ${args[0]} failed (connection details suppressed)`);
}
const db = new PrismaClient({ datasourceUrl: url });
async function main() {
  // Refuse to touch a reused database: this script models an upgrade from the old schema.
  const tables = await db.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`;
  assert.equal(tables.length, 0, 'Use a NEW empty disposable database');
  run(['db', 'execute', '--file', 'prisma/migrations/202611050001_initial/migration.sql', '--schema', 'prisma/schema.prisma']);
  run(['migrate', 'resolve', '--applied', '202611050001_initial']);
  await db.$executeRaw`INSERT INTO "User" (id,name,email,"passwordHash",role) VALUES ('legacy-customer','Legacy','legacy@example.test','not-a-password','CUSTOMER'),('legacy-owner','Owner','owner@example.test','not-a-password','RESTAURANT')`;
  await db.$executeRaw`INSERT INTO "Restaurant" (id,"ownerId",name,address) VALUES ('legacy-restaurant','legacy-owner','Legacy Kitchen','Test Road')`;
  await db.$executeRaw`INSERT INTO "Order" (id,"orderNumber","customerId","restaurantId",subtotal,"deliveryFee",tax,total,"deliveryAddress","updatedAt") VALUES ('legacy-order','LEGACY-1','legacy-customer','legacy-restaurant',100,35,5,140,'Test address',CURRENT_TIMESTAMP),('legacy-order-2','LEGACY-2','legacy-customer','legacy-restaurant',100,35,5,140,'Test address',CURRENT_TIMESTAMP)`;
  await db.$executeRaw`INSERT INTO "Product" (id,"restaurantId",name,category,price) VALUES ('legacy-product','legacy-restaurant','Legacy dish','Legacy',100)`;
  const before = await db.$queryRaw`SELECT * FROM "Order" ORDER BY id`;
  run(['migrate', 'deploy']);
  const after = await db.order.findMany({ orderBy: { id: 'asc' }, include: { statusHistory: true } });
  assert.equal(after.length, before.length);
  for (let i = 0; i < before.length; i++) {
    for (const [key, value] of Object.entries(before[i])) assert.deepEqual(after[i][key], value, `Legacy field preserved: ${key}`);
    assert.equal(after[i].idempotencyKey, null);
    assert.equal(after[i].requestHash, null);
    assert.deepEqual(after[i].statusHistory, []);
    assert.equal(after[i].operationsVersion, 0);
    assert.equal(after[i].preparationMinutes, null);
    assert.equal(after[i].riderAcceptedAt, null);
    assert.equal(after[i].deliveryIssue, null);
    assert.equal(after[i].deliveryPostalCode, null);
    assert.equal(after[i].savedAddressId, null);
    assert.equal(after[i].deliveryAddressSnapshot, null);
  }
  await db.order.update({ where: { id: 'legacy-order' }, data: { idempotencyKey: 'duplicate-test' } });
  await assert.rejects(db.order.update({ where: { id: 'legacy-order-2' }, data: { idempotencyKey: 'duplicate-test' } }), e => e.code === 'P2002');
  await assert.rejects(db.orderStatusEvent.create({ data: { orderId: 'missing-order', actorId: 'legacy-owner', status: 'PLACED' } }), e => e.code === 'P2003');
  await db.orderStatusEvent.create({ data: { orderId: 'legacy-order', actorId: 'legacy-customer', status: 'PLACED' } });
  const indexes = await db.$queryRaw`SELECT indexname FROM pg_indexes WHERE schemaname = 'public'`;
  assert.ok(indexes.some(i => i.indexname === 'OrderOperationEvent_orderId_createdAt_idx'));
  assert.ok(indexes.some(i => i.indexname === 'CustomerAddress_one_active_default'));
  assert.ok(indexes.some(i => i.indexname === 'DeliveryZone_active_priority_key'));
  await assert.rejects(db.order.update({where:{id:'legacy-order'},data:{deliveryPostalCode:'000000'}}),/Order_deliveryPostalCode_check/);
  await assert.rejects(db.order.update({ where: { id:'legacy-order' }, data:{ preparationMinutes:0 } }), /Order_preparationMinutes_check/);
  await assert.rejects(db.order.update({ where: { id:'legacy-order' }, data:{ pickupCode:'invalid' } }), /Order_verificationCodes_check/);
  await assert.rejects(db.order.update({ where: { id:'legacy-order' }, data:{ deliveryIssue:'invented' } }), /Order_deliveryIssue_check/);
  for (const name of ['Order_customerId_idempotencyKey_key', 'OrderStatusEvent_orderId_createdAt_idx', 'CodSettlement_orderId_key', 'CodSettlement_reference_key']) assert.ok(indexes.some(i => i.indexname === name));
  await assert.rejects(db.$executeRaw`INSERT INTO "CodSettlement" (id,"orderId",amount,"receivedById",reference) VALUES ('invalid-receipt','legacy-order',-1,'test-admin','invalid-reference')`);
  await assert.rejects(db.$executeRaw`INSERT INTO "OnlinePayment" (id,"orderId","amountPaise","updatedAt") VALUES ('invalid-payment','legacy-order',0,CURRENT_TIMESTAMP)`);
  await db.paymentEvent.create({ data: { eventId: 'migration-event', bodyHash: 'migration-hash', kind: 'fixture', outcome: 'IGNORED' } });
  await assert.rejects(db.paymentEvent.create({ data: { eventId: 'migration-event', bodyHash: 'new-hash', kind: 'fixture', outcome: 'IGNORED' } }), e => e.code === 'P2002');
  await assert.rejects(db.paymentEvent.create({ data: { eventId: 'new-event', bodyHash: 'migration-hash', kind: 'fixture', outcome: 'IGNORED' } }), e => e.code === 'P2002');
  assert.equal((await db.user.findUniqueOrThrow({where:{id:'legacy-customer'}})).authVersion,0);
  for(const name of ['PasswordResetToken_tokenHash_key','Notification_userId_eventKey_key','EmailOutbox_state_nextAttemptAt_idx'])assert.ok(indexes.some(i=>i.indexname===name));
  await assert.rejects(db.user.update({where:{id:'legacy-customer'},data:{authVersion:-1}}));
  const notification={userId:'legacy-customer',eventKey:'migration-security',kind:'SECURITY',title:'Fixture',body:'Synthetic'};await db.notification.create({data:notification});await assert.rejects(db.notification.create({data:notification}),e=>e.code==='P2002');
  assert.equal(await db.orderCommission.count(),0);assert.equal((await db.commissionRule.findUniqueOrThrow({where:{id:'platform-commission-zero-v1'}})).rateBps,0);
  for(const name of ['OrderCommission_orderId_key','RestaurantSettlement_reference_key','RestaurantSettlement_reversalOfId_key','CommissionAdjustment_eventKey_key','RestaurantSettlementLine_snapshotId_idx'])assert.ok(indexes.some(i=>i.indexname===name));
  await assert.rejects(db.commissionRule.update({where:{id:'platform-commission-zero-v1'},data:{rateBps:500}}),/append-only/);
  assert.equal((await db.restaurant.findUniqueOrThrow({where:{id:'legacy-restaurant'}})).lifecycle,'ACTIVE');assert.equal((await db.user.findUniqueOrThrow({where:{id:'legacy-customer'}})).adminVersion,0);assert.equal(await db.restaurantApplication.count(),0);assert.equal(await db.adminAction.count(),0);await assert.rejects(db.restaurant.update({where:{id:'legacy-restaurant'},data:{lifecycle:'INVALID'}}));
  const stock=await db.product.findUniqueOrThrow({where:{id:'legacy-product'}});assert.equal(stock.stockTracked,false);assert.equal(stock.stockQuantity,0);assert.equal(await db.stockReservation.count(),0);assert.equal(await db.stockMovement.count(),0);await assert.rejects(db.product.update({where:{id:'legacy-product'},data:{stockQuantity:-1}}));
  assert.equal(await db.reviewCase.count(),0);assert.equal(await db.reviewCaseEvent.count(),0);await assert.rejects(db.reviewCase.create({data:{sourceKey:'invalid-case',requestHash:'fixture',orderId:'legacy-order',kind:'INVALID',summary:'Invalid fixture'}}));const review=await db.reviewCase.create({data:{sourceKey:'legacy-review-fixture',requestHash:'fixture',orderId:'legacy-order',kind:'CUSTOMER_COMPLAINT',summary:'Synthetic legacy order review'}});assert.equal(review.status,'OPEN');await assert.rejects(db.reviewCase.create({data:{sourceKey:'legacy-review-fixture',requestHash:'fixture',orderId:'legacy-order',kind:'CUSTOMER_COMPLAINT',summary:'Duplicate fixture'}}));const event=await db.reviewCaseEvent.create({data:{caseId:review.id,eventKey:'legacy-case-event',requestHash:'fixture',actorId:'legacy-customer',action:'REPORTED',before:{},after:{},note:'Synthetic event',evidence:[]}});await assert.rejects(db.reviewCaseEvent.update({where:{id:event.id},data:{note:'tamper'}}),/append-only/);
  const emailUser=await db.user.findUniqueOrThrow({where:{id:'legacy-customer'}});assert.equal(emailUser.emailVerificationRequired,false);assert.equal(emailUser.emailVerifiedAt,null);assert.equal(await db.emailVerificationToken.count(),0);assert.equal(await db.accountSecurityEvent.count(),0);await assert.rejects(db.emailVerificationToken.create({data:{userId:emailUser.id,tokenHash:'a'.repeat(64),purpose:'INVALID',email:emailUser.email,originalEmail:emailUser.email,authVersion:0,expiresAt:new Date(Date.now()+60000)}}));const security=await db.accountSecurityEvent.create({data:{userId:emailUser.id,eventKey:'legacy-security-fixture',action:'FIXTURE',emailHash:'a'.repeat(64)}});await assert.rejects(db.accountSecurityEvent.update({where:{id:security.id},data:{action:'tamper'}}),/append-only/);
  assert.equal(await db.promotion.count(),0);assert.equal(await db.promotionRedemption.count(),0);assert.equal(await db.purchaseReview.count(),0);assert.equal(await db.commerceAudit.count(),0);const priced=await db.order.findUniqueOrThrow({where:{id:'legacy-order'}});assert.equal(priced.discount.toFixed(2),'0.00');assert.equal(priced.promotionSnapshot,null);await assert.rejects(db.order.update({where:{id:'legacy-order'},data:{discount:-1}}));
  run(['migrate', 'status']);
  console.log('PASS: legacy preservation, NULL keys, unique keys, event FK, indexes, positive money constraints, durable webhook ID/hash uniqueness, migration status');
}
main().catch(e => { console.error(e.message); process.exitCode = 1; }).finally(() => db.$disconnect());
