"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X } from "lucide-react";

const WHATSAPP_NUMBER = "+50374877792"; // San Benito location
const DEFAULT_MESSAGE = "Hola! Me gustaria hacer una consulta...";

interface WhatsAppButtonProps {
  message?: string;
  showTooltip?: boolean;
}

export default function WhatsAppButton({
  message = DEFAULT_MESSAGE,
  showTooltip = true,
}: WhatsAppButtonProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Show button after user scrolls a bit
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      }
    };

    // Also show after 5 seconds regardless
    const timer = setTimeout(() => setIsVisible(true), 5000);

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    // Show tooltip bubble after button appears
    if (isVisible && showTooltip && !dismissed) {
      const timer = setTimeout(() => setShowBubble(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, showTooltip, dismissed]);

  const handleClick = () => {
    const url = `https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowBubble(false);
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          className="fixed bottom-6 left-6 z-50 flex items-end gap-3"
        >
          {/* Tooltip Bubble */}
          <AnimatePresence>
            {showBubble && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="relative bg-[#252320] border border-[#3D3936] p-4 max-w-[200px]"
              >
                <button
                  onClick={handleDismiss}
                  className="absolute top-2 right-2 text-[#6B6560] hover:text-[#FFF8F0] transition-colors"
                  aria-label="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
                <p className="text-[#FFF8F0] text-sm font-medium mb-1">
                  Necesitas ayuda?
                </p>
                <p className="text-[#6B6560] text-xs">
                  Chatea con nosotros por WhatsApp
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* WhatsApp Button */}
          <button
            onClick={handleClick}
            className="w-14 h-14 bg-[#25D366] hover:bg-[#20BD5A] text-white flex items-center justify-center transition-colors shadow-lg hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 focus-visible:ring-offset-[#2D2A26]"
            aria-label="Contactar por WhatsApp"
          >
            <MessageCircle className="w-7 h-7" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
