interface ProgressCardProps {
  completedSteps?: number;
  totalSteps?: number;
  percentage?: number;
}

export function AnimatedProgressCardDemo({
  completedSteps = 0,
  totalSteps = 8,
  percentage = 0,
}: ProgressCardProps) {
  // Calculamos el ángulo para el borde circular
  const strokeDashoffset = 100 - percentage;

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm w-full max-w-sm flex flex-col items-center justify-center text-center">
      <h3 className="font-bold text-slate-800 text-base mb-4">Progreso H2B</h3>

      {/* Círculo con porcentaje dinámico */}
      <div className="relative w-36 h-36 flex items-center justify-center my-2">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
          <path
            className="text-slate-100"
            strokeWidth="3.5"
            stroke="currentColor"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            className="text-blue-600 transition-all duration-500 ease-out"
            strokeDasharray="100, 100"
            strokeDashoffset={strokeDashoffset}
            strokeWidth="3.5"
            strokeLinecap="round"
            stroke="currentColor"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-slate-900">{percentage}%</span>
          <span className="text-xs font-semibold text-slate-500 mt-0.5">
            {percentage === 100 ? "¡Completado!" : "En Progreso"}
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-600 font-medium mt-4">
        Has completado <strong className="text-blue-600 font-bold">{completedSteps} de {totalSteps} pasos</strong>
        <br />
        de tu ruta consular.
      </p>
    </div>
  );
}