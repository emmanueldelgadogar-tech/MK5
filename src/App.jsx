import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import WhatsAppButton from "./components/WhatsAppButton";
import CookieBanner from "./components/CookieBanner";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);
  return null;
}

// Code-splitting: cada página se carga solo cuando se visita.
// Home se carga eager para que la primera pintura sea instantánea.
import Home from "./pages/Home";

const Catalogo = lazy(() => import("./pages/Catalogo"));
const Checkout = lazy(() => import("./pages/Checkout"));
const IA = lazy(() => import("./pages/IA"));
const ProductoDetalle = lazy(() => import("./pages/ProductoDetalle"));
const Metricas = lazy(() => import("./pages/Metricas"));
const Nosotros = lazy(() => import("./pages/Nosotros"));
const Blog = lazy(() => import("./pages/Blog"));
const Sucursales = lazy(() => import("./pages/Sucursales"));
const MetodosPago = lazy(() => import("./pages/MetodosPago"));
const Terminos = lazy(() => import("./pages/Terminos"));
const Devoluciones = lazy(() => import("./pages/Devoluciones"));
const MiCuenta = lazy(() => import("./pages/MiCuenta"));
const RastrearPedido = lazy(() => import("./pages/RastrearPedido"));
const Privacidad = lazy(() => import("./pages/Privacidad"));
const Gracias = lazy(() => import("./pages/Gracias"));
const NotFound = lazy(() => import("./pages/NotFound"));

function RouteFallback() {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          border: "3px solid #eee",
          borderTopColor: "#eb6b30",
          borderRadius: "50%",
          animation: "mk5-spin 0.8s linear infinite",
        }}
      />
      <style>{`@keyframes mk5-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Header />

      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/ia" element={<IA />} />
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/catalogo/:marca" element={<Catalogo />} />
          <Route path="/:productoSlug/p" element={<ProductoDetalle />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/metricas" element={<Metricas />} />
          <Route path="/nosotros" element={<Nosotros />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/sucursales" element={<Sucursales />} />
          <Route path="/metodos-de-pago" element={<MetodosPago />} />
          <Route path="/terminos" element={<Terminos />} />
          <Route path="/devoluciones" element={<Devoluciones />} />
          <Route path="/mi-cuenta" element={<MiCuenta />} />
          <Route path="/gracias" element={<Gracias />} />
          <Route path="/rastrear-pedido" element={<RastrearPedido />} />
          <Route path="/privacidad" element={<Privacidad />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>

      <Footer />
      <WhatsAppButton />
      <CookieBanner />
    </>
  );
}
