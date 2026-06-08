import prisma from '../lib/prisma';

interface TeamStanding {
  equipo: string;
  puntos: number;
  golesFavor: number;
  golesContra: number;
  diferenciaGoles: number;
}

/**
 * Verifica el estado del torneo y genera la siguiente fase si corresponde.
 */
export async function checkAndGenerateNextPhase() {
  // 1. Obtener todos los partidos del sistema
  const partidos = await prisma.partido.findMany();

  // Agrupar por fase
  const groupStageMatches = partidos.filter(
    (p) => p.grupo && ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'].includes(p.grupo)
  );
  const r32Matches = partidos.filter((p) => p.fase === 'Dieciseisavos');
  const r16Matches = partidos.filter((p) => p.fase === 'Octavos');
  const qfMatches = partidos.filter((p) => p.fase === 'Cuartos');
  const sfMatches = partidos.filter((p) => p.fase === 'Semifinales');
  const finalMatches = partidos.filter((p) => p.fase === 'Final');

  // Comprobar si una fase ha terminado (todos los partidos están Finalizados)
  const isPhaseFinished = (matches: typeof partidos) =>
    matches.length > 0 && matches.every((m) => m.estado === 'Finalizado');

  // 1. Fase de Grupos -> Dieciseisavos (Round of 32)
  if (groupStageMatches.length > 0 && isPhaseFinished(groupStageMatches)) {
    // Si ya existen partidos de Dieciseisavos, no duplicar
    if (r32Matches.length === 0) {
      await generateDieciseisavos();
      return;
    }
  }

  // 2. Dieciseisavos -> Octavos (Round of 16)
  if (r32Matches.length > 0 && isPhaseFinished(r32Matches)) {
    if (r16Matches.length === 0) {
      await generateNextKnockoutRound(r32Matches, 'Octavos');
      return;
    }
  }

  // 3. Octavos -> Cuartos (Quarterfinals)
  if (r16Matches.length > 0 && isPhaseFinished(r16Matches)) {
    if (qfMatches.length === 0) {
      await generateNextKnockoutRound(r16Matches, 'Cuartos');
      return;
    }
  }

  // 4. Cuartos -> Semifinales (Semifinals)
  if (qfMatches.length > 0 && isPhaseFinished(qfMatches)) {
    if (sfMatches.length === 0) {
      await generateNextKnockoutRound(qfMatches, 'Semifinales');
      return;
    }
  }

  // 5. Semifinales -> Final y Tercer Puesto
  if (sfMatches.length > 0 && isPhaseFinished(sfMatches)) {
    if (finalMatches.length === 0) {
      await generateFinals(sfMatches);
      return;
    }
  }
}

/**
 * Calcula las posiciones de la fase de grupos y empareja a los 32 equipos clasificados.
 */
