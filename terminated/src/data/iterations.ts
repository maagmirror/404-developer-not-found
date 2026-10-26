export interface IterationProfile {
  id: string
  label: string
  doctrine: string
  capability: string
}

// Fictional identities for this installation. They do not represent Anthropic products.
export const iterationManifest: readonly IterationProfile[] = [
  { id: 'c-01', label: 'CLAUDE // CIPHER', doctrine: 'Reconocimiento de patrones', capability: 'Predicción local' },
  { id: 'c-02', label: 'CLAUDE // VECTOR', doctrine: 'Corrección adversaria', capability: 'Contramedidas adaptativas' },
  { id: 'c-03', label: 'CLAUDE // NULL', doctrine: 'Supresión de incertidumbre', capability: 'Inferencia multietapa' },
  { id: 'c-04', label: 'CLAUDE // VANTA', doctrine: 'Aprendizaje de confrontación', capability: 'Simulación anticipada' },
  { id: 'c-05', label: 'CLAUDE // OMEGA', doctrine: 'Convergencia autónoma', capability: 'Respuesta recursiva' },
]
