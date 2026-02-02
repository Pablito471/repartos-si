import { useState } from "react";

/**
 * Componente de calificación con estrellas
 * @param {number} rating - Calificación actual (1-5)
 * @param {function} onRate - Función callback cuando se califica (opcional, si no se pasa es solo lectura)
 * @param {string} size - Tamaño: 'sm', 'md', 'lg'
 * @param {boolean} showValue - Mostrar el valor numérico
 */
export default function StarRating({
  rating = 0,
  onRate = null,
  size = "md",
  showValue = true,
  totalReviews = 0,
  showTotal = false,
}) {
  const [hover, setHover] = useState(0);

  const sizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };

  const isInteractive = !!onRate;

  return (
    <div className="flex items-center gap-2">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= (hover || rating);

          return (
            <button
              key={star}
              type="button"
              disabled={!isInteractive}
              onClick={() => isInteractive && onRate(star)}
              onMouseEnter={() => isInteractive && setHover(star)}
              onMouseLeave={() => isInteractive && setHover(0)}
              className={`${sizes[size]} transition-colors ${
                isInteractive
                  ? "cursor-pointer hover:scale-110"
                  : "cursor-default"
              } ${isFilled ? "text-yellow-400" : "text-gray-300"}`}
            >
              {isFilled ? "★" : "☆"}
            </button>
          );
        })}
      </div>

      {showValue && (
        <span
          className={`font-medium ${size === "sm" ? "text-sm" : "text-base"} text-gray-600`}
        >
          {rating > 0 ? rating.toFixed(1) : "Sin calificar"}
        </span>
      )}

      {showTotal && totalReviews > 0 && (
        <span className="text-gray-400 text-sm">
          ({totalReviews} {totalReviews === 1 ? "reseña" : "reseñas"})
        </span>
      )}
    </div>
  );
}

/**
 * Componente para mostrar distribución de calificaciones
 */
export function RatingDistribution({ calificaciones = [] }) {
  const total = calificaciones.length;

  if (total === 0) {
    return (
      <div className="text-gray-500 text-sm text-center py-4">
        Sin calificaciones aún
      </div>
    );
  }

  // Contar calificaciones por estrella
  const distribucion = [5, 4, 3, 2, 1].map((stars) => {
    const count = calificaciones.filter((c) => c.puntuacion === stars).length;
    const porcentaje = (count / total) * 100;
    return { stars, count, porcentaje };
  });

  const promedio =
    calificaciones.reduce((acc, c) => acc + c.puntuacion, 0) / total;

  return (
    <div className="space-y-3">
      {/* Promedio grande */}
      <div className="flex items-center gap-4 mb-4">
        <div className="text-4xl font-bold text-gray-800">
          {promedio.toFixed(1)}
        </div>
        <div>
          <StarRating rating={promedio} size="md" showValue={false} />
          <p className="text-sm text-gray-500">{total} calificaciones</p>
        </div>
      </div>

      {/* Barras de distribución */}
      {distribucion.map(({ stars, count, porcentaje }) => (
        <div key={stars} className="flex items-center gap-2">
          <span className="text-sm text-gray-600 w-6">{stars}</span>
          <span className="text-yellow-400">★</span>
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-400 rounded-full transition-all"
              style={{ width: `${porcentaje}%` }}
            />
          </div>
          <span className="text-sm text-gray-500 w-8">{count}</span>
        </div>
      ))}
    </div>
  );
}
