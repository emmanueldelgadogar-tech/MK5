import { useEffect, useRef } from "react";
import lottie from "lottie-web";
import robotAnimation from "../assets/robot-mk5.json";

export default function AsistenteMK5() {
  const ref = useRef(null);

  useEffect(() => {
    const anim = lottie.loadAnimation({
      container: ref.current,
      renderer: "svg",
      loop: true,
      autoplay: true,
      animationData: robotAnimation,
    });

    return () => {
      anim.destroy();
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
