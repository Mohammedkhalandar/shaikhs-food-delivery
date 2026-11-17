import { z } from 'zod';
import type { Role } from '@prisma/client';
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const hoursSchema = z.array(z.object({ day: z.number().int().min(0).max(6), open: time, close: time, closed: z.boolean() }).strict().refine(h => h.closed || h.open !== h.close, 'Opening and closing times must differ')).length(7).refine(hours => new Set(hours.map(h => h.day)).size === 7, 'One entry per day required');
export type OpeningHours = z.infer<typeof hoursSchema>;
export function restaurantAvailable(restaurant: { isOpen: boolean; lifecycle?: string; owner?: {active:boolean}; closedUntil?: Date | null; weeklyHours?: unknown }, now = new Date()) {
  if ((restaurant.lifecycle!==undefined&&restaurant.lifecycle!=='ACTIVE')||restaurant.owner?.active===false||!restaurant.isOpen || (restaurant.closedUntil && restaurant.closedUntil > now)) return false;
  if (restaurant.weeklyHours == null) return true; // Existing unscheduled kitchens retain manual availability.
  const parsed = hoursSchema.safeParse(restaurant.weeklyHours);
  if (!parsed.success) return false;
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  const part = (type: string) => parts.find(p => p.type === type)?.value ?? '';
  const day = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(part('weekday'));
  const minute = Number(part('hour')) * 60 + Number(part('minute'));
  const minutes = (s: string) => Number(s.slice(0,2))*60+Number(s.slice(3));
  return parsed.data.some(h => !h.closed && (h.day === day && (minutes(h.open) < minutes(h.close) ? minute >= minutes(h.open) && minute < minutes(h.close) : minute >= minutes(h.open)) || h.day === (day+6)%7 && minutes(h.open) > minutes(h.close) && minute < minutes(h.close)));
}
export function visibleOrder<T extends { pickupCode?: string | null; deliveryCode?: string | null }>(order: T, role: Role) {
  return { ...order, pickupCode: ['RESTAURANT','ADMIN'].includes(role) ? order.pickupCode : undefined, deliveryVerificationReady: Boolean(order.deliveryCode), deliveryCode: ['CUSTOMER','ADMIN'].includes(role) ? order.deliveryCode : undefined };
}
