import {describe,it,expect} from "vitest";
import {canTransition} from "./order";
describe("order lifecycle",()=>{
 it("allows restaurant progression",()=>{expect(canTransition("PLACED","ACCEPTED")).toBe(true);expect(canTransition("ACCEPTED","PREPARING")).toBe(true);expect(canTransition("PREPARING","READY_FOR_PICKUP")).toBe(true)});
 it("allows handoff and delivery",()=>{expect(canTransition("READY_FOR_PICKUP","PICKED_UP")).toBe(true);expect(canTransition("PICKED_UP","DELIVERED")).toBe(true)});
 it("rejects skipping stages",()=>{expect(canTransition("PLACED","DELIVERED")).toBe(false);expect(canTransition("PREPARING","PICKED_UP")).toBe(false)});
 it("does not allow terminal state changes",()=>{expect(canTransition("DELIVERED","CANCELLED")).toBe(false);expect(canTransition("CANCELLED","ACCEPTED")).toBe(false)});
});
