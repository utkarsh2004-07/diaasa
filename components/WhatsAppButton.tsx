"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const WHATSAPP_NUMBER = "918450987174";

export default function WhatsAppButton() {
  const pathname = usePathname();
  const [message, setMessage] = useState("");

  useEffect(() => {
    // If on a product page, include product name in message
    const isProduct = pathname.startsWith("/product/");
    if (isProduct) {
      const productSlug = pathname.split("/product/")[1];
      const productName = productSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      setMessage(`Hi! I'm interested in ordering: ${productName}`);
    } else {
      setMessage("Hi! I'd like to know more about your products.");
    }
  }, [pathname]);

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-5 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-lg hover:scale-110 transition-transform duration-200"
      style={{ backgroundColor: "#25D366" }}
    >
      <svg viewBox="0 0 32 32" width="30" height="30" fill="white" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 2C8.268 2 2 8.268 2 16c0 2.49.648 4.829 1.781 6.858L2 30l7.338-1.758A13.94 13.94 0 0 0 16 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm0 25.5a11.44 11.44 0 0 1-5.834-1.594l-.418-.248-4.352 1.043 1.066-4.24-.272-.435A11.46 11.46 0 0 1 4.5 16C4.5 9.649 9.649 4.5 16 4.5S27.5 9.649 27.5 16 22.351 27.5 16 27.5zm6.29-8.617c-.344-.172-2.036-1.004-2.352-1.118-.316-.115-.546-.172-.776.172-.23.344-.89 1.118-1.09 1.348-.2.23-.4.258-.744.086-.344-.172-1.452-.535-2.766-1.707-1.022-.912-1.712-2.037-1.912-2.381-.2-.344-.021-.53.15-.701.155-.154.344-.402.516-.603.172-.2.23-.344.344-.574.115-.23.058-.43-.029-.603-.086-.172-.776-1.87-1.063-2.561-.28-.672-.564-.581-.776-.592l-.66-.011c-.23 0-.603.086-.918.43-.316.344-1.205 1.177-1.205 2.869s1.233 3.328 1.405 3.558c.172.23 2.427 3.706 5.88 5.196.822.355 1.463.567 1.963.726.824.263 1.574.226 2.167.137.661-.099 2.036-.832 2.323-1.635.287-.803.287-1.491.2-1.635-.086-.143-.316-.23-.66-.402z"/>
      </svg>
    </a>
  );
}
