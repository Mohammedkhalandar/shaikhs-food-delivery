"use client";
import dynamic from "next/dynamic";
import {KitchenDiscovery,CustomerEditorial} from "@/components/customer-editorial";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { canTransition } from "@/lib/order";
import Image from "next/image";
import Link from "next/link";
import {additionalStock,stockLimit} from '@/lib/stock-client';
import { CatalogOptions } from '@/components/catalog-options';
import { cartKey as basketKey, readCartKey, chosenPrice, defaultChoice, type Choice, type CatalogOption } from '@/lib/cart-options';
import {
  Search,
  ShoppingBag,
  MapPin,
  Plus,
  Minus,
  ArrowRight,
  Clock,
  LogOut,
  X,
  CheckCircle2,
} from "lucide-react";

import type {DeliveryTarget} from '@/components/addresses-zones';
import type {OperationalOrder} from '@/components/operations';
function SectionLoading(){return <p role="status">Loading this section…</p>;}
const ReviewManagement=dynamic(()=>import('@/components/reviews').then(module=>module.ReviewManagement),{loading:SectionLoading});
const PublicReviews=dynamic(()=>import('@/components/reviews').then(module=>module.PublicReviews),{loading:SectionLoading});
const PromotionManagement=dynamic(()=>import('@/components/promotions').then(module=>module.PromotionManagement),{loading:SectionLoading});
const AvailablePromotions=dynamic(()=>import('@/components/promotions').then(module=>module.AvailablePromotions),{loading:SectionLoading});
const ReviewCases=dynamic(()=>import('@/components/review-cases').then(module=>module.ReviewCases),{loading:SectionLoading});
const AdminOperations=dynamic(()=>import('@/components/admin-onboarding').then(module=>module.AdminOperations),{loading:SectionLoading});
const RestaurantFinance=dynamic(()=>import('@/components/restaurant-finance').then(module=>module.RestaurantFinance),{loading:SectionLoading});
const NotificationCenter=dynamic(()=>import('@/components/notifications').then(module=>module.NotificationCenter),{loading:SectionLoading});
const LocalMailPanel=dynamic(()=>import('@/components/notifications').then(module=>module.LocalMailPanel),{loading:SectionLoading});
const StaffManagement=dynamic(()=>import('@/components/management').then(module=>module.StaffManagement),{loading:SectionLoading});
const MenuManagement=dynamic(()=>import('@/components/management').then(module=>module.MenuManagement),{loading:SectionLoading});
const EarningsPanel=dynamic(()=>import('@/components/management').then(module=>module.EarningsPanel),{loading:SectionLoading});
const AddressBook=dynamic(()=>import('@/components/addresses-zones').then(module=>module.AddressBook),{loading:SectionLoading});
const ZoneManagement=dynamic(()=>import('@/components/addresses-zones').then(module=>module.ZoneManagement),{loading:SectionLoading});
const InventoryManagement=dynamic(()=>import('@/components/inventory').then(module=>module.InventoryManagement),{loading:SectionLoading});
const OnlinePayment=dynamic(()=>import('@/components/online-payment').then(module=>module.OnlinePayment),{loading:SectionLoading});
const OrderOperations=dynamic(()=>import('@/components/operations').then(module=>module.OrderOperations),{loading:SectionLoading});
const RestaurantAvailability=dynamic(()=>import('@/components/operations').then(module=>module.RestaurantAvailability),{loading:SectionLoading});

type UserRole = "CUSTOMER" | "RESTAURANT" | "DELIVERY" | "ADMIN";

type Product = {
  createdAt?:string;stockTracked?:boolean;stockQuantity?:number;
  options?: CatalogOption[];
  id: string;
  name: string;
  category: string;
  description: string | null;
  price: string | number;
  imageUrl: string | null;
  restaurantId: string;
  restaurant: {
    id: string;
    name: string;
    city: string;
  };
  restaurantRating?: {average:number;count:number}|null;
  itemRating?: {average:number;count:number}|null;
  available?: boolean;
};

type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  emailVerificationRequired?: boolean;
  emailVerifiedAt?: string|null;
};

type Cart = Record<string, number>;

type OrderStatus =
  | "PLACED"
  | "ACCEPTED"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "PICKED_UP"
  | "DELIVERED"
  | "CANCELLED";

type OrderItem = {
  id: string;
  quantity: number;
  nameSnapshot: string;
};

type Order = OperationalOrder & {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: string | number;
  createdAt: string;
  restaurant?: { name: string; address?: string } | null;
  deliveryAddress?: string;
  deliveryPartner?: { name: string } | null;
  deliveryPartnerId?: string | null;
  items?: OrderItem[];
  paymentMethod?: "CASH_ON_DELIVERY" | "ONLINE";
  paymentStatus?: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  deliveryPostalCode?: string | null;
  deliveryAddressSnapshot?: {instructions?:string} | null;
  statusHistory?: { status: OrderStatus; createdAt: string; note?: string | null }[];
  discount?: string;
  promotionSnapshot?: {code:string;title:string}|null;
};

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  deliveryProfile?: { isOnline: boolean } | null;
};

type AdminData = {
  users: AdminUser[];
  metrics: {
    users: number;
    orders: number;
    revenue: number | string;
    paymentReviews?: number;
    pendingRefunds?: number;
  };
};

type ApiMessage = {
  error?: string;
};

const fmt = (value: number | string) =>
  "₹" +
  Number(value).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });

async function getErrorMessage(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as ApiMessage;
    return body.error || fallback;
  } catch {
    return fallback;
  }
}

