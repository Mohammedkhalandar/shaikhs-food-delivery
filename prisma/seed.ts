import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma=new PrismaClient();
async function main(){
 if(process.env.NODE_ENV === "production") throw new Error("Demo seed is disabled in production. Create real accounts through the registration flow and provision the first admin securely.");
 const seedPassword=process.env.SEED_DEMO_PASSWORD;
 if(!seedPassword || seedPassword.length<16) throw new Error("Set a unique local SEED_DEMO_PASSWORD of at least 16 characters; never commit or log it.");
 const passwordHash=await bcrypt.hash(seedPassword,12);
 const admin=await prisma.user.upsert({where:{email:"admin@shaikhs.demo"},update:{},create:{name:"Shaikh Admin",email:"admin@shaikhs.demo",passwordHash,role:Role.ADMIN}});
 const owner=await prisma.user.upsert({where:{email:"restaurant@shaikhs.demo"},update:{},create:{name:"Kitchen Owner",email:"restaurant@shaikhs.demo",passwordHash,role:Role.RESTAURANT}});
 const customer=await prisma.user.upsert({where:{email:"customer@shaikhs.demo"},update:{},create:{name:"Demo Customer",email:"customer@shaikhs.demo",passwordHash,role:Role.CUSTOMER}});
 const rider=await prisma.user.upsert({where:{email:"delivery@shaikhs.demo"},update:{},create:{name:"Demo Rider",email:"delivery@shaikhs.demo",passwordHash,role:Role.DELIVERY,deliveryProfile:{create:{vehicleType:"Bike",isOnline:true}}}});
 const restaurant=await prisma.restaurant.upsert({where:{ownerId:owner.id},update:{},create:{ownerId:owner.id,name:"Shaikh’s Kitchen",description:"Freshly prepared favourites, made with care.",address:"Main Market Road",city:"Raichur"}});
// Only the explicitly disposable local demo receives a synthetic postal rule.
const target=new URL(process.env.DATABASE_URL??'');
if(['localhost','127.0.0.1'].includes(target.hostname)&&target.pathname.startsWith('/shaikhs_disposable_')&&!await prisma.deliveryZone.count({where:{restaurantId:restaurant.id}})){
 const policy=await prisma.deliveryPolicy.findUniqueOrThrow({where:{id:'default'}});
 await prisma.deliveryZone.create({data:{restaurantId:restaurant.id,name:'SIMULATED DEVELOPMENT PIN 584101',postalCode:'584101',deliveryFee:policy.deliveryFee,minimumOrder:0}});
}
const menu = [
  ["Hyderabadi Chicken Biryani", "Biryani", "Aromatic basmati rice, slow-cooked chicken and house spices.", 249, "/images/biryani.jpg"],
  ["Paneer Butter Masala", "Main Course", "Paneer in a rich tomato and butter gravy.", 219, "/images/paneer-butter-masala.jpg"],
  ["Classic Smash Burger", "Burgers", "Crispy-edged patty, fresh lettuce and house sauce.", 199, "/images/burger.jpg"],
  ["Gulab Jamun", "Desserts", "Warm milk-solid dumplings in cardamom syrup.", 99, "/images/gulab-jamun.jpg"],
  ["Masala Dosa", "South Indian", "Golden crisp dosa with potato masala and chutneys.", 119, "/images/masala-dosa.jpg"],
  ["Chicken 65", "Starters", "Crispy spiced chicken bites with curry leaves.", 189, "/images/chicken-65.jpg"]
] as const;
 for(const [name,category,description,price,imageUrl] of menu){
  await prisma.product.upsert({where:{id:`seed-${name.toLowerCase().replaceAll(" ","-")}`},update: { imageUrl },create:{id:`seed-${name.toLowerCase().replaceAll(" ","-")}`,restaurantId:restaurant.id,name,category,description,price,imageUrl}});
 }
 console.log({admin:admin.email,restaurant:owner.email,customer:customer.email,delivery:rider.email,restaurantId:restaurant.id});
}
main().finally(()=>prisma.$disconnect());
