import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import WhatsAppButton from "./components/WhatsAppButton";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);
  return null;
}

import Home from "./pages/Home";
import Catalogo from "./pages/Catalogo";
import Checkout from "./pages/Checkout";
import IA from "./pages/IA";
import ProductoDetalle from "./pages/ProductoDetalle";
import Metricas from "./pages/Metricas";
import Nosotros from "./pages/Nosotros";
import Blog from "./pages/Blog";
import Sucursales from "./pages/Sucursales";
import MetodosPago from "./pages/MetodosPago";
import Terminos from "./pages/Terminos";
import Devoluciones from "./pages/Devoluciones";
import MiCuenta from "./pages/MiCuenta";
import RastrearPedido from "./pages/RastrearPedido";
import Privacidad from "./pages/Privacidad";
import Gracias from "./pages/Gracias";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Header />

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

      <Footer />
      <WhatsAppButton />
    </>
  );
}
