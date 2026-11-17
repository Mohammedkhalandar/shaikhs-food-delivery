import { describe,it,expect } from 'vitest';
import { hoursSchema,restaurantAvailable,visibleOrder } from './operations';
const week=Array.from({length:7},(_,day)=>({day,open:'09:00',close:'18:00',closed:false}));
describe('restaurant availability and verification visibility',()=>{
 it('preserves manual availability and honours temporary closure',()=>{
  const now=new Date('2026-11-16T06:00:00Z');
  expect(restaurantAvailable({isOpen:true},now)).toBe(true);
  expect(restaurantAvailable({isOpen:false},now)).toBe(false);
  expect(restaurantAvailable({isOpen:true,closedUntil:new Date('2026-11-16T07:00:00Z')},now)).toBe(false);
  expect(restaurantAvailable({isOpen:true,closedUntil:new Date('2026-11-16T05:00:00Z')},now)).toBe(true);
 });
 it('enforces inclusive opening and exclusive closing in IST',()=>{
  expect(restaurantAvailable({isOpen:true,weeklyHours:week},new Date('2026-11-16T03:30:00Z'))).toBe(true);
  expect(restaurantAvailable({isOpen:true,weeklyHours:week},new Date('2026-11-16T12:30:00Z'))).toBe(false);
  expect(restaurantAvailable({isOpen:true,weeklyHours:week},new Date('2026-11-16T03:29:00Z'))).toBe(false);
 });
 it('carries overnight openings into a closed following day',()=>{
  const overnight=week.map(h=>({...h,closed:true}));overnight[6]={day:6,open:'22:00',close:'02:00',closed:false};
  expect(restaurantAvailable({isOpen:true,weeklyHours:overnight},new Date('2026-11-14T19:30:00Z'))).toBe(true);
  expect(restaurantAvailable({isOpen:true,weeklyHours:overnight},new Date('2026-11-14T20:30:00Z'))).toBe(false);
 });
 it('rejects malformed or ambiguous schedules and fails closed',()=>{
  expect(hoursSchema.safeParse(week.slice(1)).success).toBe(false);
  expect(hoursSchema.safeParse(week.map(h=>({...h,day:0}))).success).toBe(false);
  expect(hoursSchema.safeParse(week.map(h=>({...h,close:'09:00'}))).success).toBe(false);
  expect(restaurantAvailable({isOpen:true,weeklyHours:[] })).toBe(false);
 });
 it('never gives riders either code or customers the kitchen code',()=>{
  const order={pickupCode:'123456',deliveryCode:'654321'};
  expect(visibleOrder(order,'DELIVERY')).toEqual({pickupCode:undefined,deliveryCode:undefined,deliveryVerificationReady:true});
  expect(visibleOrder(order,'CUSTOMER').pickupCode).toBeUndefined();
  expect(visibleOrder(order,'CUSTOMER').deliveryCode).toBe('654321');
  expect(visibleOrder(order,'RESTAURANT').deliveryCode).toBeUndefined();
  expect(visibleOrder(order,'RESTAURANT').pickupCode).toBe('123456');
 });
});
