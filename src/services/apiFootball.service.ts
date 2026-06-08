import prisma from '../lib/prisma';
import { calcularPuntosPartido } from '../routes/admin.routes';
import { checkAndGenerateNextPhase } from './bracket.service';
import { sendNotificationToAll } from './notification.service';

// ── Mapeo de Nombres de Equipos (API-Football a Base de Datos Local) ──
const TEAM_NAME_MAPPING: Record<string, string> = {
  'Mexico': 'México',
  'South Africa': 'Sudáfrica',
  'South Korea': 'Rep. Corea',
  'Korea Republic': 'Rep. Corea',
  'Czech Republic': 'Rep. Checa',
  'Czechia': 'Rep. Checa',
  'Canada': 'Canadá',
  'Bosnia & Herzegovina': 'Bosnia',
  'Bosnia and Herzegovina': 'Bosnia',
  'Bosnia-Herzegovina': 'Bosnia',
  'USA': 'EEUU',
  'United States': 'EEUU',
  'Qatar': 'Catar',
  'Switzerland': 'Suiza',
  'Brazil': 'Brasil',
  'Morocco': 'Marruecos',
  'Haiti': 'Haití',
  'Scotland': 'Escocia',
  'Turkey': 'Turquía',
  'Germany': 'Alemania',
  'Curaçao': 'Curazao',
  'Curacao': 'Curazao',
  'Netherlands': 'Países Bajos',
  'Japan': 'Japón',
  'Ivory Coast': 'C. Marfil',
  'Sweden': 'Suecia',
  'Tunisia': 'Túnez',
  'Spain': 'España',
  'Cape Verde': 'Cabo Verde',
  'Belgium': 'Bélgica',
  'Egypt': 'Egipto',
  'Saudi Arabia': 'A. Saudí',
  'Saudi-Arabia': 'A. Saudí',
  'Uruguay': 'Uruguay',
  'Iran': 'Irán',
  'New Zealand': 'N. Zelanda',
  'France': 'Francia',
  'Senegal': 'Senegal',
  'Iraq': 'Irak',
  'Norway': 'Noruega',
  'Argentina': 'Argentina',
  'Algeria': 'Argelia',
  'Austria': 'Austria',
  'Jordan': 'Jordania',
  'Portugal': 'Portugal',
  'DR Congo': 'RD Congo',
  'Congo DR': 'RD Congo',
  'England': 'Inglaterra',
  'Croacia': 'Croacia',
  'Croatia': 'Croacia',
  'Ghana': 'Ghana',
  'Panama': 'Panamá',
  'Uzbekistan': 'Uzbekistán',
  'Colombia': 'Colombia',
};

/**
 * Normaliza nombres de equipos para comparar en caso de que no estén en el diccionario
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .replace(/[^a-z0-9]/g, '');     // Quitar espacios y caracteres raros
}

/**
 * Traduce el nombre del equipo de la API al nombre en la base de datos local
 */
function translateTeamName(apiName: string): string {
  if (TEAM_NAME_MAPPING[apiName]) {
    return TEAM_NAME_MAPPING[apiName];
  }
  return apiName;
}

/**
 * Sincroniza los partidos locales con los resultados de la API-Football
 */
