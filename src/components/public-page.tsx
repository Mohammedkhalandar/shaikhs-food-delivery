import Link from 'next/link';
import type {ReactNode} from 'react';

export function PublicPage({children}:{children:ReactNode}){return <main className="editorial-page"><div className="shell"><header><Link className="brand" href="/"><span className="brandmark">S</span><span>shaikh’s<small>FOOD, WITH HEART</small></span></Link><nav aria-label="Main navigation"><Link href="/#menu">Order food</Link><Link href="/about">Our story</Link><Link href="/support">Support</Link><Link href="/partner">Partner with us</Link></nav></header>{children}<footer><Link href="/">Back to Shaikh’s</Link><Link href="/support">Contact &amp; support</Link><Link href="/partner">Restaurant partners</Link><span>Local kitchens. Thoughtful delivery.</span></footer></div></main>;}
