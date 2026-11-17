import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ isOnline: z.boolean() });

export async function GET() {
  const user = await currentUser();
  if (!user || user.role !== "DELIVERY") {
    return NextResponse.json({ error: "Delivery partner sign-in required" }, { status: 401 });
  }
  const profile = await prisma.deliveryProfile.findUnique({ where: { userId: user.id } });
  return NextResponse.json({ isOnline: profile?.isOnline ?? false, vehicleType: profile?.vehicleType ?? "Bike" });
}

export async function PATCH(req: Request) {
  const user = await currentUser();
  if (!user || user.role !== "DELIVERY") {
    return NextResponse.json({ error: "Delivery partner sign-in required" }, { status: 401 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid availability status" }, { status: 400 });
  const profile = await prisma.deliveryProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, isOnline: parsed.data.isOnline },
    update: { isOnline: parsed.data.isOnline },
  });
  return NextResponse.json({ isOnline: profile.isOnline, vehicleType: profile.vehicleType });
}
