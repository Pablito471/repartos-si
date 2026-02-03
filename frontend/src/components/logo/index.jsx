"use client";

import Image from "next/image";

/**
 * Logo de Repartos SI
 * @param {string} size - Tamaño: 'sm', 'md', 'lg', 'xl'
 * @param {string} variant - Variante: 'default', 'white', 'dark'
 * @param {string} className - Clases CSS adicionales
 */
export default function Logo({
  size = "md",
  variant = "default",
  className = "",
}) {
  const sizes = {
    sm: { width: 48, height: 48 },
    md: { width: 64, height: 64 },
    lg: { width: 100, height: 100 },
    xl: { width: 150, height: 150 },
  };

  const { width, height } = sizes[size] || sizes.md;

  return (
    <span
      className={`inline-flex items-center ${className}`}
      suppressHydrationWarning
    >
      <Image
        src="/Gemini_Generated_Image_ch7oczch7oczch7o.png"
        alt="Repartos SI Logo"
        width={width}
        height={height}
        className="flex-shrink-0 rounded-2xl"
        priority
      />
    </span>
  );
}

/**
 * Logo simplificado solo icono para favicon y espacios pequeños
 */
export function LogoIcon({ size = 32, className = "" }) {
  return (
    <Image
      src="/Gemini_Generated_Image_ch7oczch7oczch7o.png"
      alt="Repartos SI"
      width={size}
      height={size}
      className={`rounded-2xl ${className}`}
    />
  );
}
