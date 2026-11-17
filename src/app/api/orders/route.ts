import {redeemPromotion} from '@/lib/promotions';
import {json} from '@/lib/commerce';
import {reserveStock} from '@/lib/inventory';
import {snapshotCommission} from '@/lib/commissions';
import { notifyOrder } from '@/lib/notifications';
import { NextResponse } from "next/server";
import { checkoutInputSchema as schema } from "@/lib/checkout-input";
import { quoteDelivery } from "@/lib/delivery-quote";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { checkoutHash, orderNumber } from "@/lib/checkout";
import { onlineCheckoutEnabled } from "@/lib/checkout-gate";
import { visibleOrder } from "@/lib/operations";
import { restaurantAccess } from "@/lib/restaurant-access";
import { HttpError,jsonBody } from "@/lib/http-body";
export async function GET(){
 const user=await currentUser();if(!user)return NextResponse.json({error:"Sign in required"},{status:401});
 const access=user.role==="RESTAURANT"?await restaurantAccess(user,"HISTORY"):null;
 if(user.role==="RESTAURANT"&&!access)return NextResponse.json({error:"Order access required"},{status:403});
 const where=user.role==="CUSTOMER"?{customerId:user.id}:user.role==="RESTAURANT"?{restaurantId:access!.restaurant.id}:user.role==="DELIVERY"?{deliveryPartnerId:user.id}:{};
 const orders=await prisma.order.findMany({where,include:{items:true,statusHistory:{select:{status:true,createdAt:true,note:true},orderBy:{createdAt:"asc"}},operationHistory:{select:{action:true,reason:true,createdAt:true},orderBy:{createdAt:"desc"},take:20},restaurant:{select:{name:true,address:true}},customer:{select:{name:true,phone:true}},deliveryPartner:{select:{name:true}}},orderBy:{createdAt:"desc"},take:100});
 return NextResponse.json({orders:orders.map(o=>visibleOrder(o,user.role))},{headers:{"Cache-Control":"no-store"}});
}
export async function POST(req: Request) {
 const user = await currentUser();
 if (!user || user.role !== "CUSTOMER") return NextResponse.json({ error: "Customer sign-in required" }, { status: 401 });
 let body:unknown;try{body=await jsonBody(req,65536);}catch(error){return NextResponse.json({error:"Invalid or oversized checkout"},{status:error instanceof HttpError?error.code:400});}
 const parsed = schema.safeParse(body);
 if (!parsed.success) return NextResponse.json({ error: "Invalid order details", details: parsed.error.flatten() }, { status: 400 });
 const input = parsed.data;
 const quoteHeader=req.headers.get("X-Delivery-Policy-Version");
 if(quoteHeader!==null&&!/^\d{1,9}$/.test(quoteHeader))return NextResponse.json({error:"Invalid delivery quote version"},{status:400});
 const quoteVersion=input.policyVersion??(quoteHeader===null?undefined:Number(quoteHeader));
 const key = req.headers.get("Idempotency-Key");
 if (!key || !/^[A-Za-z0-9_-]{8,128}$/.test(key)) return NextResponse.json({ error: "A valid Idempotency-Key header is required" }, { status: 400 });
 const requestHash = checkoutHash(input);
 const legacyHash=checkoutHash({...input,savedAddressId:undefined,addressVersion:undefined,postalCode:undefined});
 const deliveryQuoteHeader=req.headers.get("X-Delivery-Quote");
 if(deliveryQuoteHeader!==null&&!/^[a-f0-9]{64}$/.test(deliveryQuoteHeader))return NextResponse.json({error:"Invalid delivery quote"},{status:400});
 const replay = async () => {
  const existing = await prisma.order.findUnique({ where: { customerId_idempotencyKey: { customerId: user.id, idempotencyKey: key } }, include: { items: true } });
  if (!existing) return null;
  return existing.requestHash === requestHash || (!input.savedAddressId && input.postalCode && !existing.deliveryPostalCode && existing.requestHash===legacyHash) || (!input.savedAddressId&&!input.postalCode&&existing.legacyRequestHash===requestHash)
   ? NextResponse.json({ order: visibleOrder(existing,user.role) }, { status: 200 })
   : NextResponse.json({ error: "This checkout key was already used for different order details" }, { status: 409 });
 };
 try {
  const previous = await replay();
  if (previous) return previous;
  if (input.paymentMethod === "ONLINE" && !onlineCheckoutEnabled()) return NextResponse.json({ error: "Online payment is currently unavailable. Choose cash on delivery, or check existing orders before retrying." }, { status: 422 });
  // Serializable isolates availability reads from concurrent menu/restaurant edits.
  const order = await prisma.$transaction(async tx => {
   const customer=await tx.user.findUnique({where:{id:user.id},select:{role:true,active:true,authVersion:true,emailVerificationRequired:true,emailVerifiedAt:true}});if(!customer?.active||customer.role!=='CUSTOMER'||user.authVersion!==undefined&&customer.authVersion!==user.authVersion)throw new HttpError(409,'Account access changed. Sign in again before checkout.');
   if(customer.emailVerificationRequired&&!customer.emailVerifiedAt)throw new HttpError(403,'Verify your email before placing a new order. Existing orders remain available.');
   const quoted=await quoteDelivery(tx,input,user.id,quoteVersion);
   const {restaurant,lines,totals,policy}=quoted;
   if(deliveryQuoteHeader&&deliveryQuoteHeader!==quoted.quoteToken)throw new HttpError(409,'Delivery details or prices changed. Review the refreshed quote before ordering.');
   const created=await tx.order.create({ data: {
    orderNumber: orderNumber(), customerId: user.id, restaurantId: restaurant.id,
    idempotencyKey: key, requestHash,legacyRequestHash:legacyHash, ...totals,...(quoted.promotion?{discount:quoted.promotion.amount,promotionSnapshot:json(quoted.promotion.snapshot)}:{}),riderPayout:quoted.riderPayout,payoutPolicyVersion:policy.version,
    deliveryAddress: quoted.address,savedAddressId:quoted.savedAddressId,deliveryPostalCode:quoted.postalCode,deliveryAddressSnapshot:quoted.snapshot,deliveryZoneId:quoted.zone.id,deliveryZoneVersion:quoted.zone.version, notes: input.notes, paymentMethod: input.paymentMethod,
    items: { create: lines.map(({ product, quantity,price,nameSnapshot,optionsSnapshot }) => ({ productId: product.id, nameSnapshot, unitPrice: price, quantity, lineTotal: price.times(quantity),...(optionsSnapshot.length?{optionsSnapshot}:{}) })) },
    statusHistory: { create: { status: "PLACED", actorId: user.id } },
   }, include: { items: true } });
   await reserveStock(tx,lines,created.id,restaurant.id,user.id);
   if(quoted.promotion)await redeemPromotion(tx,quoted.promotion,created.id,user.id);
   await snapshotCommission(tx,created);
   await notifyOrder(tx,created,"PLACED",0);
   return created;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  return NextResponse.json({ order: visibleOrder(order,user.role) }, { status: 201 });
 } catch (error) {
  if(error instanceof HttpError)return NextResponse.json({error:error.message},{status:error.code});
  // A concurrent request with the same key may have won the unique constraint.
  if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2002", "P2034"].includes(error.code)) {
   const previous = await replay();
   if (previous) return previous;
   return NextResponse.json({ error: "Checkout changed concurrently. Retry with the same checkout key." }, { status: 409 });
  }
  if (error instanceof Error && ["RESTAURANT_UNAVAILABLE", "ITEM_UNAVAILABLE"].includes(error.message)) {
   return NextResponse.json({ error: error.message === "RESTAURANT_UNAVAILABLE" ? "Restaurant is unavailable" : "One or more items are unavailable" }, { status: 409 });
  }
  console.error("checkout_failed", { error: error instanceof Error ? error.name : "UnknownError" });
  return NextResponse.json({ error: "Unable to place order. Retry with the same checkout key." }, { status: 503 });
 }
}
