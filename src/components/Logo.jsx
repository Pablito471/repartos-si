"use client";

/**
 * Logo de Repartos SI
 * @param {string} size - Tamaño: 'sm', 'md', 'lg', 'xl'
 * @param {boolean} showText - Mostrar texto del nombre
 * @param {string} variant - Variante: 'default', 'white', 'dark'
 */
export default function Logo({
  size = "md",
  showText = true,
  variant = "default",
}) {
  const sizes = {
    sm: { icon: 32, text: "text-lg", gap: "gap-1.5" },
    md: { icon: 40, text: "text-xl", gap: "gap-2" },
    lg: { icon: 52, text: "text-2xl", gap: "gap-2.5" },
    xl: { icon: 72, text: "text-4xl", gap: "gap-3" },
  };

  const variants = {
    default: {
      primary: "#3B82F6", // blue-500
      secondary: "#1D4ED8", // blue-700
      accent: "#F97316", // orange-500
      text: "text-gray-800",
      subtext: "text-blue-600",
    },
    white: {
      primary: "#FFFFFF",
      secondary: "#E2E8F0",
      accent: "#F97316",
      text: "text-white",
      subtext: "text-blue-200",
    },
    dark: {
      primary: "#1F2937",
      secondary: "#374151",
      accent: "#F97316",
      text: "text-gray-800",
      subtext: "text-gray-600",
    },
  };

  const { icon: iconSize, text: textSize, gap } = sizes[size] || sizes.md;
  const colors = variants[variant] || variants.default;

  // ID único pero estático para el gradiente
  const gradientId = `logo-gradient-${variant}`;

  return (
    <span
      className={`inline-flex items-center ${gap}`}
      suppressHydrationWarning
    >
      {/* Logo Icon SVG */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
        suppressHydrationWarning
      >
        {/* Background Circle */}
        <circle
          cx="32"
          cy="32"
          r="30"
          fill={`url(#${gradientId})`}
          stroke={colors.accent}
          strokeWidth="2"
        />

        {/* Truck Body */}
        <rect
          x="12"
          y="26"
          width="24"
          height="16"
          rx="2"
          fill="white"
          opacity="0.95"
        />

        {/* Truck Cabin */}
        <path
          d="M36 30 L44 30 L48 36 L48 42 L36 42 Z"
          fill="white"
          opacity="0.95"
        />

        {/* Window */}
        <path
          d="M38 32 L43 32 L46 36 L46 38 L38 38 Z"
          fill={colors.primary}
          opacity="0.7"
        />

        {/* Wheels */}
        <circle cx="20" cy="44" r="5" fill={colors.secondary} />
        <circle cx="20" cy="44" r="2.5" fill="white" />
        <circle cx="42" cy="44" r="5" fill={colors.secondary} />
        <circle cx="42" cy="44" r="2.5" fill="white" />

        {/* Package on truck */}
        <rect x="16" y="20" width="10" height="8" rx="1" fill={colors.accent} />
        <line
          x1="21"
          y1="20"
          x2="21"
          y2="28"
          stroke="white"
          strokeWidth="1.5"
        />
        <line
          x1="16"
          y1="24"
          x2="26"
          y2="24"
          stroke="white"
          strokeWidth="1.5"
        />

        {/* Speed Lines */}
        <line
          x1="6"
          y1="32"
          x2="10"
          y2="32"
          stroke={colors.accent}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="4"
          y1="36"
          x2="9"
          y2="36"
          stroke={colors.accent}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="6"
          y1="40"
          x2="10"
          y2="40"
          stroke={colors.accent}
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Checkmark badge */}
        <circle cx="50" cy="18" r="10" fill={colors.accent} />
        <path
          d="M45 18 L48 21 L55 14"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Gradient Definition */}
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.primary} />
            <stop offset="100%" stopColor={colors.secondary} />
          </linearGradient>
        </defs>
      </svg>

      {/* Text */}
      {showText && (
        <span className="flex flex-col leading-none">
          <span
            className={`font-extrabold ${textSize} ${colors.text} tracking-tight`}
          >
            Repartos
          </span>
          <span
            className={`font-bold ${size === "sm" ? "text-xs" : size === "xl" ? "text-lg" : "text-sm"} ${colors.subtext} tracking-widest`}
          >
            SI
          </span>
        </span>
      )}
    </span>
  );
}

/**
 * Logo simplificado solo icono para favicon y espacios pequeños
 */
export function LogoIcon({ size = 32, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle
        cx="32"
        cy="32"
        r="30"
        fill="url(#logo-icon-gradient)"
        stroke="#F97316"
        strokeWidth="2"
      />

      <rect
        x="12"
        y="26"
        width="24"
        height="16"
        rx="2"
        fill="white"
        opacity="0.95"
      />
      <path
        d="M36 30 L44 30 L48 36 L48 42 L36 42 Z"
        fill="white"
        opacity="0.95"
      />
      <path
        d="M38 32 L43 32 L46 36 L46 38 L38 38 Z"
        fill="#3B82F6"
        opacity="0.7"
      />

      <circle cx="20" cy="44" r="5" fill="#1D4ED8" />
      <circle cx="20" cy="44" r="2.5" fill="white" />
      <circle cx="42" cy="44" r="5" fill="#1D4ED8" />
      <circle cx="42" cy="44" r="2.5" fill="white" />

      <rect x="16" y="20" width="10" height="8" rx="1" fill="#F97316" />
      <line x1="21" y1="20" x2="21" y2="28" stroke="white" strokeWidth="1.5" />
      <line x1="16" y1="24" x2="26" y2="24" stroke="white" strokeWidth="1.5" />

      <circle cx="50" cy="18" r="10" fill="#F97316" />
      <path
        d="M45 18 L48 21 L55 14"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      <defs>
        <linearGradient
          id="logo-icon-gradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>
    </svg>
  );
}