export async function syncMatchesFromAPI(): Promise<{
  success: boolean;
  totalSynced: number;
  totalUpdated: number;
  totalFinalized: number;
  message: string;
}> {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    return {
      success: false,
      totalSynced: 0,
      totalUpdated: 0,
      totalFinalized: 0,
      message: 'API_FOOTBALL_KEY no está configurada en las variables de entorno.',
    };
  }

  try {
    // 1. Consultar la API-Football (Mundial 2026: league=1, season=2026)
    const response = await fetch('https://v3.football.api-sports.io/fixtures?league=1&season=2026', {
      method: 'GET',
      headers: {
        'x-apisports-key': apiKey,
        'x-rapidapi-host': 'v3.football.api-sports.io',
      },
    });

    if (!response.ok) {
      throw new Error(`Error de API-Football: HTTP ${response.status}`);
    }

    const data = (await response.json()) as any;
    if (data.errors && Object.keys(data.errors).length > 0) {
      throw new Error(`API Error: ${JSON.stringify(data.errors)}`);
    }

    const fixtures = data.response || [];
    if (fixtures.length === 0) {
      return {
        success: true,
        totalSynced: 0,
        totalUpdated: 0,
        totalFinalized: 0,
        message: 'No se encontraron partidos para la temporada seleccionada.',
      };
    }

    // 2. Obtener todos los partidos de nuestra base de datos
    const dbPartidos = await prisma.partido.findMany();

    let totalSynced = 0;
    let totalUpdated = 0;
    let totalFinalized = 0;

    for (const fixture of fixtures) {
      const apiId = String(fixture.fixture.id);
      const apiLocal = translateTeamName(fixture.teams.home.name);
      const apiVisitante = translateTeamName(fixture.teams.away.name);
      
      const apiGolesLocal = fixture.goals.home;
      const apiGolesVisitante = fixture.goals.away;
      const apiStatus = fixture.fixture.status.short; // FT, AET, PEN, 1H, 2H, HT, NS, etc.

      // Mapear estado
      let nuevoEstado: 'Pendiente' | 'EnJuego' | 'Finalizado' = 'Pendiente';
      if (['1H', '2H', 'HT', 'ET', 'P', 'BT'].includes(apiStatus)) {
        nuevoEstado = 'EnJuego';
      } else if (['FT', 'AET', 'PEN'].includes(apiStatus)) {
        nuevoEstado = 'Finalizado';
      }

      // Buscar partido correspondiente en la BD local
      let dbPartido = dbPartidos.find((p) => p.apiFixtureId === apiId);

      if (!dbPartido) {
        // Si no está emparejado por ID, buscar por equipos
        dbPartido = dbPartidos.find((p) => {
          const lDb = normalizeName(p.equipoLocal);
          const vDb = normalizeName(p.equipoVisitante);
          const lApi = normalizeName(apiLocal);
          const vApi = normalizeName(apiVisitante);
          
          return (
            (lDb === lApi && vDb === vApi) || 
            (lDb === normalizeName(fixture.teams.home.name) && vDb === normalizeName(fixture.teams.away.name))
          );
        });

        if (dbPartido && !dbPartido.apiFixtureId) {
          // Guardar el apiFixtureId para el futuro
          await prisma.partido.update({
            where: { id: dbPartido.id },
            data: { apiFixtureId: apiId },
          });
          dbPartido.apiFixtureId = apiId;
        }
      }

      // Si encontramos el partido, verificar si el marcador o estado cambió
      if (dbPartido) {
        totalSynced++;

        const golesCambian = 
          dbPartido.golesLocal !== apiGolesLocal || 
          dbPartido.golesVisitante !== apiGolesVisitante;
        
        const estadoCambia = dbPartido.estado !== nuevoEstado;

        if (golesCambian || estadoCambia) {
          // Actualizar partido
          const partidoActualizado = await prisma.partido.update({
            where: { id: dbPartido.id },
            data: {
              golesLocal: apiGolesLocal,
              golesVisitante: apiGolesVisitante,
              estado: nuevoEstado,
            },
          });

          totalUpdated++;

          // Si pasó a Finalizado en esta sincronización, calcular puntos, bracket y notificar
          if (nuevoEstado === 'Finalizado' && dbPartido.estado !== 'Finalizado' && apiGolesLocal !== null && apiGolesVisitante !== null) {
            totalFinalized++;

            // 1. Calcular puntos para los usuarios que predijeron este partido
            await calcularPuntosPartido(partidoActualizado.id, apiGolesLocal, apiGolesVisitante);

            // 2. Comprobar y avanzar fase (dieciseisavos, etc.)
            await checkAndGenerateNextPhase();

            // 3. Enviar notificación push
            try {
              const golesTxt = `${partidoActualizado.equipoLocal} ${apiGolesLocal} - ${apiGolesVisitante} ${partidoActualizado.equipoVisitante}`;
              await sendNotificationToAll(
                '⚽ ¡Resultado Finalizado! 🏆',
                `El encuentro de la ${partidoActualizado.fase} ha terminado: ${golesTxt}`,
                '/dashboard'
              );
            } catch (err: any) {
              console.error('❌ Error enviando push en sync:', err.message);
            }
          }
        }
      }
    }

    return {
      success: true,
      totalSynced,
      totalUpdated,
      totalFinalized,
      message: `Sincronización exitosa. Se revisaron ${totalSynced} partidos. Se actualizaron ${totalUpdated} marcadores, de los cuales ${totalFinalized} finalizaron.`,
    };
  } catch (error: any) {
    console.error('❌ Error en syncMatchesFromAPI:', error);
    return {
      success: false,
      totalSynced: 0,
      totalUpdated: 0,
      totalFinalized: 0,
      message: `Error al conectar con la API: ${error.message || error}`,
    };
  }
}
