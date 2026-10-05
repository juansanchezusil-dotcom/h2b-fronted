// Monograma de Juan Te Avisa: la J de trazos finos, en dorado sobre navy. Es el mismo dibujo del
// favicon (app/icon.svg), así que la marca se ve igual en la pestaña, en el encabezado y al compartir.

interface LogoMarkProps {
  size?: number;
  className?: string;
  // Cuando el nombre de la marca ya aparece al lado en texto, el logo es decorativo
  decorative?: boolean;
}

export default function LogoMark({ size = 36, className, decorative = false }: LogoMarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      {...(decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': 'Juan Te Avisa' })}
    >
      <rect width="64" height="64" rx="14" fill="#08131F" />
      <g
        transform="translate(-26.714 -5.596) scale(0.19736)"
        fill="none"
        stroke="#C89B3C"
        strokeWidth="15"
        strokeLinecap="butt"
        strokeLinejoin="miter"
      >
        <path d="M230 84.5H365" />
        <path d="M357.5 84.5V236.5A60 60 0 0 1 237.5 236.5" />
        <path d="M328.5 84.5V287.87" />
      </g>
    </svg>
  );
}
