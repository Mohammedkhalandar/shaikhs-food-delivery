/* eslint-disable @next/next/no-page-custom-font -- App Router root layout provides these links globally. */
import type { Metadata, Viewport } from "next";
import {PwaStatus} from '@/components/pwa';
import "./globals.css";
import "./customer-premium.css";
export const metadata:Metadata={title:"Shaikh’s — Food, delivered with care",description:"Discover favourites and order from Shaikh’s.",applicationName:"Shaikh's"};
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#b44316'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><head><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500;1,600&display=swap"/><link rel="manifest" href="/manifest.webmanifest"/><link rel="icon" href="/icons/icon-192.png" type="image/png"/><link rel="apple-touch-icon" href="/icons/icon-192.png"/><meta name="apple-mobile-web-app-capable" content="yes"/><meta name="mobile-web-app-capable" content="yes"/></head><body><PwaStatus/>{children}</body></html>}
