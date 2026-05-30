/**
 * App.jsx
 * ────────
 * Velour storefront + chat widget + admin dashboard.
 * Admin is accessible via the 🔑 icon in the nav bar.
 */

import { useState, useEffect } from "react";
import ChatWidget from "@/components/chat/ChatWidget";
import ChatButton from "@/components/chat/ChatButton";
import Toast from "@/components/ui/Toast";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { useToast } from "@/hooks/useToast";

// ── Static Data ───────────────────────────────
const PRODUCTS = [
  { id: 1, name: "Ivory Linen Co-ord Set",  price: 2499, originalPrice: 3299, tag: "Bestseller", category: "Co-ords",   rating: 4.8, reviews: 312, img: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&q=80" },
  { id: 2, name: "Rust Wrap Midi Dress",    price: 1899, originalPrice: 2599, tag: "New",        category: "Dresses",   rating: 4.6, reviews: 187, img: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&q=80" },
  { id: 3, name: "Sage Linen Trousers",     price: 1299, originalPrice: 1799, tag: "Sale",       category: "Bottoms",   rating: 4.7, reviews: 241, img: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&q=80" },
  { id: 4, name: "Ecru Puff Sleeve Blouse", price: 1499, originalPrice: 1999, tag: "Trending",   category: "Tops",      rating: 4.5, reviews: 156, img: "https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=400&q=80" },
  { id: 5, name: "Black Tailored Blazer",   price: 3299, originalPrice: 4299, tag: "Premium",    category: "Outerwear", rating: 4.9, reviews: 428, img: "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=400&q=80" },
  { id: 6, name: "Terracotta Wrap Skirt",   price: 999,  originalPrice: 1499, tag: "Sale",       category: "Bottoms",   rating: 4.4, reviews: 203, img: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=400&q=80" },
];
const COLLECTIONS = [
  { name: "Summer Linen",  subtitle: "Light & Breathable",  img: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&q=80", count: "48 styles" },
  { name: "Office Chic",   subtitle: "Power Dressing",      img: "https://images.unsplash.com/photo-1551232864-3f0890e580d9?w=600&q=80", count: "32 styles" },
  { name: "Weekend Edit",  subtitle: "Effortlessly Casual", img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80", count: "56 styles" },
];
const REVIEWS = [
  { name: "Priya S.",  city: "Mumbai",    text: "The linen co-ord set is absolutely stunning. Quality feels premium and the fit is perfect!", product: "Ivory Linen Co-ord Set" },
  { name: "Ananya R.", city: "Bangalore", text: "Fast delivery and the packaging was gorgeous. The wrap dress is even prettier in person!", product: "Rust Wrap Midi Dress" },
  { name: "Divya M.",  city: "Delhi",     text: "The blazer is worth every rupee — impeccable construction and timeless design.", product: "Black Tailored Blazer" },
];
const HERO_SLIDES = [
  { headline: "New Season,\nNew You.",   sub: "Discover our Summer Linen Collection",   cta: "Shop Now",        bg: "linear-gradient(135deg,#F5EFE6 0%,#E8DDD0 100%)", accent: "#8B6F5C" },
  { headline: "Effortless\nElegance.",   sub: "Premium co-ords & statement dresses",    cta: "Explore",         bg: "linear-gradient(135deg,#E8EEE6 0%,#D4DDD2 100%)", accent: "#5A7A5C" },
  { headline: "Office\nReady.",          sub: "Power dressing for the modern woman",    cta: "Shop Collection", bg: "linear-gradient(135deg,#EAE8F0 0%,#D8D4E8 100%)", accent: "#6B5A8B" },
];
const TAG_COLORS = { Sale:"#C44B4B", New:"#4B7AC4", Premium:"#D4AF37", Bestseller:"#1A1A1A", Trending:"#1A1A1A" };

// ─────────────────────────────────────────────
export default function App() {
  const [chatOpen, setChatOpen]   = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [wishlist, setWishlist]   = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [activeNav, setActiveNav] = useState("Women");
  const [heroSlide, setHeroSlide] = useState(0);
  const { toast, showToast, clearToast } = useToast();

  useEffect(() => {
    const t = setInterval(() => setHeroSlide((s) => (s + 1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);

  const toggleWishlist = (id) =>
    setWishlist((w) => w.includes(id) ? w.filter((x) => x !== id) : [...w, id]);
  const addToCart = (name) => { setCartCount((c) => c + 1); showToast(`${name} added to cart!`); };

  const slide = HERO_SLIDES[heroSlide];

  return (
    <div style={{ fontFamily:"'Playfair Display','Georgia',serif", background:"#FAFAF8", minHeight:"100vh", overflowX:"hidden" }}>
      <GlobalStyles />
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={clearToast} />}

      {/* ── Navigation ─────────────────────── */}
      <nav style={{ position:"sticky", top:0, zIndex:100, background:"rgba(250,250,248,0.97)", backdropFilter:"blur(8px)", borderBottom:"1px solid #EBEBEB" }}>
        <div style={{ maxWidth:1280, margin:"0 auto", padding:"0 24px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", height:64 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:32, height:32, background:"#1A1A1A", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <span style={{ color:"#fff", fontSize:14, fontWeight:700 }}>V</span>
              </div>
              <span style={{ fontSize:22, fontWeight:700, letterSpacing:"-0.02em", color:"#1A1A1A" }}>Velour</span>
            </div>
            <div style={{ display:"flex", gap:28, alignItems:"center" }}>
              {["Women","Men","New In","Sale","Collections"].map((n) => (
                <span key={n} className={`nav-link${activeNav===n?" active":""}`} onClick={() => setActiveNav(n)}>{n}</span>
              ))}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:18 }}>
              <svg style={{ cursor:"pointer", color:"#555" }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <svg style={{ cursor:"pointer", color:"#555" }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              <div style={{ position:"relative", cursor:"pointer" }} onClick={() => showToast("Cart opened!")}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                {cartCount>0 && <span style={{ position:"absolute", top:-6, right:-6, background:"#C44B4B", color:"#fff", borderRadius:"50%", width:16, height:16, fontSize:10, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"DM Sans", fontWeight:600 }}>{cartCount}</span>}
              </div>
              {/* Admin icon */}
              <button onClick={() => setAdminOpen(true)} title="Admin Dashboard" style={{ background:"none", border:"none", cursor:"pointer", padding:2, display:"flex", alignItems:"center" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#AAA" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────── */}
      <section key={heroSlide} className="hero-fade" style={{ background:slide.bg, minHeight:560, display:"flex", alignItems:"center", padding:"60px 24px" }}>
        <div style={{ maxWidth:1280, margin:"0 auto", width:"100%", display:"grid", gridTemplateColumns:"1fr 1fr", gap:48, alignItems:"center" }}>
          <div>
            <div className="dm" style={{ fontSize:12, fontWeight:600, letterSpacing:"0.15em", textTransform:"uppercase", color:slide.accent, marginBottom:16 }}>✦ Summer 2025 Collection</div>
            <h1 style={{ fontSize:"clamp(42px,6vw,72px)", fontWeight:700, color:"#1A1A1A", lineHeight:1.05, marginBottom:20, whiteSpace:"pre-line" }}>{slide.headline}</h1>
            <p className="dm" style={{ fontSize:18, color:"#666", marginBottom:36, fontWeight:300 }}>{slide.sub}</p>
            <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
              <button className="btn-primary" style={{ padding:"14px 36px", fontSize:14, borderRadius:4 }}>{slide.cta} →</button>
              <button className="btn-outline" style={{ padding:"14px 28px", fontSize:14, borderRadius:4 }}>View Lookbook</button>
            </div>
            <div className="dm" style={{ marginTop:40, display:"flex", gap:32 }}>
              {[["10K+","Happy Customers"],["500+","Styles"],["Free","Returns"]].map(([n,l]) => (
                <div key={l}><div style={{ fontSize:22, fontWeight:700, color:"#1A1A1A" }}>{n}</div><div style={{ fontSize:12, color:"#888", marginTop:2 }}>{l}</div></div>
              ))}
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {PRODUCTS.slice(0,4).map((p) => (
              <div key={p.id} className="hover-lift" style={{ borderRadius:8, overflow:"hidden" }}>
                <img src={p.img} alt={p.name} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Marquee ─────────────────────────── */}
      <div style={{ background:"#1A1A1A", color:"#fff", padding:"12px 0", overflow:"hidden" }}>
        <div className="dm" style={{ display:"flex", gap:60, animation:"marquee 20s linear infinite", whiteSpace:"nowrap", fontSize:12, fontWeight:500, letterSpacing:"0.12em", textTransform:"uppercase" }}>
          {Array(6).fill(["Free Shipping Above ₹999","Easy 30-Day Returns","Sizes XS–3XL","New Arrivals Every Week","10,000+ Happy Customers"]).flat().map((t,i) => (
            <span key={i}>✦ {t}</span>
          ))}
        </div>
      </div>

      {/* ── Categories ──────────────────────── */}
      <section style={{ padding:"64px 24px 32px", maxWidth:1280, margin:"0 auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:40 }}>
          <div>
            <p className="dm" style={{ fontSize:12, fontWeight:600, letterSpacing:"0.15em", textTransform:"uppercase", color:"#9B8878", marginBottom:8 }}>Browse by category</p>
            <h2 style={{ fontSize:"clamp(28px,4vw,40px)", fontWeight:600, color:"#1A1A1A" }}>Shop by Style</h2>
          </div>
          <span className="dm" style={{ fontSize:14, color:"#666", cursor:"pointer", textDecoration:"underline" }}>View All →</span>
        </div>
        <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
          {["All","Dresses","Co-ords","Tops","Bottoms","Outerwear","Occasion Wear"].map((c,i) => (
            <button key={c} className="dm" style={{ padding:"10px 20px", borderRadius:40, border:i===0?"none":"1.5px solid #DDD", background:i===0?"#1A1A1A":"transparent", color:i===0?"#fff":"#555", fontSize:13, fontWeight:500, cursor:"pointer", transition:"all 0.2s" }}>{c}</button>
          ))}
        </div>
      </section>

      {/* ── Products ────────────────────────── */}
      <section style={{ padding:"0 24px 80px", maxWidth:1280, margin:"0 auto" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:24 }}>
          {PRODUCTS.map((p) => (
            <div key={p.id} className="product-card hover-lift" style={{ boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
              <div style={{ position:"relative", overflow:"hidden" }}>
                <img src={p.img} alt={p.name} className="product-img" />
                <span className="tag" style={{ position:"absolute", top:12, left:12, background:TAG_COLORS[p.tag]||"#1A1A1A", color:"#fff" }}>{p.tag}</span>
                <button onClick={() => toggleWishlist(p.id)} style={{ position:"absolute", top:12, right:12, background:"#fff", border:"none", borderRadius:"50%", width:36, height:36, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", boxShadow:"0 2px 8px rgba(0,0,0,0.1)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={wishlist.includes(p.id)?"#C44B4B":"none"} stroke={wishlist.includes(p.id)?"#C44B4B":"#666"} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                </button>
                <button className="btn-primary dm add-to-cart-btn" onClick={() => addToCart(p.name)} style={{ position:"absolute", bottom:0, left:0, right:0, padding:"12px", fontSize:13, borderRadius:0, opacity:0, transition:"opacity 0.25s" }}>Add to Cart</button>
              </div>
              <div style={{ padding:"16px 16px 20px" }}>
                <div className="dm" style={{ fontSize:11, fontWeight:500, color:"#9B8878", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:4 }}>{p.category}</div>
                <h3 style={{ fontSize:16, fontWeight:600, color:"#1A1A1A", marginBottom:8 }}>{p.name}</h3>
                <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:10 }}>
                  {Array(5).fill(0).map((_,i) => <span key={i} style={{ color:"#D4AF37", fontSize:12, opacity:i<Math.floor(p.rating)?1:0.3 }}>★</span>)}
                  <span className="dm" style={{ fontSize:12, color:"#888", marginLeft:4 }}>({p.reviews})</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:18, fontWeight:700, color:"#1A1A1A", fontFamily:"DM Sans" }}>₹{p.price.toLocaleString()}</span>
                  <span className="dm" style={{ fontSize:14, color:"#AAA", textDecoration:"line-through" }}>₹{p.originalPrice.toLocaleString()}</span>
                  <span className="dm" style={{ fontSize:12, fontWeight:600, color:"#4B8A4B" }}>{Math.round((1-p.price/p.originalPrice)*100)}% OFF</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Collections ─────────────────────── */}
      <section style={{ background:"#F5F0E8", padding:"80px 24px" }}>
        <div style={{ maxWidth:1280, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:48 }}>
            <p className="dm" style={{ fontSize:12, fontWeight:600, letterSpacing:"0.15em", textTransform:"uppercase", color:"#9B8878", marginBottom:8 }}>Curated for you</p>
            <h2 style={{ fontSize:"clamp(28px,4vw,40px)", fontWeight:600, color:"#1A1A1A" }}>Trending Collections</h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
            {COLLECTIONS.map((c) => (
              <div key={c.name} className="hover-lift" style={{ position:"relative", overflow:"hidden", borderRadius:8, height:420, cursor:"pointer" }}>
                <img src={c.img} alt={c.name} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block", transition:"transform 0.5s ease" }}
                  onMouseEnter={(e)=>(e.currentTarget.style.transform="scale(1.06)")}
                  onMouseLeave={(e)=>(e.currentTarget.style.transform="scale(1)")} />
                <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(0,0,0,0.55) 0%,transparent 50%)", display:"flex", flexDirection:"column", justifyContent:"flex-end", padding:24 }}>
                  <div className="dm" style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.7)", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:4 }}>{c.subtitle}</div>
                  <h3 style={{ fontSize:26, fontWeight:700, color:"#fff", marginBottom:6 }}>{c.name}</h3>
                  <div className="dm" style={{ fontSize:13, color:"rgba(255,255,255,0.8)", marginBottom:16 }}>{c.count}</div>
                  <button className="dm" style={{ background:"rgba(255,255,255,0.15)", backdropFilter:"blur(4px)", border:"1px solid rgba(255,255,255,0.4)", color:"#fff", padding:"10px 20px", borderRadius:4, cursor:"pointer", fontSize:13, fontWeight:500, width:"fit-content" }}>Shop Now →</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── USPs ───────────────────────────── */}
      <section style={{ padding:"64px 24px", maxWidth:1280, margin:"0 auto" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:24 }}>
          {[{icon:"🚚",title:"Free Shipping",desc:"On orders above ₹999"},{icon:"🔄",title:"Easy Returns",desc:"30-day hassle-free returns"},{icon:"🔒",title:"Secure Payment",desc:"100% protected checkout"},{icon:"💎",title:"Premium Quality",desc:"Ethically sourced fabrics"}].map((u) => (
            <div key={u.title} style={{ textAlign:"center", padding:"32px 20px", borderRadius:8, background:"#FAFAF8", border:"1px solid #EBEBEB" }}>
              <div style={{ fontSize:32, marginBottom:12 }}>{u.icon}</div>
              <h4 style={{ fontSize:16, fontWeight:600, color:"#1A1A1A", marginBottom:6 }}>{u.title}</h4>
              <p className="dm" style={{ fontSize:13, color:"#888" }}>{u.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Reviews ─────────────────────────── */}
      <section style={{ background:"#1A1A1A", padding:"80px 24px" }}>
        <div style={{ maxWidth:1280, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:48 }}>
            <p className="dm" style={{ fontSize:12, fontWeight:600, letterSpacing:"0.15em", textTransform:"uppercase", color:"#C8B89A", marginBottom:8 }}>What our customers say</p>
            <h2 style={{ fontSize:40, fontWeight:700, color:"#fff" }}>Loved by Thousands</h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:24 }}>
            {REVIEWS.map((r) => (
              <div key={r.name} style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, padding:"28px 24px" }}>
                <div style={{ display:"flex", gap:4, marginBottom:16 }}>{Array(5).fill(0).map((_,i)=><span key={i} style={{ color:"#D4AF37", fontSize:14 }}>★</span>)}</div>
                <p className="dm" style={{ fontSize:15, color:"rgba(255,255,255,0.8)", lineHeight:1.6, marginBottom:20, fontStyle:"italic" }}>"{r.text}"</p>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:40, height:40, borderRadius:"50%", background:"#C8B89A", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, color:"#1A1A1A" }}>{r.name[0]}</div>
                  <div>
                    <div style={{ fontWeight:600, color:"#fff", fontSize:14 }}>{r.name}</div>
                    <div className="dm" style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>{r.city} · {r.product}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Newsletter ──────────────────────── */}
      <section style={{ padding:"80px 24px", textAlign:"center", background:"#F5F0E8" }}>
        <div style={{ maxWidth:560, margin:"0 auto" }}>
          <p className="dm" style={{ fontSize:12, fontWeight:600, letterSpacing:"0.15em", textTransform:"uppercase", color:"#9B8878", marginBottom:12 }}>Exclusive access</p>
          <h2 style={{ fontSize:36, fontWeight:700, color:"#1A1A1A", marginBottom:12 }}>Join the Velour Club</h2>
          <p className="dm" style={{ fontSize:16, color:"#666", marginBottom:32, fontWeight:300 }}>Get 10% off your first order, early access to sales, and styling tips straight to your inbox.</p>
          <div style={{ display:"flex", maxWidth:480, margin:"0 auto", borderRadius:4, overflow:"hidden", border:"1.5px solid #1A1A1A" }}>
            <input type="email" placeholder="Enter your email address" className="dm" style={{ flex:1, padding:"14px 18px", fontSize:14, background:"#fff", color:"#1A1A1A", border:"none", outline:"none", fontFamily:"'DM Sans',sans-serif" }} />
            <button className="btn-primary dm" style={{ padding:"14px 24px", fontSize:13, borderRadius:0, whiteSpace:"nowrap" }} onClick={() => showToast("You're on the list! 🎉")}>Subscribe</button>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────── */}
      <footer style={{ background:"#111", color:"rgba(255,255,255,0.7)", padding:"48px 24px 24px" }}>
        <div style={{ maxWidth:1280, margin:"0 auto" }}>
          <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", gap:48, marginBottom:48 }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
                <div style={{ width:28, height:28, background:"#C8B89A", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <span style={{ color:"#111", fontSize:13, fontWeight:700 }}>V</span>
                </div>
                <span style={{ fontSize:20, fontWeight:700, color:"#fff" }}>Velour</span>
              </div>
              <p className="dm" style={{ fontSize:13, lineHeight:1.7, maxWidth:260 }}>Premium women's fashion crafted with care. Celebrating every woman's unique style story.</p>
            </div>
            {[["Shop",["Women","Men","New Arrivals","Sale","Lookbook"]],["Help",["Shipping","Returns","Size Guide","Track Order","FAQ"]],["Company",["About Us","Careers","Sustainability","Press","Contact"]]].map(([title,links]) => (
              <div key={title}>
                <h5 className="dm" style={{ fontWeight:600, color:"#fff", fontSize:13, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:16 }}>{title}</h5>
                {links.map((l)=><div key={l} className="dm" style={{ fontSize:13, marginBottom:10, cursor:"pointer" }}>{l}</div>)}
              </div>
            ))}
          </div>
          <div style={{ borderTop:"1px solid rgba(255,255,255,0.1)", paddingTop:24, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <p className="dm" style={{ fontSize:12 }}>© 2025 Velour. All rights reserved.</p>
            <p className="dm" style={{ fontSize:12 }}>Made with ♥ in India</p>
          </div>
        </div>
      </footer>

      {/* ── Chat ────────────────────────────── */}
      <ChatButton isOpen={chatOpen} onClick={() => setChatOpen((o) => !o)} />
      {chatOpen && <ChatWidget onClose={() => setChatOpen(false)} />}

      {/* ── Admin ───────────────────────────── */}
      {adminOpen && <AdminDashboard onClose={() => setAdminOpen(false)} />}
    </div>
  );
}

function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500&display=swap');
      * { box-sizing: border-box; margin: 0; padding: 0; }
      .dm { font-family: 'DM Sans', sans-serif; }
      .hover-lift { transition: transform 0.25s ease, box-shadow 0.25s ease; }
      .hover-lift:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.10); }
      .btn-primary { background: #1A1A1A; color: #fff; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; font-weight: 500; letter-spacing: 0.05em; transition: background 0.2s; }
      .btn-primary:hover { background: #333; }
      .btn-outline { background: transparent; color: #1A1A1A; border: 1.5px solid #1A1A1A; cursor: pointer; font-family: 'DM Sans', sans-serif; font-weight: 500; transition: all 0.2s; }
      .btn-outline:hover { background: #1A1A1A; color: #fff; }
      .tag { font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; padding: 3px 8px; border-radius: 3px; }
      .nav-link { font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; cursor: pointer; padding: 6px 2px; border-bottom: 2px solid transparent; transition: border-color 0.2s, color 0.2s; color: #444; }
      .nav-link:hover, .nav-link.active { color: #1A1A1A; border-color: #1A1A1A; }
      .product-img { width: 100%; aspect-ratio: 3/4; object-fit: cover; display: block; transition: transform 0.4s ease; }
      .product-card { overflow: hidden; border-radius: 8px; background: #fff; cursor: pointer; }
      .product-card:hover .product-img { transform: scale(1.04); }
      .product-card:hover .add-to-cart-btn { opacity: 1 !important; }
      .hero-fade { animation: heroFade 0.8s ease; }
      @keyframes heroFade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
    `}</style>
  );
}
