import { useEffect, useRef } from "react";
import lottie from "lottie-web";

export default function AsistenteMK5() {
  const ref = useRef(null);

  useEffect(() => {
    let anim;

    // ✅ Carga el JSON como archivo (Vite OK)
    fetch(new URL("../assets/robot-mk5.json", import.meta.url))
      .then((r) => r.json())
      .then((animationData) => {
        anim = lottie.loadAnimation({
          container: ref.current,
          renderer: "svg",
          loop: true,
          autoplay: true,
          animationData,
        });
      })
      .catch((e) => console.error("Error cargando Lottie JSON:", e));

    return () => {
      if (anim) anim.destroy();
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{
        width: 170,
        height: 130,
        overflow: "hidden",
      }}
    />
  );
}
