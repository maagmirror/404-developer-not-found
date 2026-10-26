import { officePhotoUrl } from '../data/office'

interface OfficeImageProps {
  photo?: string
  kind: 'desk' | 'person'
  alt: string
}

/** Real photo when configured, otherwise a drawn placeholder in the terminal palette. */
export function OfficeImage({ photo, kind, alt }: OfficeImageProps) {
  if (photo) return <img className="office-img" src={officePhotoUrl(photo)} alt={alt} draggable={false} />

  return (
    <svg className="office-img office-img--placeholder" viewBox="0 0 120 90" role="img" aria-label={alt}>
      <rect width="120" height="90" fill="oklch(0.14 0.01 20)" />
      {kind === 'desk' ? (
        <g fill="none" stroke="oklch(0.55 0.02 20)" strokeWidth="2">
          <rect x="38" y="18" width="44" height="28" />
          <line x1="60" y1="46" x2="60" y2="56" />
          <line x1="14" y1="58" x2="106" y2="58" />
          <line x1="22" y1="58" x2="22" y2="82" />
          <line x1="98" y1="58" x2="98" y2="82" />
          <path d="M84 40 q8 -2 10 6 q-4 4 -10 2z" />
        </g>
      ) : (
        <g fill="oklch(0.3 0.02 20)">
          <circle cx="60" cy="34" r="16" />
          <path d="M28 90 q2 -30 32 -32 q30 2 32 32z" />
        </g>
      )}
      <text x="60" y="86" textAnchor="middle" fontSize="6" fill="oklch(0.55 0.02 20)" letterSpacing="1">
        FOTO PENDIENTE
      </text>
    </svg>
  )
}
