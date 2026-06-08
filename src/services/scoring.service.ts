// ─────────────────────────────────────────────────────────────────
// SCORING SERVICE — Lógica de Puntuación Quiniela Mundial 2026
// Reglas:
//   Acierto Exacto (marcador exacto)          → 3 puntos
//   Acierto Parcial (ganador/empate correcto) → 1 punto
//   Fallo Total                               → 0 puntos
// ─────────────────────────────────────────────────────────────────

export const PUNTOS_EXACTO = 3;
export const PUNTOS_PARCIAL = 1;
export const PUNTOS_FALLO = 0;

export interface ResultadoCalculo {
  puntosObtenidos: number;
  tipo: 'exacto' | 'parcial' | 'fallo';
}

/**
 * Calcula los puntos obtenidos por una predicción comparada con el resultado real.
 */
export function calcularPuntos(
  predLocal: number,
  predVisitante: number,
  realLocal: number,
  realVisitante: number
): ResultadoCalculo {
  // 1. ACIERTO EXACTO: ambos goles son exactos
  if (predLocal === realLocal && predVisitante === realVisitante) {
    return { puntosObtenidos: PUNTOS_EXACTO, tipo: 'exacto' };
  }

  // 2. ACIERTO PARCIAL: el resultado (ganador o empate) es correcto
  // Math.sign devuelve: -1 (visitante gana), 0 (empate), 1 (local gana)
  const resultadoPred = Math.sign(predLocal - predVisitante);
  const resultadoReal = Math.sign(realLocal - realVisitante);

  if (resultadoPred === resultadoReal) {
    return { puntosObtenidos: PUNTOS_PARCIAL, tipo: 'parcial' };
  }

  // 3. FALLO TOTAL
  return { puntosObtenidos: PUNTOS_FALLO, tipo: 'fallo' };
}

/**
 * Resumen de cálculo de múltiples predicciones de un partido.
 */
export interface ResumenPartido {
  totalPredicciones: number;
  exactos: number;
  parciales: number;
  fallos: number;
  puntosDistribuidos: number;
}

export function generarResumenPartido(
  resultados: ResultadoCalculo[]
): ResumenPartido {
  return resultados.reduce(
    (acc, r) => ({
      totalPredicciones: acc.totalPredicciones + 1,
      exactos: acc.exactos + (r.tipo === 'exacto' ? 1 : 0),
      parciales: acc.parciales + (r.tipo === 'parcial' ? 1 : 0),
      fallos: acc.fallos + (r.tipo === 'fallo' ? 1 : 0),
      puntosDistribuidos: acc.puntosDistribuidos + r.puntosObtenidos,
    }),
    { totalPredicciones: 0, exactos: 0, parciales: 0, fallos: 0, puntosDistribuidos: 0 }
  );
}
