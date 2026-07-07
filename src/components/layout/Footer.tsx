import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-card/40 backdrop-blur-md">
      {/* Decorative Madhubani border line */}
      <div className="h-[2px] w-full bg-foreground" />
      <div className="h-[1px] w-full bg-foreground mt-[2px] opacity-40" />

      <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          
          {/* Brand block */}
          <div className="flex flex-col gap-4">
            <span className="font-serif text-2xl font-bold tracking-widest text-madhubani-terracotta dark:text-madhubani-mustard">
              MITHILA
            </span>
            <p className="font-sans text-sm leading-relaxed text-foreground/75">
              Preserving and presenting the authentic heritage of Madhubani (Mithila) art. Every painting is hand-colored with natural pigments on handmade paper, supporting traditional artisans in Bihar.
            </p>
            <div className="mt-2 text-xs font-semibold uppercase tracking-wider text-foreground/50">
              Mithila, Bihar, India
            </div>
          </div>

          {/* Curations */}
          <div className="flex flex-col gap-4">
            <h3 className="font-serif text-base font-bold tracking-wide uppercase text-madhubani-terracotta dark:text-madhubani-mustard">
              Curations
            </h3>
            <ul className="flex flex-col gap-2.5 font-sans text-sm text-foreground/80">
              <li>
                <Link href="/gallery?category=bharni" className="hover:text-accent transition-colors">
                  Bharni Style (Filled Color)
                </Link>
              </li>
              <li>
                <Link href="/gallery?category=kachni" className="hover:text-accent transition-colors">
                  Kachni Style (Line Hatching)
                </Link>
              </li>
              <li>
                <Link href="/gallery?category=godna" className="hover:text-accent transition-colors">
                  Godna Style (Tattoo Art)
                </Link>
              </li>
              <li>
                <Link href="/gallery?category=kohbar" className="hover:text-accent transition-colors">
                  Kohbar (Nuptial Chamber Art)
                </Link>
              </li>
            </ul>
          </div>

          {/* Heritage */}
          <div className="flex flex-col gap-4">
            <h3 className="font-serif text-base font-bold tracking-wide uppercase text-madhubani-terracotta dark:text-madhubani-mustard">
              Heritage
            </h3>
            <ul className="flex flex-col gap-2.5 font-sans text-sm text-foreground/80">
              <li>
                <Link href="/about" className="hover:text-accent transition-colors">
                  Techniques & Materials
                </Link>
              </li>
              <li>
                <Link href="/about#history" className="hover:text-accent transition-colors">
                  History of Mithila Art
                </Link>
              </li>
              <li>
                <Link href="/artists" className="hover:text-accent transition-colors">
                  Meet the Artisans
                </Link>
              </li>
              <li>
                <Link href="/blogs" className="hover:text-accent transition-colors">
                  Chronicles Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter / Hours */}
          <div className="flex flex-col gap-4">
            <h3 className="font-serif text-base font-bold tracking-wide uppercase text-madhubani-terracotta dark:text-madhubani-mustard">
              Exhibition Hours
            </h3>
            <p className="font-sans text-sm text-foreground/80 leading-relaxed">
              Our digital showroom is open 24/7.<br />
              Artisan workshops: 09:00 - 18:00 IST.<br />
              Certificate Authenticity provided with all shipments.
            </p>
            {/* Newsletter form */}
            <div className="flex flex-col gap-2">
              <label htmlFor="footer-email" className="font-sans text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                Subscribe to Chronicles
              </label>
              <div className="flex">
                <input
                  type="email"
                  id="footer-email"
                  placeholder="Enter email address"
                  className="w-full border border-border bg-background px-4 py-2 text-xs font-sans rounded-l-md focus:outline-none focus:border-accent"
                />
                <button className="clickable bg-madhubani-terracotta text-white dark:bg-madhubani-mustard dark:text-madhubani-soot px-4 py-2 text-xs font-serif rounded-r-md hover:opacity-90 transition-all">
                  Join
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between text-xs text-foreground/50">
          <p>© {new Date().getFullYear()} Mithila Heritage Gallery. All rights reserved.</p>
          <div className="flex gap-6 font-sans">
            <Link href="/privacy" className="hover:text-accent transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-accent transition-colors">
              Terms & Conditions
            </Link>
            <Link href="/shipping" className="hover:text-accent transition-colors">
              Shipping & Returns
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