export function Storefront() {
  const [products, setProducts] = useState<Product[]>([]);
  const [visibleIds,setVisibleIds]=useState<string[]>([]),[nextCursor,setNextCursor]=useState<string|null>(null),[catalogCategories,setCatalogCategories]=useState<string[]>([]);
  const catalogReady=useRef(false),catalogSequence=useRef(0),catalogController=useRef<AbortController|null>(null);
  const [basketLoading,setBasketLoading]=useState(false),[basketError,setBasketError]=useState('');
  const [user, setUser] = useState<User | null>(null);
  const [cart, setCart] = useState<Cart>({});
  const [choices,setChoices]=useState<Record<string,Choice>>({});
  const [restaurantContext,setRestaurantContext]=useState<{isOwner:boolean;canMenu:boolean;canOrders:boolean;staffRole:string}|null>(null);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [showCart, setShowCart] = useState(false);
  const [showDeliveryAddress, setShowDeliveryAddress] = useState(false);
  const [auth, setAuth] = useState(false);
  const [registerMode, setRegisterMode] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode,setPostalCode]=useState(''),[savedAddressId,setSavedAddressId]=useState<string|undefined>(),[addressVersion,setAddressVersion]=useState<number|undefined>();
  const [couponDraft,setCouponDraft]=useState(''),[couponCode,setCouponCode]=useState('');
  type Quote={replayOnly?:boolean;discount?:string;promotion?:{code:string;title:string;policy:string}|null;subtotal:string;tax:string;deliveryFee:string;total:string;quoteToken:string;policyVersion:number;zoneName:string;message:string;lines:{unitPrice:string;lineTotal:string;nameSnapshot:string}[]};
  const [deliveryQuote,setDeliveryQuote]=useState<{signature:string;data:Quote}|null>(null),[quoteBusy,setQuoteBusy]=useState(false),[quoteError,setQuoteError]=useState(''),[quoteReload,setQuoteReload]=useState(0);
  const target:DeliveryTarget={deliveryAddress:address,postalCode,savedAddressId,addressVersion};
  function changeAddress(next:DeliveryTarget){setAddress(next.deliveryAddress);setPostalCode(next.postalCode);setSavedAddressId(next.savedAddressId);setAddressVersion(next.addressVersion);setDeliveryQuote(null);setQuoteError('');}
  const [onlineEnabled, setOnlineEnabled] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"CASH_ON_DELIVERY" | "ONLINE">("CASH_ON_DELIVERY");
  const [loading, setLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [cartReady, setCartReady] = useState(false);
  const checkoutAttempt = useRef<{ fingerprint: string; key: string } | null>(null);
  const checkoutLock = useRef(false);
  const modalRef = useRef<HTMLElement | null>(null);
  const [notice, setNotice] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<"shop" | "dashboard">("shop");
  const [sectionTarget, setSectionTarget] = useState<"menu" | "story" | null>(null);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    if (view !== "shop" || !sectionTarget) return;
    document.getElementById(sectionTarget)?.scrollIntoView();
    setSectionTarget(null);
  }, [view, sectionTarget]);

  const flash = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  };

  function catalogEndpoint(){return user?.role==='RESTAURANT'?'/api/restaurant/menu':'/api/catalog';}
  async function loadProducts(endpoint: string) {
    const sequence=++catalogSequence.current;catalogController.current?.abort();const controller=new AbortController();catalogController.current=controller;
    const url=new URL(window.location.href),params=new URLSearchParams();for(const key of ['q','category','restaurantId','cursor']){const value=url.searchParams.get(key);if(value)params.set(key,value);}
    setLoading(true);setCatalogError('');
    try{const response=await fetch(endpoint+'?'+params,{cache:'no-store',signal:controller.signal});if(!response.ok)throw new Error(await getErrorMessage(response,'Could not load menu'));
      const body=await response.json() as {products?:Product[];nextCursor?:string|null;categories?:string[]};if(sequence!==catalogSequence.current)return;
      const rows=body.products??[];setProducts(old=>{if(endpoint.startsWith('/api/restaurant/'))return rows;const basketIds=new Set((()=>{try{return Object.keys(JSON.parse(localStorage.getItem('shaikhs-basket')??'{}'));}catch{return Object.keys(cart);}})().map(key=>readCartKey(key).productId));const map=new Map(old.filter(v=>basketIds.has(v.id)).map(v=>[v.id,v]));for(const row of rows)map.set(row.id,row);return [...map.values()];});
      setVisibleIds(rows.map(v=>v.id));setNextCursor(body.nextCursor??null);setCatalogCategories(body.categories??[...new Set(rows.map(v=>v.category))]);
    }catch(error){if(controller.signal.aborted)return;setCatalogError(error instanceof Error?error.message:'Could not load menu');throw error;}finally{if(sequence===catalogSequence.current)setLoading(false);}
  }
  function navigateCatalog(changes:Record<string,string|null>,focusResults=false){const url=new URL(window.location.href);for(const [key,value]of Object.entries(changes)){if(value)url.searchParams.set(key,value);else url.searchParams.delete(key);}window.history.pushState(null,'',url);setSearch(url.searchParams.get('q')??'');setCategory(url.searchParams.get('category')??'All');void loadProducts(catalogEndpoint()).then(()=>{if(focusResults){const heading=document.getElementById('catalog-heading');heading?.focus({preventScroll:true});heading?.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}}).catch(()=>{});}
  useEffect(()=>{if(!catalogReady.current)return;const q=search.trim();if(q===(new URL(window.location.href).searchParams.get('q')??''))return;const timer=setTimeout(()=>navigateCatalog({q:q||null,cursor:null}),300);return()=>clearTimeout(timer);
    // Search is debounced; navigation reads current URL filters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[search]);
  useEffect(()=>{const back=()=>{const url=new URL(window.location.href);setSearch(url.searchParams.get('q')??'');setCategory(url.searchParams.get('category')??'All');void loadProducts(catalogEndpoint()).catch(()=>{});};window.addEventListener('popstate',back);return()=>window.removeEventListener('popstate',back);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[user?.role]);

  async function load() {
    setLoading(true);
    setCatalogError("");
    try {
      const response = await fetch("/api/auth/me");
      const body = (await response.json()) as { user?: User | null };
      const nextUser = body.user ?? null;
      setUser(nextUser);

      const endpoint =
        nextUser?.role === "RESTAURANT"
          ? "/api/restaurant/menu"
          : "/api/catalog";
      const location=new URL(window.location.href);setSearch(location.searchParams.get("q")??"");setCategory(location.searchParams.get("category")??"All");await loadProducts(endpoint);catalogReady.current=true;
    } catch (error) {
      setCatalogError(error instanceof Error ? error.message : "Could not load menu");
      flash(
        error instanceof Error
          ? error.message
          : "Could not load the storefront",
      );
    } finally { setLoading(false); }
  }

  async function loadOrders() {
    const response = await fetch("/api/orders");
    if (!response.ok) {
      throw new Error(await getErrorMessage(response, "Could not load orders"));
    }
    const body = (await response.json()) as { orders?: Order[] };
    setOrders(body.orders ?? []);
  }

  useEffect(() => {
    void load();
    // Initial session and catalogue load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void fetch("/api/payments/config", { cache: "no-store" }).then(async response => {
      if (!response.ok) return;
      const config = await response.json(); setOnlineEnabled(config.enabled === true && config.mode === "test");
    }).catch(() => setOnlineEnabled(false));
  }, []);

  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem("shaikhs-basket") ?? "{}");
      if (saved && typeof saved === "object" && !Array.isArray(saved)) {
        setCart(Object.fromEntries(Object.entries(saved).filter(([, quantity]) => typeof quantity === "number" && Number.isInteger(quantity) && quantity > 0 && quantity <= 20)));
      }
    } catch { /* Storage may be disabled; ordering remains available. */ }
    setCartReady(true);
    try {
      const saved = JSON.parse(sessionStorage.getItem("shaikhs-checkout-attempt") ?? "null");
      if (saved?.paymentMethod === "ONLINE") setPaymentMethod("ONLINE");
    } catch { /* Optional retry-mode persistence; no address is saved. */ }
  }, []);

  useEffect(()=>{if(!user?.id)return;try{const saved=JSON.parse(sessionStorage.getItem('shaikhs-checkout-attempt')??'null');if(saved?.customerId===user.id&&typeof saved.couponCode==='string'&&/^[A-Z0-9_-]{3,30}$/.test(saved.couponCode)){setCouponCode(saved.couponCode);setCouponDraft(saved.couponCode);}else if(saved?.customerId&&saved.customerId!==user.id){setCouponCode('');setCouponDraft('');}}catch{/* Optional retry persistence. */}},[user?.id]);
  useEffect(() => {
    if (cartReady) {
      try { localStorage.setItem("shaikhs-basket", JSON.stringify(cart)); } catch { /* Optional persistence. */ }
    }
  }, [cart, cartReady]);

  useEffect(() => {
    if (!auth && !showCart) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const container = modalRef.current;
    const focusable = () => Array.from(container?.querySelectorAll<HTMLElement>('button:not(:disabled), input, textarea, select, a[href]') ?? []);
    focusable()[0]?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setAuth(false); setShowCart(false); }
      if (event.key === "Tab") {
        const elements = focusable(); const first = elements[0]; const last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => { document.body.style.overflow = overflow; document.removeEventListener("keydown", handleKey); previous?.focus(); };
  }, [auth, showCart]);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }

    let canRefreshOrders=user.role!=="RESTAURANT";
    if(canRefreshOrders) void loadOrders().catch((error: unknown) => {
      flash(
        error instanceof Error ? error.message : "Could not load orders",
      );
    });

    if (user.role !== "CUSTOMER") {
      setView("dashboard");
    }

    if (user.role === "RESTAURANT") {
      void fetch('/api/restaurant/context').then(async response=>{if(!response.ok)throw Error('Restaurant access is inactive or unavailable');const context=await response.json();setRestaurantContext(context);canRefreshOrders=context.canOrders;if(context.canOrders)await loadOrders();}).catch(error=>flash(error instanceof Error?error.message:'Could not load restaurant access'));
      void loadProducts("/api/restaurant/menu").catch((error: unknown) => {
        flash(
          error instanceof Error ? error.message : "Could not load restaurant menu",
        );
      });
    }

    if (user.role === "DELIVERY") {
      void fetch("/api/delivery/profile")
        .then(async (response) => {
          if (!response.ok) {
            throw new Error("Could not load delivery availability");
          }
          return (await response.json()) as { isOnline?: boolean };
        })
        .then((body) => setIsOpen(Boolean(body.isOnline)))
        .catch(() => setIsOpen(false));
    }
    const interval = setInterval(() => { if (canRefreshOrders&&!document.hidden) void loadOrders().catch(() => {}); }, 20000);
    return () => clearInterval(interval);
    // Refresh role-specific data when the signed-in user changes; URL queries are read at request time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const categories = ['All',...new Set([...catalogCategories,...(category==='All'?[]:[category])])];
  const filtered = useMemo(()=>visibleIds.flatMap(id=>{const product=products.find(v=>v.id===id);return product?[product]:[];}),[products,visibleIds]);
  const basketIdsSignature=JSON.stringify([...new Set(Object.keys(cart).map(key=>readCartKey(key).productId))].sort());
  useEffect(()=>{if(!cartReady)return;const ids=JSON.parse(basketIdsSignature) as string[];if(!ids.length){setBasketError('');return;}if(ids.length>48){setBasketError('Your basket exceeds 48 dishes. Remove items before checkout.');return;}const controller=new AbortController();setBasketLoading(true);setBasketError('');
    void fetch('/api/catalog?ids='+encodeURIComponent(ids.join(',')),{cache:'no-store',signal:controller.signal}).then(async response=>{if(!response.ok)throw Error('Could not refresh basket availability');const body=await response.json() as {products:Product[]};try{const saved=JSON.parse(sessionStorage.getItem('shaikhs-checkout-attempt')??'null');if(user?.role==='CUSTOMER'&&(!saved?.customerId||saved.customerId===user.id)&&typeof saved?.key==='string'){const retry=await fetch('/api/catalog/retry?ids='+encodeURIComponent(ids.join(',')),{headers:{'X-Checkout-Retry-Key':saved.key},cache:'no-store',signal:controller.signal});if(retry.ok){const historical=await retry.json() as {products:Product[]};for(const product of historical.products){const current=body.products.find(p=>p.id===product.id);if(!current)body.products.push(product);else current.options=[...(current.options??[]),...(product.options??[]).filter(o=>!current.options?.some(v=>v.id===o.id))];}}}}catch{/* Public metadata remains usable; server quotes still authorize historical replay. */}if(controller.signal.aborted)return;setProducts(old=>{const map=new Map(old.map(v=>[v.id,ids.includes(v.id)&&!body.products.some(p=>p.id===v.id)?{...v,available:false,stockTracked:true,stockQuantity:0}:v]));for(const row of body.products)map.set(row.id,row);return [...map.values()];});}).catch(error=>{if(!controller.signal.aborted)setBasketError(error.message);}).finally(()=>{if(!controller.signal.aborted)setBasketLoading(false);});return()=>controller.abort();
  },[basketIdsSignature,cartReady,user?.id,user?.role]);
  const missingBasketKeys=Object.keys(cart).filter(key=>!products.some(v=>v.id===readCartKey(key).productId));

  const count = Object.values(cart).reduce((total, quantity) => total + quantity, 0);
  const cartRows = Object.entries(cart).flatMap(([key,quantity])=>{if(quantity<=0)return [];const selection=readCartKey(key);const product=products.find(p=>p.id===selection.productId);if(!product)return [];const ids=[...(selection.variantId?[selection.variantId]:[]),...selection.addonIds];const names=ids.map(id=>product.options?.find(o=>o.id===id)?.name??'Unavailable option');return [{...product,cartKey:key,selection,stockUnavailable:stockLimit(product,selection)===0||additionalStock(product,selection,cart)<0,optionsUnavailable:ids.some(id=>!product.options?.some(o=>o.id===id&&o.available))||!!product.options?.some(o=>o.kind==='VARIANT')&&!selection.variantId,name:product.name+(names.length?' ('+names.join(', ')+')':''),price:chosenPrice(product,selection)}];}).sort((a,b)=>(a.createdAt??" ").localeCompare(b.createdAt??" ")||a.id.localeCompare(b.id));
  const subtotal = cartRows.reduce(
    (total, product) => total + Number(product.price) * cart[product.cartKey],
    0,
  );

  const deliveryIntent={...(couponCode?{couponCode}:{}),restaurantId:cartRows[0]?.restaurantId??'',deliveryAddress:address,paymentMethod,items:cartRows.map(product=>({productId:product.id,quantity:cart[product.cartKey],...(product.selection.variantId?{variantId:product.selection.variantId}:{}),...(product.selection.addonIds.length?{addonIds:product.selection.addonIds}:{})})),...(savedAddressId?{savedAddressId,addressVersion}:{postalCode})};
  const quoteSignature=JSON.stringify(deliveryIntent);
  const currentQuote=deliveryQuote?.signature===quoteSignature?deliveryQuote.data:null;
  useEffect(()=>{
    const intent=JSON.parse(quoteSignature) as {items:unknown[];savedAddressId?:string;deliveryAddress:string;postalCode?:string};
    if(!showCart||user?.role!=='CUSTOMER'||!intent.items.length||!intent.savedAddressId&&(intent.deliveryAddress.trim().length<8||!/^[1-9]\d{5}$/.test(intent.postalCode??''))){setDeliveryQuote(null);setQuoteBusy(false);setQuoteError('');return;}
    const controller=new AbortController();let active=true;setQuoteBusy(true);setQuoteError('');setDeliveryQuote(null);
    const timer=setTimeout(()=>{void fetch('/api/delivery/quote',{method:'POST',headers:{'Content-Type':'application/json',...(():Record<string,string>=>{try{const saved=JSON.parse(sessionStorage.getItem('shaikhs-checkout-attempt')??'null');return typeof saved?.key==='string'&&/^[A-Za-z0-9_-]{8,128}$/.test(saved.key)&&(!saved.customerId||saved.customerId===user?.id)?{'X-Checkout-Retry-Key':saved.key}:{};}catch{return {};}})()},body:quoteSignature,signal:controller.signal}).then(async r=>{const body=await r.json();if(!r.ok)throw Error(body.error??'Could not check delivery');if(active)setDeliveryQuote({signature:quoteSignature,data:body.quote});}).catch(e=>{if(active&&e.name!=='AbortError')setQuoteError(e.message??'Could not verify delivery');}).finally(()=>{if(active)setQuoteBusy(false);});},250);
    return()=>{active=false;clearTimeout(timer);controller.abort();};
  },[quoteSignature,showCart,user?.id,user?.role,quoteReload]);

  function addToCart(product: Product) {
    if(new Set(Object.keys(cart).map(key=>readCartKey(key).productId)).size>=48&&!Object.keys(cart).some(key=>readCartKey(key).productId===product.id)){flash('A basket can contain at most 48 different dishes.');return;}
    if(additionalStock(product,choices[product.id]??defaultChoice(product),cart)<=0){flash("This selection is out of stock or all available units are in your basket.");return;}
    if (cartRows.some(row => row.restaurantId !== product.restaurantId)) {
      flash("Your basket is from another kitchen. Complete that order before adding from a new kitchen.");
      return;
    }
    const key=basketKey(product.id,choices[product.id]??defaultChoice(product));
    setCart(old => ({ ...old, [key]: Math.min(20, (old[key] ?? 0) + 1) }));
  }

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = (await response.json()) as {
        user?: User;
        error?: string;
      };

      if (!response.ok || !body.user) {
        throw new Error(body.error || "Sign-in failed");
      }

      setUser(body.user);
      setAuth(false);
      setPassword("");
      flash("Welcome, " + body.user.name);
    } catch (error) {
      flash(error instanceof Error ? error.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: fullName, email, password }),
      });
      const body = (await response.json()) as {
        user?: User;
        error?: string;
      };

      if (!response.ok || !body.user) {
        throw new Error(body.error || "Registration failed");
      }

      setUser(body.user);
      setAuth(false);
      setFullName("");
      setPassword("");
      flash("Account created. Welcome to Shaikh’s, " + body.user.name);
    } catch (error) {
      flash(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Sign-out failed"));
      }
      setUser(null);changeAddress({deliveryAddress:'',postalCode:''});
      setOrders([]);
      setCart({});
      setProducts([]);void loadProducts("/api/catalog").catch(()=>{});
      setView("shop");
      flash("Signed out");
    } catch (error) {
      flash(error instanceof Error ? error.message : "Sign-out failed");
    }
  }

  async function checkout() {
    if (checkoutLock.current) return;
    if (!user) {
      setAuth(true);
      setShowCart(false);
      return;
    }

    if (user.role !== "CUSTOMER") {
      flash("Sign in with a customer account to order");
      return;
    }

    if(basketLoading||basketError||missingBasketKeys.length){flash("Refresh or remove unavailable basket items before checkout.");return;}
    if (cartRows.length === 0) {
      flash("Your basket is empty");
      return;
    }

    checkoutLock.current = true;
    setBusy(true);
    try {
      const restaurantId = cartRows[0]?.restaurantId;

      if (cartRows.some((product) => product.restaurantId !== restaurantId)) {
        throw new Error("Please order from one restaurant per checkout");
      }

      if (paymentMethod === "ONLINE" && !onlineEnabled) throw new Error("Online test checkout is unavailable. Check your orders before choosing another payment method.");
      const payload = JSON.stringify(deliveryIntent);
      const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(payload));
      const fingerprint = Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, "0")).join("");
      if (!checkoutAttempt.current) {
        try {
          const saved = JSON.parse(sessionStorage.getItem("shaikhs-checkout-attempt") ?? "null");
          if (typeof saved?.fingerprint === "string" && /^[a-f0-9]{64}$/.test(saved.fingerprint) && typeof saved?.key === "string" && /^[A-Za-z0-9_-]{8,128}$/.test(saved.key)) checkoutAttempt.current = saved;
        } catch { /* Optional retry persistence; no address or order body is stored. */ }
      }
      if(checkoutAttempt.current&&checkoutAttempt.current.fingerprint!==fingerprint&&!savedAddressId){
        const legacyIntent={...(couponCode?{couponCode}:{}),restaurantId:deliveryIntent.restaurantId,deliveryAddress:address,paymentMethod,items:deliveryIntent.items};
        const legacyBytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(legacyIntent)));
        const legacyFingerprint=Array.from(new Uint8Array(legacyBytes),b=>b.toString(16).padStart(2,'0')).join('');
        if(checkoutAttempt.current.fingerprint===legacyFingerprint)checkoutAttempt.current={fingerprint,key:checkoutAttempt.current.key};
      }
      if (checkoutAttempt.current?.fingerprint !== fingerprint) checkoutAttempt.current = { fingerprint, key: crypto.randomUUID() };
      try { sessionStorage.setItem("shaikhs-checkout-attempt", JSON.stringify({ ...checkoutAttempt.current, paymentMethod,...(couponCode?{couponCode,customerId:user.id}:{}) })); } catch { /* In-memory retries remain available. */ }
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": checkoutAttempt.current.key,...(currentQuote?{"X-Delivery-Policy-Version":String(currentQuote.policyVersion),"X-Delivery-Quote":currentQuote.quoteToken}:{}) },
        body: payload,
      });
      const body = (await response.json()) as {
        order?: Order;
        error?: string;
      };

      if (!response.ok || !body.order) {
        if(response.status===409)setQuoteReload(n=>n+1);
        throw new Error(body.error || "Checkout failed");
      }

      setCart({});setCouponCode('');setCouponDraft('');
      checkoutAttempt.current = null;
      try { sessionStorage.removeItem("shaikhs-checkout-attempt"); } catch { /* Optional browser storage. */ }
      setShowCart(false);
      flash(paymentMethod === "ONLINE" ? "Order saved. Continue with the test payment in your orders." : "Order " + body.order.orderNumber + " placed successfully");
      setView("dashboard");
      await loadOrders().catch(() => flash("Order placed. Refresh your orders to see the latest status."));
    } catch (error) {
      flash(error instanceof Error ? error.message : "Checkout failed");
    } finally {
      checkoutLock.current = false;
      setBusy(false);
    }
  }

  async function updateStatus(id: string, status: OrderStatus) {
    try {
      const response = await fetch(`/api/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        flash(await getErrorMessage(response, "Could not update order"));
        if (response.status === 409) await loadOrders();
        return;
      }
      await loadOrders();
      flash("Order updated to " + status.replaceAll("_", " ").toLowerCase());
    } catch (error) {
      flash(error instanceof Error ? error.message : "Could not update order");
    }
  }

  async function toggleDeliveryAvailability() {
    const next = !isOpen;
    try {
      const response = await fetch("/api/delivery/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOnline: next }),
      });
      const body = (await response.json()) as {
        isOnline?: boolean;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(body.error ?? "Could not update availability");
      }

      setIsOpen(Boolean(body.isOnline));
      flash(
        body.isOnline
          ? "You are now online for deliveries"
          : "You are now offline",
      );
    } catch (error) {
      flash(
        error instanceof Error
          ? error.message
          : "Could not update availability",
      );
    }
  }

  const money = fmt;

  return (
    <main className={view === "shop" || user?.role === "CUSTOMER" ? "customer-site" : "operations-site"}>
      <div className="topline">
        <div className="shell topinner">
          <span>Freshly made. Thoughtfully delivered.</span>
          <span>
            <MapPin size={13} /> Raichur, Karnataka{" "}
            <span className="topdot">•</span> Local ordering
          </span>
        </div>
      </div>

      <header className="shell nav">
        <button className="brand" onClick={() => setView("shop")} type="button">
          <span className="brandmark">S</span>
          <span>
            shaikh’s
            <small>FOOD, WITH HEART</small>
          </span>
        </button>
        <div className="navlinks">
          <button onClick={() => setView("shop")} type="button">
            Discover
          </button>
          <a href="#menu" onClick={() => { setView("shop"); setSectionTarget("menu"); }}>Menu</a>
          <a href="#story" onClick={() => { setView("shop"); setSectionTarget("story"); }}>Our story</a>
          <a href="/partner">Partner with us</a>
        </div>
        <div className="navright">
          {user ? (
            <>
              <NotificationCenter key={user.id} onOpenOrders={()=>setView("dashboard")} />
              <button
                className="userpill"
                onClick={() =>
                  setView("dashboard")
                }
                type="button"
              >
                {user.name.split(" ")[0]} · {user.role}
              </button>
              <button
                className="iconbtn"
                onClick={signOut}
                aria-label="Sign out"
                type="button"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <button
              className="signin"
              onClick={() => setAuth(true)}
              type="button"
            >
              Sign in
            </button>
          )}
          <button
            className="cartbtn"
            onClick={() => setShowCart(true)}
            type="button"
          >
            <ShoppingBag size={17} /> <span>Basket</span>
            <b>{count}</b>
          </button>
        </div>
      </header>
      {view === "shop" && <nav className="mobile-navigation shell" aria-label="Mobile navigation"><a href="#menu">Order food</a><a href="#story">Our story</a><a href="/support">Support</a><a href="/partner">For restaurants</a></nav>}
      {user?.role==="CUSTOMER"&&<aside className="shell verification-notice" aria-label="Account email verification"><p>{user.emailVerificationRequired&&!user.emailVerifiedAt?"Verify your email before placing a new order. Existing orders remain available.":user.emailVerifiedAt?"Your email is verified.":"Existing account access is preserved; email verification is available."}</p><a className="textlink" href="/verify-email">{user.emailVerificationRequired&&!user.emailVerifiedAt?"Verify account email":"Email and account security"}</a></aside>}

      {view === "shop" ? (
        <>
          <section className="hero shell">
            <div className="hero-copy">
              <div className="eyebrow">
                <span /> LOCAL KITCHENS. A LITTLE MORE JOY.
              </div>
              <h1>
                A little joy,
                <br />{" "}
                <em>in every bite.</em>
              </h1>
              <p>
                Discover the dishes you love, made fresh by kitchens around you
                and delivered with care.
              </p>
              <div className="hero-actions">
                <a className="primary" href="#menu">
                  Order now <ArrowRight size={16} />
                </a>
                <span className="hero-caption">Made for the way you love to eat.</span>
              </div>
              <div className="hero-perks">
                <span>
                  <Clock size={15} /> Follow your order status
                </span>
                <span>
                  <CheckCircle2 size={15} /> Pay on delivery
                </span>
              </div>
              <details className="delivery-availability" onToggle={event=>setShowDeliveryAddress(event.currentTarget.open)}><summary><MapPin size={16}/><span>{postalCode?`Delivery address · ${postalCode}`:"Raichur · Choose your delivery address"}</span></summary>{showDeliveryAddress&&!showCart&&<AddressBook customerId={user?.role==='CUSTOMER'?user.id:undefined} target={target} onChange={changeAddress}/>}<p>Postal coverage, opening hours and the final fee are verified at checkout.</p></details>
            </div>
            <div className="hero-art">
              <span className="hero-edition">THE NEIGHBOURHOOD TABLE / SHAIKH’S</span>
              <div className="hero-orbit orbit-one" />
              <div className="hero-orbit orbit-two" />
             <Image
                 src="/images/hero-biryani.jpg"
                 alt="A bowl of aromatic biryani"
                 width={640} height={480} priority fetchPriority="high" sizes="(max-width: 800px) 90vw, 560px"
              />
              <div className="hero-note"><span>Something good<br/><em>is on the menu.</em></span><ArrowRight size={22}/></div>
              <span className="photo-caption">Food inspiration · illustrative photography</span>
            </div>
          </section>

          <section className="shell trustrow">
            <div>
              <b>01</b>
              <span>Local kitchens</span>
            </div>
            <div>
              <b>02</b>
              <span>Honest ingredients</span>
            </div>
            <div>
              <b>03</b>
              <span>Careful delivery</span>
            </div>
            <div>
              <b>04</b>
              <span>Easy ordering</span>
            </div>
          </section>

          <KitchenDiscovery dishes={filtered} loading={loading} onSelect={id=>navigateCatalog({restaurantId:id,q:null,category:null,cursor:null},true)}/>
          <section className="shell menu-section" id="menu">
            <div className="section-head">
              <div>
                <div className="eyebrow">THE MENU, YOUR WAY</div>
                <h2 id="catalog-heading" tabIndex={-1}>
                  Find your <em>favourite.</em>
                </h2>
                <p>Discover dishes from the current menu. Choose your kitchen, find your flavour.</p>
              </div>
              <div className="searchbox">
                <Search size={17} />
                <input
                  aria-label="Search dishes"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search dishes..." maxLength={100}
                />
              </div>
            </div>

            <nav className="filters" aria-label="Dish categories">
              {categories.map((item) => (
                <button
                  key={item}
                  className={category === item ? "active" : ""}
                  title={item}
                  aria-pressed={category === item}
                  onClick={() => navigateCatalog({category:item==='All'?null:item,q:search.trim()||null,cursor:null})}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </nav>

            <div className="product-grid" aria-busy={loading}>
              {!catalogError && filtered.map((product) => (
                <article className="product-card" key={product.id}>
                  <div className="product-image">
                    {product.imageUrl ? (
                      <Image src={product.imageUrl} alt={product.name} fill sizes="(max-width: 540px) 90vw, (max-width: 800px) 45vw, 380px" />
                    ) : (
                      <div className="image-placeholder">S</div>
                    )}
                    <span className="product-tag">{product.category}</span>
                    <button
                      className="add-round"
                      disabled={loading || additionalStock(product,choices[product.id]??defaultChoice(product),cart)<=0}
                      onClick={() => addToCart(product)}
                      aria-label={"Add " + product.name}
                      type="button"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  <div className="product-info">
                    <div className="product-meta">
                      <span>{product.restaurant?.name ?? "Your kitchen"}</span>
                      <span>{cart[product.id] ? `${cart[product.id]} in basket` : product.category}</span>
                    </div>
                    <h3>{product.name}</h3>
                    <p className="rating-evidence">{product.itemRating?`${product.itemRating.average.toFixed(1)} of 5 / ${product.itemRating.count} approved item reviews`:"No approved item reviews"}{product.restaurantRating?` / Restaurant ${product.restaurantRating.average.toFixed(1)} of 5 (${product.restaurantRating.count})`:" / Restaurant not yet rated"}</p>
                    {((product.itemRating?.count??0)+(product.restaurantRating?.count??0)>0)&&<PublicReviews restaurantId={product.restaurantId} productId={product.id}/>}
                    {stockLimit(product,choices[product.id]??defaultChoice(product))===0&&<span className="stock-badge">Out of stock</span>}<p>{product.description}</p><CatalogOptions product={product} choice={choices[product.id]??defaultChoice(product)} onChange={choice=>setChoices(old=>({...old,[product.id]:choice}))} />
                    <div className="product-bottom">
                      <b>{money(chosenPrice(product,choices[product.id]??defaultChoice(product)))}</b>
                      <button
                        disabled={additionalStock(product,choices[product.id]??defaultChoice(product),cart)<=0}
                        onClick={() => addToCart(product)}
                        type="button"
                      >
                        {stockLimit(product,choices[product.id]??defaultChoice(product))===0?"Out of stock":additionalStock(product,choices[product.id]??defaultChoice(product),cart)<=0?"Limit reached":"Add to basket"} <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {loading && !filtered.length && <div className="menu-skeleton" role="status" aria-label="Loading the menu"><span className="sr-only">Loading the menu…</span>{[1,2,3].map(n=><div className="skeleton-card" aria-hidden="true" key={n}><span/><i/><i/></div>)}</div>}
            {catalogError && <div className="empty error-state" role="alert"><h3>The menu couldn’t load.</h3><p>{catalogError}</p><button className="outline" onClick={() => void load()} type="button">Try again</button></div>}
            <div className="catalog-pagination" aria-label="Menu pages"><button className="outline" type="button" disabled={loading} onClick={()=>navigateCatalog({cursor:null},true)}>First dishes</button>{nextCursor&&<button className="outline" type="button" disabled={loading} onClick={()=>navigateCatalog({cursor:nextCursor},true)}>Next dishes</button>}<label>Filter category<input maxLength={60} value={category==='All'?'':category} placeholder="Category name" onChange={event=>navigateCatalog({category:event.target.value||null,cursor:null})}/></label><p aria-live="polite" aria-atomic="true">{catalogError?"Menu unavailable. Please retry.":`${filtered.length} dishes on this page. Availability is checked again at checkout.`}</p></div>
            {!loading && !catalogError && !filtered.length && (
              <div className="empty">No dishes on this page. Try another search or the next page.</div>
            )}
          </section>

          <section className="shell story" id="story">
            <div className="story-image">
              <Image
                src="/images/masala-dosa.jpg"
                alt="Illustrative food photograph of masala dosa"
                width={600} height={400} sizes="(max-width: 540px) 90vw, 50vw"
                loading="lazy"
              />
            </div>
            <div>
              <div className="eyebrow">A LITTLE ABOUT US</div>
              <h2>
                Good food brings
                <br />
                <em>people together.</em>
              </h2>
              <p>
                Shaikh’s is built around a simple idea: make ordering from
                neighbourhood kitchens feel personal, reliable and full of
                flavour. We’re starting local and building thoughtfully.
              </p>
              <a href="#menu" className="textlink">
                Discover what’s cooking <ArrowRight size={16} />
              </a>
            </div>
          </section>
          <CustomerEditorial/>
        </>
      ) : (
        <section className="shell dashboard">
          <div className="dashhead">
            <div>
              <div className="eyebrow">SHAIKH’S WORKSPACE</div>
              <h1>
                {user?.role === "ADMIN"
                  ? "Platform overview"
                  : user?.role === "RESTAURANT"
                    ? "Restaurant operations"
                    : user?.role === "DELIVERY"
                      ? "Delivery partner"
                      : "Your orders"}
              </h1>
              <p>Welcome back, {user?.name}. Here’s what’s happening.</p>
            </div>
            <button
              className="outline"
              onClick={() => setView("shop")}
              type="button"
            >
              Back to storefront
            </button>
          </div>

          {user && user.role!=="ADMIN"&&<><ReviewCases actorId={user.id}/>{(user.role==="CUSTOMER"||user.role==="RESTAURANT"&&(restaurantContext?.isOwner||restaurantContext?.canOrders))&&<ReviewManagement role={user.role as "CUSTOMER"|"RESTAURANT"}/>}</>}
          {user?.role === "ADMIN" ? (
            <AdminPanel actorId={user.id} />
          ) : user?.role === "RESTAURANT" ? (
            restaurantContext ? <>
              {restaurantContext?.isOwner&&<RestaurantAvailability />}
              <div className="statgrid">
                <div>
                  <small>Orders in this view</small>
                  <b>{orders.length}</b>
                </div>
                <div>
                  <small>Order value in this view</small>
                  <b>
                    {money(
                      orders.reduce(
                        (total, order) => total + Number(order.total),
                        0,
                      ),
                    )}
                  </b>
                </div>
                <div>
                  <small>Menu items on this page</small>
                  <b>{visibleIds.length}</b>
                </div>
              </div>

              {restaurantContext?.canOrders&&<Orders orders={orders} role={user.role} updateStatus={updateStatus} onRefresh={loadOrders} />}
              {restaurantContext?.canMenu&&<InventoryManagement />}
              <ZoneManagement />
              <MenuManagement canEdit={restaurantContext?.canMenu??false} onChange={()=>loadProducts('/api/restaurant/menu')} />
              {restaurantContext?.isOwner&&<><StaffManagement /><RestaurantFinance /><PromotionManagement /></>}
            </> : <section className="panel" role="status"><h2>Restaurant access is unavailable.</h2><p>Review your application or suspension status. Existing orders remain available to authorized administrators and delivery partners.</p><a className="textlink" href="/partner">Review restaurant status</a></section>
          ) : user?.role === "DELIVERY" ? (
            <>
              <div className="statgrid">
                <div>
                  <small>Assigned deliveries</small>
                  <b>{orders.length}</b>
                </div>
                <div>
                  <small>Completed</small>
                  <b>
                    {orders.filter((order) => order.status === "DELIVERED").length}
                  </b>
                </div>
                <div>
                  <small>Availability</small>
                  <b>{isOpen ? "Online" : "Offline"}</b>
                  <button
                    className="outline"
                    style={{ marginTop: 8 }}
                    onClick={toggleDeliveryAvailability}
                    type="button"
                  >
                    {isOpen ? "Go offline" : "Go online"}
                  </button>
                </div>
              </div>
              <Orders
                orders={orders}
                role={user.role}
                updateStatus={updateStatus}
                onRefresh={loadOrders}
              />
              <EarningsPanel key={orders.filter(o=>o.status==="DELIVERED").length} />
            </>
          ) : (
            <>
            <section className="panel management-panel"><a className="textlink" href="/partner">Apply to join as a restaurant</a><h2>Saved addresses</h2><AddressBook checkout={false} customerId={user?.role==='CUSTOMER'?user.id:undefined} target={target} onChange={changeAddress} /></section>
            <Orders
              orders={orders}
              role={user?.role ?? "CUSTOMER"}
              updateStatus={updateStatus}
              onlineEnabled={onlineEnabled}
              onRefresh={loadOrders}
            />
            </>
          )}
        </section>
      )}

      <footer className="footer">
        <div className="shell footinner">
          <div className="brand footbrand">
            <span className="brandmark">S</span>
            <span>
              shaikh’s
              <small>FOOD, WITH HEART</small>
            </span>
          </div>
          <p>Good food. Good people.<br/>Right around the corner.</p>
          <nav className="footer-links" aria-label="Footer"><Link href="/about">About Shaikh’s</Link><Link href="/support">Contact &amp; support</Link><Link href="/partner">Restaurant partners</Link><Link href="/#menu">Order food</Link></nav>
          <span>© 2026 Shaikh’s. Made with care.</span>
        </div>
      </footer>

      {showCart && (
        <div
          className="overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowCart(false);
          }}
        >
          <aside className="drawer" role="dialog" aria-modal="true" aria-label="Your basket" ref={element => { modalRef.current = element; }}>
            <div className="drawerhead">
              <div>
                <div className="eyebrow">YOUR ORDER</div>
                <h2>
                  Your basket <span>({count})</span>
                </h2>
              </div>
              <button
                className="iconbtn"
                onClick={() => setShowCart(false)}
                aria-label="Close basket"
                type="button"
              >
                <X />
              </button>
            </div>

            {basketLoading&&<p role="status">Refreshing basket availability...</p>}{basketError&&<p role="alert">{basketError}</p>}{missingBasketKeys.map(key=><div className="empty" key={key}><p>This saved dish is unavailable. No partial basket will be ordered.</p><button className="outline" type="button" onClick={()=>setCart(old=>{const next={...old};delete next[key];return next;})}>Remove unavailable dish</button></div>)}
            {cartRows.length ? (
              <>
                <div className="cartitems">
                  {cartRows.map((product,index) => (
                    <div className="cartrow" key={product.cartKey}>
                      {product.imageUrl ? (
                        <Image src={product.imageUrl} alt={product.name} width={65} height={65} />
                      ) : (
                        <div className="image-placeholder" aria-hidden="true">
                          S
                        </div>
                      )}
                      <div className="cartdesc">
                        <b>{currentQuote?.replayOnly?currentQuote.lines[index]?.nameSnapshot??product.name:product.name}</b>
                        <small>{money(currentQuote?.lines[index]?.unitPrice??product.price)}</small>{product.stockUnavailable&&!currentQuote?.replayOnly&&<p role="alert">Stock changed. Reduce this item or remove it and choose another option.</p>}{product.optionsUnavailable&&!currentQuote?.replayOnly&&<p role="alert">Options changed. Remove this item and choose again.</p>}
                        <div className="qty">
                          <button
                            onClick={() =>
                              setCart((old) => ({
                                ...old,
                                [product.cartKey]: Math.max(
                                  0,
                                  (old[product.cartKey] ?? 0) - 1,
                                ),
                              }))
                            }
                            aria-label={"Remove one " + product.name}
                            type="button"
                          >
                            <Minus size={13} />
                          </button>
                          <span>{cart[product.cartKey]}</span>
                          <button
                            onClick={() =>
                              setCart((old) => ({
                                ...old,
                                [product.cartKey]: Math.min(20, (old[product.cartKey] ?? 0) + 1),
                              }))
                            }
                            disabled={additionalStock(product,product.selection,cart)<=0||cart[product.cartKey]>=20}
                            aria-label={"Add one " + product.name}
                            type="button"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      </div>
                      <b>{money(currentQuote?.lines[index]?.lineTotal??Number(product.price) * cart[product.cartKey])}</b>
                    </div>
                  ))}
                </div>

                <div className="delivery-input">
                  <AddressBook customerId={user?.role==='CUSTOMER'?user.id:undefined} target={target} onChange={changeAddress} />
                  {quoteBusy&&<p role="status">Checking delivery and updating totals...</p>}
                  {user?.emailVerificationRequired&&!user.emailVerifiedAt&&<p role="status">Verify your email to place this new order. <a className="textlink" href="/verify-email">Open email verification</a>. Your basket is saved.</p>}
                  {quoteError&&<div className="delivery-quote-error" role="alert"><p>{quoteError}</p><button className="outline" type="button" onClick={()=>setQuoteReload(n=>n+1)}>Check delivery again</button></div>}
                  {currentQuote?.replayOnly&&<p role="status">An order already exists for this retry. Confirming reopens it without another stock deduction, redemption or charge.</p>}
                  {currentQuote&&<p className="ops-hint">{currentQuote.zoneName} - {currentQuote.message}</p>}
                </div>

                <div className="payment-method">
                  <label htmlFor="payment-method">Payment method</label>
                  <select id="payment-method" value={paymentMethod} disabled={busy} onChange={event => setPaymentMethod(event.target.value as "CASH_ON_DELIVERY" | "ONLINE")}>
                    <option value="CASH_ON_DELIVERY">Cash on delivery</option>
                    <option value="ONLINE" disabled={!onlineEnabled}>{onlineEnabled ? "Razorpay · Test payment" : "Online payment · Unavailable"}</option>
                  </select>
                  <small>{onlineEnabled ? "Test mode only. No real money will be charged." : "Online payment is currently unavailable. Cash on delivery is available."}</small>
                </div>
                <div className="coupon-entry"><label htmlFor="checkout-coupon">Coupon code</label><input id="checkout-coupon" maxLength={30} value={couponDraft} onChange={e=>setCouponDraft(e.target.value.toUpperCase())}/><div className="commerce-actions"><button className="outline" type="button" onClick={()=>{setCouponCode(couponDraft.trim().toUpperCase());setQuoteReload(n=>n+1);}}>Apply coupon</button><button className="outline" type="button" onClick={()=>{setCouponCode('');setCouponDraft('');}}>Remove coupon</button></div>{couponCode&&<p>Applied request: {couponCode}. One courtesy credit; no stacking. Recorded tax unchanged.</p>}<AvailablePromotions restaurantId={cartRows[0]?.restaurantId??''}/></div>
                <div className="bill">
                  <div>
                    <span>Subtotal</span>
                    <b>{money(currentQuote?.subtotal??subtotal)}</b>
                  </div>
                  <div>
                    <span>Delivery</span>
                    <b>{currentQuote?Number(currentQuote.deliveryFee)===0?"FREE":money(currentQuote.deliveryFee):"Enter postal code"}</b>
                  </div>
                  <div>
                    <span>Taxes (5%)</span>
                    <b>{money(currentQuote?.tax??subtotal * 0.05)}</b>
                  </div>
                  {Number(currentQuote?.discount??0)>0&&<div><span>Courtesy credit (tax unchanged)</span><b>-{money(currentQuote?.discount??0)}</b></div>}
                  <div className="total">
                    <span>Total</span>
                    <b>
                      {currentQuote?money(currentQuote.total):"Delivery not verified"}
                    </b>
                  </div>
                </div>

                <button
                  className="checkout"
                  disabled={basketLoading || !!basketError || missingBasketKeys.length>0 || busy || !currentQuote?.replayOnly&&(!!user?.emailVerificationRequired&&!user.emailVerifiedAt || cartRows.some(row=>row.optionsUnavailable||row.stockUnavailable)) || !!user&&(!currentQuote||quoteBusy) || (paymentMethod === "ONLINE" && !onlineEnabled)}
                  onClick={checkout}
                  type="button"
                >
                  {busy
                    ? "Placing order..."
                    : user
                      ? paymentMethod === "ONLINE" ? "Continue to test payment" : "Place order · Cash on delivery"
                      : "Sign in to continue"}{" "}
                  <ArrowRight size={17} />
                </button>
                <small className="secure-note">
                  {paymentMethod === "ONLINE" ? "Your order is saved once. Payment is confirmed only by the server." : "Pay the rider when your order arrives."}
                </small>
              </>
            ) : (
              <div className="emptycart">
                <ShoppingBag size={34} />
                <h3>Your basket is waiting.</h3>
                <p>Add something delicious to get started.</p>
                <button
                  className="primary"
                  onClick={() => setShowCart(false)}
                  type="button"
                >
                  Explore menu
                </button>
              </div>
            )}
          </aside>
        </div>
      )}

      {auth && (
        <div
          className="overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setAuth(false);
          }}
        >
          <form
            className="authmodal"
            role="dialog"
            aria-modal="true"
            aria-label={registerMode ? "Create account" : "Sign in"}
            ref={element => { modalRef.current = element; }}
            onSubmit={registerMode ? register : signIn}
          >
            <button
              type="button"
              className="modalclose"
              onClick={() => setAuth(false)}
              aria-label="Close sign-in dialog"
            >
              <X />
            </button>
            <div className="brandmark large">S</div>
            <div className="eyebrow">
              {registerMode ? "JOIN THE TABLE" : "WELCOME BACK"}
            </div>
            <h2>
              {registerMode ? "Create your account." : "Good to see you."}
            </h2>
            <p>
              {registerMode
                ? "Create a customer account to order your favourites."
                : "Sign in to order, manage your kitchen or deliver with Shaikh’s."}
            </p>

            {registerMode && (
              <>
                <label htmlFor="register-name">Your name</label>
                <input
                  id="register-name"
                  autoComplete="name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  minLength={2}
                  maxLength={80}
                  required
                />
              </>
            )}

            <label htmlFor="auth-email">Email address</label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              autoComplete={registerMode ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={registerMode ? 10 : 8}
              required
            />

            {!registerMode&&<a className="textlink" href="/recover">Forgot password?</a>}
            <button className="checkout" disabled={busy} type="submit">
              {busy
                ? registerMode
                  ? "Creating account..."
                  : "Signing in..."
                : registerMode
                  ? "Create account"
                  : "Sign in"}{" "}
              <ArrowRight size={17} />
            </button>
            <button
              type="button"
              className="textlink"
              style={{ marginTop: 14, border: 0, background: "transparent" }}
              onClick={() => setRegisterMode((current) => !current)}
            >
              {registerMode
                ? "Already have an account? Sign in"
                : "New to Shaikh’s? Create an account"}
            </button>
          </form>
        </div>
      )}

      {notice && (
        <div className="toast" role="status">
          {notice}
        </div>
      )}
    </main>
  );
}

function Orders({
  orders,
  role,
  updateStatus,
  onlineEnabled = false,
  onRefresh,
}: {
  orders: Order[];
  role: UserRole;
  updateStatus: (id: string, status: OrderStatus) => Promise<void>;
  onlineEnabled?: boolean;
  onRefresh?: () => Promise<void>;
}) {
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const actions: Partial<Record<UserRole, OrderStatus[]>> = {
    RESTAURANT: [
      "ACCEPTED",
      "PREPARING",
      "READY_FOR_PICKUP",
      "CANCELLED",
    ],
    DELIVERY: ["PICKED_UP", "DELIVERED"],
    ADMIN: [
      "ACCEPTED",
      "PREPARING",
      "READY_FOR_PICKUP",
      "PICKED_UP",
      "DELIVERED",
      "CANCELLED",
    ],
  };

  return (
    <div className="panel">
      <div className="panel-title">
        <h2>{role === "CUSTOMER" ? "Your recent orders" : "Live order queue"}</h2>
        {onRefresh && <button type="button" className="outline" onClick={() => void onRefresh()}>Refresh orders</button>}
        <span>{orders.length} orders</span>
      </div>

      {orders.length ? (
        orders.map((order) => (
          <div className="orderrow" key={order.id}>
            <div className="orderleft">
              <b>{order.orderNumber}</b>
              <small>
                {order.restaurant?.name ?? "Shaikh’s Kitchen"} ·{" "}
                {new Date(order.createdAt).toLocaleString()}
              </small>
              <small>
                {order.items
                  ?.map(
                    (item) => `${item.quantity}× ${item.nameSnapshot}`,
                  )
                  .join(", ")}
              </small>
              {Number(order.discount??0)>0&&<small>Courtesy credit: {fmt(order.discount??0)} / {order.promotionSnapshot?.code} (recorded tax unchanged)</small>}
              {role === "CUSTOMER"&&order.deliveryAddress&&<small>Deliver to: {order.deliveryAddress}</small>}
              {role === "DELIVERY" && <div className="delivery-details"><p><b>Pickup</b>{order.restaurant?.name} · {order.restaurant?.address}</p><p><b>Deliver to</b>{order.deliveryAddress}</p>{order.deliveryAddress && <a className="outline" target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.deliveryAddress)}`}>Open delivery directions</a>}<p>{order.deliveryAddressSnapshot?.instructions&&<>Instructions: {order.deliveryAddressSnapshot.instructions}</>}</p><p>{order.paymentMethod === "CASH_ON_DELIVERY" ? `Cash on delivery · ${fmt(order.total)} · ${order.paymentStatus === "PAID" ? "Reconciled" : "Awaiting reconciliation"}` : "Online payment"}</p></div>}
              {order.statusHistory && order.statusHistory.length > 0 && (
                <details className="order-timeline">
                  <summary>Order timeline</summary>
                  <ol>{order.statusHistory.map((event, index) => <li key={index}><span>{event.status.replaceAll("_", " ")}{event.note && <small>{event.note}</small>}</span><time dateTime={event.createdAt}>{new Date(event.createdAt).toLocaleString()}</time></li>)}</ol>
                </details>
              )}
            </div>
            <div className="orderright">
              <b>{fmt(order.total)}</b>
              <span className={"status " + order.status.toLowerCase()}>
                {order.status.replaceAll("_", " ")}
              </span>
              {onRefresh && <OrderOperations order={order} role={role} onRefresh={onRefresh} />}
              {role === "CUSTOMER" && order.paymentMethod === "ONLINE" && <span className="payment-status">{order.paymentStatus === "PAID" ? "Payment verified" : order.paymentStatus === "REFUNDED" ? "Refund verified" : "Payment not confirmed"}</span>}
              {role === "CUSTOMER" && order.paymentMethod === "ONLINE" && order.status === "PLACED" && !["PAID", "REFUNDED"].includes(order.paymentStatus ?? "") && onRefresh && <OnlinePayment orderId={order.id} total={order.total} enabled={onlineEnabled} onRefresh={onRefresh} />}
              {role === "CUSTOMER" && order.status === "PLACED" && (
                cancelId === order.id ? <div className="cancel-confirm" role="group" aria-label={`Cancel order ${order.orderNumber}`}>
                  <p>Cancel before the kitchen accepts?</p>
                  {order.paymentStatus === "PAID" && <p>Any verified payment will need a refund review.</p>}
                  <button className="tinyaction" type="button" disabled={cancelling} onClick={async () => {
                    if (cancelling) return;
                    setCancelling(true);
                    try { await updateStatus(order.id, "CANCELLED"); }
                    finally { setCancelling(false); setCancelId(null); }
                  }}>{cancelling ? "Cancelling…" : "Confirm cancellation"}</button>
                  <button className="tinyaction" type="button" disabled={cancelling} onClick={() => setCancelId(null)}>Keep order</button>
                </div> : <button className="tinyaction" type="button" onClick={() => setCancelId(order.id)}>Cancel order</button>
              )}
              {(actions[role] ?? [])
                .filter(() => !["RESTAURANT", "DELIVERY"].includes(role))
                .filter((status) => canTransition(order.status, status))
                .map((status) => (
                  <button
                    key={status}
                    className="tinyaction"
                    onClick={() => updateStatus(order.id, status)}
                    type="button"
                  >
                    {status.replaceAll("_", " ")}
                  </button>
                ))}
            </div>
          </div>
        ))
      ) : (
        <div className="empty">No orders yet.</div>
      )}
    </div>
  );
}