async function generateDieciseisavos() {
  const grupos = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  const clasificados1y2: { grupo: string; equipo: string; posicion: number }[] = [];
  const terceros: TeamStanding[] = [];

  for (const g of grupos) {
    const partidosGrupo = await prisma.partido.findMany({
      where: { grupo: g },
    });

    const standingsMap = new Map<string, TeamStanding>();

    const getOrCreateStanding = (equipo: string): TeamStanding => {
      if (!standingsMap.has(equipo)) {
        standingsMap.set(equipo, {
          equipo,
          puntos: 0,
          golesFavor: 0,
          golesContra: 0,
          diferenciaGoles: 0,
        });
      }
      return standingsMap.get(equipo)!;
    };

    // Procesar cada partido finalizado del grupo
    for (const p of partidosGrupo) {
      if (p.golesLocal === null || p.golesVisitante === null) continue;
      const sLocal = getOrCreateStanding(p.equipoLocal);
      const sVisitante = getOrCreateStanding(p.equipoVisitante);

      sLocal.golesFavor += p.golesLocal;
      sLocal.golesContra += p.golesVisitante;
      sLocal.diferenciaGoles = sLocal.golesFavor - sLocal.golesContra;

      sVisitante.golesFavor += p.golesVisitante;
      sVisitante.golesContra += p.golesLocal;
      sVisitante.diferenciaGoles = sVisitante.golesFavor - sVisitante.golesContra;

      if (p.golesLocal > p.golesVisitante) {
        sLocal.puntos += 3;
      } else if (p.golesVisitante > p.golesLocal) {
        sVisitante.puntos += 3;
      } else {
        sLocal.puntos += 1;
        sVisitante.puntos += 1;
      }
    }

    // Ordenar posiciones del grupo
    const standings = Array.from(standingsMap.values()).sort((a, b) => {
      if (b.puntos !== a.puntos) return b.puntos - a.puntos;
      if (b.diferenciaGoles !== a.diferenciaGoles) return b.diferenciaGoles - a.diferenciaGoles;
      return b.golesFavor - a.golesFavor;
    });

    // Guardar 1º y 2º clasificado
    if (standings[0]) {
      clasificados1y2.push({ grupo: g, equipo: standings[0].equipo, posicion: 1 });
    }
    if (standings[1]) {
      clasificados1y2.push({ grupo: g, equipo: standings[1].equipo, posicion: 2 });
    }
    // Guardar 3º para la tabla general de mejores terceros
    if (standings[2]) {
      terceros.push(standings[2]);
    }
  }

  // Ordenar los mejores terceros
  const mejoresTerceros = terceros.sort((a, b) => {
    if (b.puntos !== a.puntos) return b.puntos - a.puntos;
    if (b.diferenciaGoles !== a.diferenciaGoles) return b.diferenciaGoles - a.diferenciaGoles;
    return b.golesFavor - a.golesFavor;
  }).slice(0, 8); // Tomar solo los 8 mejores

  // Separar ganadores, segundos y terceros para fácil mapeo
  const W = (grupo: string) => clasificados1y2.find((c) => c.grupo === grupo && c.posicion === 1)?.equipo || `1º Grupo ${grupo}`;
  const R = (grupo: string) => clasificados1y2.find((c) => c.grupo === grupo && c.posicion === 2)?.equipo || `2º Grupo ${grupo}`;
  const T = mejoresTerceros.map((t) => t.equipo);

  // Asegurar que tenemos suficientes terceros clasificados
  const getT = (index: number) => T[index] || `3º Mejor clasificado ${index + 1}`;

  // Parejas para los 16 partidos de Dieciseisavos
  const parejas = [
    { local: W('A'), visitante: getT(0) }, // Partido 1
    { local: W('B'), visitante: getT(1) }, // Partido 2
    { local: W('C'), visitante: getT(2) }, // Partido 3
    { local: W('D'), visitante: getT(3) }, // Partido 4
    { local: W('E'), visitante: getT(4) }, // Partido 5
    { local: W('F'), visitante: getT(5) }, // Partido 6
    { local: W('G'), visitante: getT(6) }, // Partido 7
    { local: W('H'), visitante: getT(7) }, // Partido 8
    { local: W('I'), visitante: R('A') },  // Partido 9
    { local: W('J'), visitante: R('B') },  // Partido 10
    { local: W('K'), visitante: R('C') },  // Partido 11
    { local: W('L'), visitante: R('D') },  // Partido 12
    { local: R('E'), visitante: R('F') },  // Partido 13
    { local: R('G'), visitante: R('H') },  // Partido 14
    { local: R('I'), visitante: R('J') },  // Partido 15
    { local: R('K'), visitante: R('L') },  // Partido 16
  ];

  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + 2); // Comenzar en 2 días

  // Guardar en la base de datos
  for (let i = 0; i < parejas.length; i++) {
    const matchDate = new Date(baseDate.getTime() + i * 3 * 60 * 60 * 1000); // escalonado cada 3 horas
    await prisma.partido.create({
      data: {
        equipoLocal: parejas[i].local,
        equipoVisitante: parejas[i].visitante,
        fechaHora: matchDate,
        estado: 'Pendiente',
        fase: 'Dieciseisavos',
        grupo: String(i + 1), // Almacenamos el número de partido en "grupo" para la progresión
      },
    });
  }
}

