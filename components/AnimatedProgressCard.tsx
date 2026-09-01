import React from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

interface AnimatedProgressCardProps {
  /** El título principal de la tarjeta */
  title: string;
  /** El valor numérico principal a mostrar */
  value: number;
  /** Texto descriptivo del estado (ej. 'Excelente', 'En progreso') */
  status: string;
  /** Descripción o pie de tarjeta */
  description: React.ReactNode;
  /** Porcentaje de progreso (0-100) para el anillo radial */
  progress: number;
  /** Ícono para la esquina superior derecha */
  icon: React.ReactNode;
  /** Clase CSS opcional para fusionar estilos */
  className?: string;
}

export const AnimatedProgressCard: React.FC<AnimatedProgressCardProps> = ({
  title,
  value,
  status,
  description,
  progress,
  icon,
  className,
}) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const progressValue = useMotionValue(0);

  React.useEffect(() => {
    const valueAnimation = animate(count, value, {
      duration: 1.5,
      ease: [0.43, 0.13, 0.23, 0.96],
    });

    const progressAnimation = animate(progressValue, progress, {
      duration: 1.5,
      ease: [0.43, 0.13, 0.23, 0.96],
    });

    return () => {
      valueAnimation.stop();
      progressAnimation.stop();
    };
  }, [value, progress, count, progressValue]);

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = useTransform(
    progressValue,
    (v) => circumference - (v / 100) * circumference
  );

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-6 shadow-sm text-slate-900 ${className || ''}`}
    >
      {/* Resplandor de fondo en tono azul de marca */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -z-10" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-600">{title}</h3>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 border border-blue-100">
          {icon}
        </div>
      </div>

      {/* Círculo de Progreso */}
      <div className="relative flex h-56 w-full items-center justify-center my-2">
        <svg
          width="200"
          height="200"
          viewBox="0 0 200 200"
          className="-rotate-90"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          {/* Pista de fondo con patrón punteado */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            strokeWidth="12"
            fill="transparent"
            className="stroke-slate-100"
            strokeDasharray="8 12"
            strokeLinecap="round"
          />
          {/* Anillo animado de progreso */}
          <motion.circle
            cx="100"
            cy="100"
            r={radius}
            strokeWidth="12"
            fill="transparent"
            className="stroke-blue-600"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeLinecap="round"
            style={{ strokeDashoffset }}
          />
        </svg>

        {/* Texto central */}
        <div className="absolute flex flex-col items-center justify-center">
          <motion.span className="text-6xl font-black tracking-tight text-slate-900">
            {rounded}
          </motion.span>
          <p className="text-base font-semibold text-slate-500 mt-1">{status}</p>
        </div>
      </div>

      {/* Pie de página */}
      <div className="text-center text-sm text-slate-500">
        {description}
      </div>
    </div>
  );
};