function AdminPanel({actorId}:{actorId:string}) {
  const [data, setData] = useState<AdminData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [riders, setRiders] = useState<AdminUser[]>([]);
  const [error, setError] = useState("");
  const [receiptOrder, setReceiptOrder] = useState("");
  const [receiptAmount, setReceiptAmount] = useState("");
  const [receiptReference, setReceiptReference] = useState("");
  const [settling, setSettling] = useState(false);
  const [receiptMessage, setReceiptMessage] = useState("");

  async function settle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSettling(true);
    setReceiptMessage("");
    try {
      const response = await fetch(`/api/admin/orders/${receiptOrder}/settle`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: receiptAmount, reference: receiptReference }),
      });
      if (!response.ok) throw new Error(await getErrorMessage(response, "Could not record receipt"));
      setReceiptMessage("Cash receipt recorded. Gross collections updated.");
      setReceiptOrder(""); setReceiptAmount(""); setReceiptReference("");
      await refresh();
    } catch (error) { setReceiptMessage(error instanceof Error ? error.message : "Could not record receipt"); }
    finally { setSettling(false); }
  }

  async function refresh() {
    setError("");
    try {
      const [usersResponse, ordersResponse] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/orders"),
      ]);

      if (!usersResponse.ok) {
        throw new Error(
          await getErrorMessage(usersResponse, "Could not load platform users"),
        );
      }
      if (!ordersResponse.ok) {
        throw new Error(
          await getErrorMessage(ordersResponse, "Could not load platform orders"),
        );
      }

      const usersBody = (await usersResponse.json()) as AdminData;
      const ordersBody = (await ordersResponse.json()) as {
        orders?: Order[];
      };

      setData(usersBody);
      setOrders(ordersBody.orders ?? []);
      setRiders(
        (usersBody.users ?? []).filter(
          (account) => account.role === "DELIVERY" && account.active && account.deliveryProfile?.isOnline,
        ),
      );
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "Could not load platform data",
      );
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function assign(orderId: string, deliveryPartnerId: string) {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryPartnerId }),
      });

      if (!response.ok) {
        window.alert(
          await getErrorMessage(response, "Could not assign delivery partner"),
        );
        return;
      }

      await refresh();
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Could not assign delivery partner",
      );
    }
  }

  if (error) {
    return (
      <div className="panel" role="alert">
        <p>{error}</p>
        <button className="outline" onClick={() => void refresh()} type="button">
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return <div className="panel">Loading platform data…</div>;
  }

  return (
    <>
      <details className="admin-earnings-disclosure"><summary>Postal delivery zones</summary><ZoneManagement admin /></details>
      <details className="admin-earnings-disclosure"><summary>Rider earnings and settlements</summary><EarningsPanel admin /></details>
      <div className="statgrid">
        <div>
          <small>Registered users</small>
          <b>{data.metrics.users}</b>
        </div>
        <div>
          <small>Total orders</small>
          <b>{data.metrics.orders}</b>
        </div>
        <div>
          <small>Paid customer collections (gross)</small>
          <b>{fmt(data.metrics.revenue)}</b>
        </div>
      </div>

      <div className="panel">
        <RestaurantFinance admin />
        <LocalMailPanel />
        <div className="panel-title"><h2>Cash reconciliation</h2><span>Delivered COD orders</span></div>
        {Boolean(data.metrics.paymentReviews) && <p role="alert">{data.metrics.paymentReviews} online payment records need manual review and are excluded from gross collections.</p>}
        {Boolean(data.metrics.pendingRefunds) && <p role="alert">{data.metrics.pendingRefunds} online orders require refund reconciliation.</p>}
        <p className="panel-help">Record cash only after it has been received from the rider. Delivery alone does not count as collected cash. Gross collections are not platform commission revenue.</p>
        <form className="receipt-form" onSubmit={settle}>
          <div className="receipt-field"><label htmlFor="receipt-order">Delivered order</label><select id="receipt-order" required value={receiptOrder} onChange={event => setReceiptOrder(event.target.value)}><option value="">Choose an unpaid order</option>{orders.filter(order => order.status === "DELIVERED" && order.paymentMethod === "CASH_ON_DELIVERY" && order.paymentStatus === "PENDING").map(order => <option key={order.id} value={order.id}>{order.orderNumber} · {fmt(order.total)}</option>)}</select></div>
          <div className="receipt-field"><label htmlFor="receipt-amount">Cash received (INR)</label><input id="receipt-amount" required inputMode="decimal" pattern="[0-9]+(\.[0-9]{1,2})?" value={receiptAmount} onChange={event => setReceiptAmount(event.target.value)} placeholder="0.00" /></div>
          <div className="receipt-field"><label htmlFor="receipt-reference">Receipt reference</label><input id="receipt-reference" required minLength={8} maxLength={100} pattern="[A-Za-z0-9_-]+" value={receiptReference} onChange={event => setReceiptReference(event.target.value)} placeholder="CASH-2026-0001" /></div>
          <button className="primary" disabled={settling || !receiptOrder} type="submit">{settling ? "Recording…" : "Confirm cash received"}</button>
        </form>
        {receiptMessage && <p role="status">{receiptMessage}</p>}
      </div>

      <div className="panel">
        <div className="panel-title">
          <h2>Delivery assignment</h2>
          <span>{orders.length} orders</span>
        </div>
        {orders.map((order) => (
          <div className="listrow" key={order.id}>
            <div>
              <b>
                {order.orderNumber} · {order.restaurant?.name}
              </b>
              <small>
                {order.status.replaceAll("_", " ")} ·{" "}
                {order.deliveryPartner?.name ?? "Unassigned"}{order.deliveryPartnerId ? order.riderAcceptedAt ? " · accepted" : " · awaiting rider response" : ""}
              </small>
            </div>
            <OrderOperations order={order} role="ADMIN" onRefresh={refresh} />
            {["ACCEPTED", "PREPARING", "READY_FOR_PICKUP"].includes(order.status) && (
              <select
                aria-label={"Assign delivery partner for " + order.orderNumber}
                value={order.deliveryPartnerId ?? ""}
                onChange={(event) => {
                  if (event.target.value) {
                    void assign(order.id, event.target.value);
                  }
                }}
              >
                <option value="" disabled>
                  Assign rider
                </option>
                {riders.map((rider) => (
                  <option key={rider.id} value={rider.id}>
                    {rider.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        ))}
      </div>

      <PromotionManagement admin/><ReviewManagement role="ADMIN"/><AdminOperations actorId={actorId} /><ReviewCases admin actorId={actorId} />
    </>
  );
}