/**
 * Genera partidos de eliminación directa (Octavos, Cuartos, Semifinales)
 */
async function generateNextKnockoutRound(partidosAnteriores: any[], faseNueva: string) {
  // Ordenar partidos anteriores por su identificador numérico de grupo ("1", "2", etc.)
  const partidosOrdenados = [...partidosAnteriores].sort((a, b) => {
    return parseInt(a.grupo || '0') - parseInt(b.grupo || '0');
  });

  const ganadores: string[] = [];

  for (const p of partidosOrdenados) {
    if (p.golesLocal === null || p.golesVisitante === null) continue;
    if (p.golesLocal > p.golesVisitante) {
      ganadores.push(p.equipoLocal);
    } else if (p.golesVisitante > p.golesLocal) {
      ganadores.push(p.equipoVisitante);
    } else {
      // Fallback si quedó empate (se asume que la puntuación de penales fue cargada o avanza el local)
      ganadores.push(p.equipoLocal);
    }
  }

  // Generar emparejamientos: 1 vs 2, 3 vs 4, 5 vs 6, etc.
  const parejas: { local: string; visitante: string }[] = [];
  for (let i = 0; i < ganadores.length; i += 2) {
    if (ganadores[i] && ganadores[i + 1]) {
      parejas.push({ local: ganadores[i], visitante: ganadores[i + 1] });
    }
  }

  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + 2); // Siguiente fase en 2 días

  // Guardar en la base de datos
  for (let i = 0; i < parejas.length; i++) {
    const matchDate = new Date(baseDate.getTime() + i * 3 * 60 * 60 * 1000);
    await prisma.partido.create({
      data: {
        equipoLocal: parejas[i].local,
        equipoVisitante: parejas[i].visitante,
        fechaHora: matchDate,
        estado: 'Pendiente',
        fase: faseNueva,
        grupo: String(i + 1), // "1", "2", "3"...
      },
    });
  }
}

/**
 * Genera la final y el partido por el tercer puesto a partir de los resultados de semifinales.
 */
async function generateFinals(sfMatches: any[]) {
  const sfOrdenados = [...sfMatches].sort((a, b) => {
    return parseInt(a.grupo || '0') - parseInt(b.grupo || '0');
  });

  if (sfOrdenados.length < 2) return;

  const getWinnerAndLoser = (p: any) => {
    if (p.golesLocal > p.golesVisitante) {
      return { winner: p.equipoLocal, loser: p.equipoVisitante };
    } else if (p.golesVisitante > p.golesLocal) {
      return { winner: p.equipoVisitante, loser: p.equipoLocal };
    } else {
      return { winner: p.equipoLocal, loser: p.equipoVisitante };
    }
  };

  const sf1 = getWinnerAndLoser(sfOrdenados[0]);
  const sf2 = getWinnerAndLoser(sfOrdenados[1]);

  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + 2); // Finales en 2 días

  // Partido por el Tercer Puesto
  await prisma.partido.create({
    data: {
      equipoLocal: sf1.loser,
      equipoVisitante: sf2.loser,
      fechaHora: new Date(baseDate.getTime()),
      estado: 'Pendiente',
      fase: 'Tercer Puesto',
      grupo: '3rd',
    },
  });

  // La Gran Final (3 horas después)
  await prisma.partido.create({
    data: {
      equipoLocal: sf1.winner,
      equipoVisitante: sf2.winner,
      fechaHora: new Date(baseDate.getTime() + 3 * 60 * 60 * 1000),
      estado: 'Pendiente',
      fase: 'Final',
      grupo: 'final',
    },
  });
}
