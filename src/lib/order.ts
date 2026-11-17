import type { OrderStatus } from "@prisma/client";
const allowed:Record<OrderStatus,OrderStatus[]> = {
 PLACED:["ACCEPTED","CANCELLED"], ACCEPTED:["PREPARING","CANCELLED"], PREPARING:["READY_FOR_PICKUP","CANCELLED"],
 READY_FOR_PICKUP:["PICKED_UP"], PICKED_UP:["DELIVERED"], DELIVERED:[], CANCELLED:[]
};
export function canTransition(from:OrderStatus,to:OrderStatus){return allowed[from].includes(to);}
