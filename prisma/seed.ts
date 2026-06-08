import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const isClean = process.argv.includes('--clean') || process.env.CLEAN_SEED === 'true';

async function main() {
  console.log(isClean ? '🧹 Clean Seed — producción\n' : '🧪 Demo Seed completo\n');

  await prisma.prediccion.deleteMany();
  await prisma.partido.deleteMany();
  await prisma.usuario.deleteMany();
  console.log('✅ Base de datos limpia\n');

  // ── ADMIN ──────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('admin2026', 10);
  await prisma.usuario.create({
    data: { cedula: '00000000', nombre: 'Administrador', telefono: '0414-0000000', passwordHash: adminHash, rol: 'ADMIN' },
  });
  console.log('✅ Admin creado (cédula: 00000000 / pass: admin2026)\n');

  // ── FASE DE GRUPOS (72 partidos) ────────────────────────────────
  console.log('⚽ Creando fase de grupos...');
  const gruposData = [
    // Jornada 1
    { e1: 'México',       e2: 'Sudáfrica',   f: '2026-06-11T15:00:00Z', gr: 'A', fase: 'Jornada 1' },
    { e1: 'Rep. Corea',   e2: 'Rep. Checa',  f: '2026-06-11T22:00:00Z', gr: 'A', fase: 'Jornada 1' },
    { e1: 'Canadá',       e2: 'Bosnia',      f: '2026-06-12T15:00:00Z', gr: 'B', fase: 'Jornada 1' },
    { e1: 'EEUU',         e2: 'Paraguay',    f: '2026-06-12T21:00:00Z', gr: 'D', fase: 'Jornada 1' },
    { e1: 'Catar',        e2: 'Suiza',       f: '2026-06-13T15:00:00Z', gr: 'B', fase: 'Jornada 1' },
    { e1: 'Brasil',       e2: 'Marruecos',   f: '2026-06-13T18:00:00Z', gr: 'C', fase: 'Jornada 1' },
    { e1: 'Haití',        e2: 'Escocia',     f: '2026-06-13T21:00:00Z', gr: 'C', fase: 'Jornada 1' },
    { e1: 'Australia',    e2: 'Turquía',     f: '2026-06-14T00:00:00Z', gr: 'D', fase: 'Jornada 1' },
    { e1: 'Alemania',     e2: 'Curazao',     f: '2026-06-14T13:00:00Z', gr: 'E', fase: 'Jornada 1' },
    { e1: 'Países Bajos', e2: 'Japón',       f: '2026-06-14T16:00:00Z', gr: 'F', fase: 'Jornada 1' },
    { e1: 'C. Marfil',    e2: 'Ecuador',     f: '2026-06-14T19:00:00Z', gr: 'E', fase: 'Jornada 1' },
    { e1: 'Suecia',       e2: 'Túnez',       f: '2026-06-14T22:00:00Z', gr: 'F', fase: 'Jornada 1' },
    { e1: 'España',       e2: 'Cabo Verde',  f: '2026-06-15T12:00:00Z', gr: 'H', fase: 'Jornada 1' },
    { e1: 'Bélgica',      e2: 'Egipto',      f: '2026-06-15T15:00:00Z', gr: 'G', fase: 'Jornada 1' },
    { e1: 'A. Saudí',     e2: 'Uruguay',     f: '2026-06-15T18:00:00Z', gr: 'H', fase: 'Jornada 1' },
    { e1: 'Irán',         e2: 'N. Zelanda',  f: '2026-06-15T21:00:00Z', gr: 'G', fase: 'Jornada 1' },
    { e1: 'Francia',      e2: 'Senegal',     f: '2026-06-16T15:00:00Z', gr: 'I', fase: 'Jornada 1' },
    { e1: 'Irak',         e2: 'Noruega',     f: '2026-06-16T18:00:00Z', gr: 'I', fase: 'Jornada 1' },
    { e1: 'Argentina',    e2: 'Argelia',     f: '2026-06-16T21:00:00Z', gr: 'J', fase: 'Jornada 1' },
    { e1: 'Austria',      e2: 'Jordania',    f: '2026-06-17T00:00:00Z', gr: 'J', fase: 'Jornada 1' },
    { e1: 'Portugal',     e2: 'RD Congo',    f: '2026-06-17T13:00:00Z', gr: 'K', fase: 'Jornada 1' },
    { e1: 'Inglaterra',   e2: 'Croacia',     f: '2026-06-17T16:00:00Z', gr: 'L', fase: 'Jornada 1' },
    { e1: 'Ghana',        e2: 'Panamá',      f: '2026-06-17T19:00:00Z', gr: 'L', fase: 'Jornada 1' },
    { e1: 'Uzbekistán',   e2: 'Colombia',    f: '2026-06-17T22:00:00Z', gr: 'K', fase: 'Jornada 1' },
    // Jornada 2
    { e1: 'Rep. Checa',   e2: 'Sudáfrica',   f: '2026-06-18T12:00:00Z', gr: 'A', fase: 'Jornada 2' },
    { e1: 'Suiza',        e2: 'Bosnia',      f: '2026-06-18T15:00:00Z', gr: 'B', fase: 'Jornada 2' },
    { e1: 'Canadá',       e2: 'Catar',       f: '2026-06-18T18:00:00Z', gr: 'B', fase: 'Jornada 2' },
    { e1: 'México',       e2: 'Rep. Corea',  f: '2026-06-18T21:00:00Z', gr: 'A', fase: 'Jornada 2' },
    { e1: 'EEUU',         e2: 'Australia',   f: '2026-06-19T15:00:00Z', gr: 'D', fase: 'Jornada 2' },
    { e1: 'Escocia',      e2: 'Marruecos',   f: '2026-06-19T18:00:00Z', gr: 'C', fase: 'Jornada 2' },
    { e1: 'Brasil',       e2: 'Haití',       f: '2026-06-19T20:30:00Z', gr: 'C', fase: 'Jornada 2' },
    { e1: 'Turquía',      e2: 'Paraguay',    f: '2026-06-20T23:00:00Z', gr: 'D', fase: 'Jornada 2' },
    { e1: 'Países Bajos', e2: 'Suecia',      f: '2026-06-20T13:00:00Z', gr: 'F', fase: 'Jornada 2' },
    { e1: 'Alemania',     e2: 'C. Marfil',   f: '2026-06-20T16:00:00Z', gr: 'E', fase: 'Jornada 2' },
    { e1: 'Ecuador',      e2: 'Curazao',     f: '2026-06-20T20:00:00Z', gr: 'E', fase: 'Jornada 2' },
    { e1: 'Túnez',        e2: 'Japón',       f: '2026-06-21T00:00:00Z', gr: 'F', fase: 'Jornada 2' },
    { e1: 'España',       e2: 'A. Saudí',    f: '2026-06-21T12:00:00Z', gr: 'H', fase: 'Jornada 2' },
    { e1: 'Bélgica',      e2: 'Irán',        f: '2026-06-21T15:00:00Z', gr: 'G', fase: 'Jornada 2' },
    { e1: 'Uruguay',      e2: 'Cabo Verde',  f: '2026-06-21T18:00:00Z', gr: 'H', fase: 'Jornada 2' },
    { e1: 'N. Zelanda',   e2: 'Egipto',      f: '2026-06-21T21:00:00Z', gr: 'G', fase: 'Jornada 2' },
    { e1: 'Argentina',    e2: 'Austria',     f: '2026-06-22T14:00:00Z', gr: 'J', fase: 'Jornada 2' },
    { e1: 'Jordania',     e2: 'Argelia',     f: '2026-06-22T16:00:00Z', gr: 'J', fase: 'Jornada 2' },
    { e1: 'Francia',      e2: 'Irak',        f: '2026-06-22T17:00:00Z', gr: 'I', fase: 'Jornada 2' },
    { e1: 'Noruega',      e2: 'Senegal',     f: '2026-06-22T20:00:00Z', gr: 'I', fase: 'Jornada 2' },
    { e1: 'Portugal',     e2: 'Uzbekistán',  f: '2026-06-23T13:00:00Z', gr: 'K', fase: 'Jornada 2' },
    { e1: 'Inglaterra',   e2: 'Ghana',       f: '2026-06-23T16:00:00Z', gr: 'L', fase: 'Jornada 2' },
    { e1: 'Panamá',       e2: 'Croacia',     f: '2026-06-23T19:00:00Z', gr: 'L', fase: 'Jornada 2' },
    { e1: 'Colombia',     e2: 'RD Congo',    f: '2026-06-23T22:00:00Z', gr: 'K', fase: 'Jornada 2' },
    // Jornada 3
    { e1: 'Suiza',        e2: 'Canadá',      f: '2026-06-24T16:00:00Z', gr: 'B', fase: 'Jornada 3' },
    { e1: 'Bosnia',       e2: 'Catar',       f: '2026-06-24T16:00:00Z', gr: 'B', fase: 'Jornada 3' },
    { e1: 'Rep. Checa',   e2: 'México',      f: '2026-06-24T19:00:00Z', gr: 'A', fase: 'Jornada 3' },
    { e1: 'Sudáfrica',    e2: 'Rep. Corea',  f: '2026-06-24T19:00:00Z', gr: 'A', fase: 'Jornada 3' },
    { e1: 'Marruecos',    e2: 'Haití',       f: '2026-06-25T18:00:00Z', gr: 'C', fase: 'Jornada 3' },
    { e1: 'Escocia',      e2: 'Brasil',      f: '2026-06-25T18:00:00Z', gr: 'C', fase: 'Jornada 3' },
    { e1: 'Paraguay',     e2: 'Australia',   f: '2026-06-25T22:00:00Z', gr: 'D', fase: 'Jornada 3' },
    { e1: 'Turquía',      e2: 'EEUU',        f: '2026-06-25T22:00:00Z', gr: 'D', fase: 'Jornada 3' },
    { e1: 'Curazao',      e2: 'C. Marfil',   f: '2026-06-26T16:00:00Z', gr: 'E', fase: 'Jornada 3' },
    { e1: 'Ecuador',      e2: 'Alemania',    f: '2026-06-26T16:00:00Z', gr: 'E', fase: 'Jornada 3' },
    { e1: 'Túnez',        e2: 'Países Bajos',f: '2026-06-26T16:00:00Z', gr: 'F', fase: 'Jornada 3' },
    { e1: 'Japón',        e2: 'Suecia',      f: '2026-06-26T16:00:00Z', gr: 'F', fase: 'Jornada 3' },
    { e1: 'Uruguay',      e2: 'España',      f: '2026-06-26T19:00:00Z', gr: 'H', fase: 'Jornada 3' },
    { e1: 'Cabo Verde',   e2: 'A. Saudí',    f: '2026-06-26T19:00:00Z', gr: 'H', fase: 'Jornada 3' },
    { e1: 'N. Zelanda',   e2: 'Bélgica',     f: '2026-06-26T23:00:00Z', gr: 'G', fase: 'Jornada 3' },
    { e1: 'Egipto',       e2: 'Irán',        f: '2026-06-26T23:00:00Z', gr: 'G', fase: 'Jornada 3' },
    { e1: 'Senegal',      e2: 'Irak',        f: '2026-06-27T13:00:00Z', gr: 'I', fase: 'Jornada 3' },
    { e1: 'Noruega',      e2: 'Francia',     f: '2026-06-27T13:00:00Z', gr: 'I', fase: 'Jornada 3' },
    { e1: 'Colombia',     e2: 'Portugal',    f: '2026-06-27T19:30:00Z', gr: 'K', fase: 'Jornada 3' },
    { e1: 'RD Congo',     e2: 'Uzbekistán',  f: '2026-06-27T19:30:00Z', gr: 'K', fase: 'Jornada 3' },
    { e1: 'Panamá',       e2: 'Inglaterra',  f: '2026-06-27T17:00:00Z', gr: 'L', fase: 'Jornada 3' },
    { e1: 'Croacia',      e2: 'Ghana',       f: '2026-06-27T17:00:00Z', gr: 'L', fase: 'Jornada 3' },
    { e1: 'Jordania',     e2: 'Argentina',   f: '2026-06-27T22:00:00Z', gr: 'J', fase: 'Jornada 3' },
    { e1: 'Argelia',      e2: 'Austria',     f: '2026-06-27T22:00:00Z', gr: 'J', fase: 'Jornada 3' },
  ];

  for (const p of gruposData) {
    await prisma.partido.create({
      data: { equipoLocal: p.e1, equipoVisitante: p.e2, fechaHora: new Date(p.f), fase: p.fase, grupo: p.gr },
    });
  }
  console.log(`✅ ${gruposData.length} partidos de grupo creados\n`);

  // ── RONDA DE 32 (32 partidos, equipos TBD) ──────────────────────
  // Los equipos se rellenarán automáticamente al finalizar Jornada 3
  console.log('🏆 Creando fases eliminatorias (equipos TBD)...');

  const R32: { e1: string; e2: string; f: string; sl: string; sv: string; fase: string }[] = [
    // Partido 1: 1A vs 2B
    { e1: 'TBD', e2: 'TBD', f: '2026-07-01T18:00:00Z', sl: '1A', sv: '2B', fase: 'Ronda de 32' },
    // Partido 2: 1B vs 2A
    { e1: 'TBD', e2: 'TBD', f: '2026-07-01T22:00:00Z', sl: '1B', sv: '2A', fase: 'Ronda de 32' },
    // Partido 3: 1C vs 2D
    { e1: 'TBD', e2: 'TBD', f: '2026-07-02T18:00:00Z', sl: '1C', sv: '2D', fase: 'Ronda de 32' },
    // Partido 4: 1D vs 2C
    { e1: 'TBD', e2: 'TBD', f: '2026-07-02T22:00:00Z', sl: '1D', sv: '2C', fase: 'Ronda de 32' },
    // Partido 5: 1E vs 2F
    { e1: 'TBD', e2: 'TBD', f: '2026-07-03T18:00:00Z', sl: '1E', sv: '2F', fase: 'Ronda de 32' },
    // Partido 6: 1F vs 2E
    { e1: 'TBD', e2: 'TBD', f: '2026-07-03T22:00:00Z', sl: '1F', sv: '2E', fase: 'Ronda de 32' },
    // Partido 7: 1G vs 2H
    { e1: 'TBD', e2: 'TBD', f: '2026-07-04T18:00:00Z', sl: '1G', sv: '2H', fase: 'Ronda de 32' },
    // Partido 8: 1H vs 2G
    { e1: 'TBD', e2: 'TBD', f: '2026-07-04T22:00:00Z', sl: '1H', sv: '2G', fase: 'Ronda de 32' },
    // Partido 9: 1I vs 2J
    { e1: 'TBD', e2: 'TBD', f: '2026-07-05T18:00:00Z', sl: '1I', sv: '2J', fase: 'Ronda de 32' },
    // Partido 10: 1J vs 2I
    { e1: 'TBD', e2: 'TBD', f: '2026-07-05T22:00:00Z', sl: '1J', sv: '2I', fase: 'Ronda de 32' },
    // Partido 11: 1K vs 2L
    { e1: 'TBD', e2: 'TBD', f: '2026-07-06T18:00:00Z', sl: '1K', sv: '2L', fase: 'Ronda de 32' },
    // Partido 12: 1L vs 2K
    { e1: 'TBD', e2: 'TBD', f: '2026-07-06T22:00:00Z', sl: '1L', sv: '2K', fase: 'Ronda de 32' },
    // 4 mejores terceros
    { e1: 'TBD', e2: 'TBD', f: '2026-07-07T18:00:00Z', sl: '3A/B', sv: '3C/D', fase: 'Ronda de 32' },
    { e1: 'TBD', e2: 'TBD', f: '2026-07-07T22:00:00Z', sl: '3E/F', sv: '3G/H', fase: 'Ronda de 32' },
    { e1: 'TBD', e2: 'TBD', f: '2026-07-08T18:00:00Z', sl: '3I/J', sv: '3K/L', fase: 'Ronda de 32' },
    { e1: 'TBD', e2: 'TBD', f: '2026-07-08T22:00:00Z', sl: '3BEST', sv: '3BEST2', fase: 'Ronda de 32' },
  ];

  const Octavos: { e1: string; e2: string; f: string; sl: string; sv: string; fase: string }[] = [
    { e1: 'TBD', e2: 'TBD', f: '2026-07-11T18:00:00Z', sl: 'W1R32', sv: 'W2R32',  fase: 'Octavos de Final' },
    { e1: 'TBD', e2: 'TBD', f: '2026-07-11T22:00:00Z', sl: 'W3R32', sv: 'W4R32',  fase: 'Octavos de Final' },
    { e1: 'TBD', e2: 'TBD', f: '2026-07-12T18:00:00Z', sl: 'W5R32', sv: 'W6R32',  fase: 'Octavos de Final' },
    { e1: 'TBD', e2: 'TBD', f: '2026-07-12T22:00:00Z', sl: 'W7R32', sv: 'W8R32',  fase: 'Octavos de Final' },
    { e1: 'TBD', e2: 'TBD', f: '2026-07-13T18:00:00Z', sl: 'W9R32', sv: 'W10R32', fase: 'Octavos de Final' },
    { e1: 'TBD', e2: 'TBD', f: '2026-07-13T22:00:00Z', sl: 'W11R32',sv: 'W12R32', fase: 'Octavos de Final' },
    { e1: 'TBD', e2: 'TBD', f: '2026-07-14T18:00:00Z', sl: 'W13R32',sv: 'W14R32', fase: 'Octavos de Final' },
    { e1: 'TBD', e2: 'TBD', f: '2026-07-14T22:00:00Z', sl: 'W15R32',sv: 'W16R32', fase: 'Octavos de Final' },
  ];

  const Cuartos: { e1: string; e2: string; f: string; sl: string; sv: string; fase: string }[] = [
    { e1: 'TBD', e2: 'TBD', f: '2026-07-17T18:00:00Z', sl: 'W1O', sv: 'W2O', fase: 'Cuartos de Final' },
    { e1: 'TBD', e2: 'TBD', f: '2026-07-17T22:00:00Z', sl: 'W3O', sv: 'W4O', fase: 'Cuartos de Final' },
    { e1: 'TBD', e2: 'TBD', f: '2026-07-18T18:00:00Z', sl: 'W5O', sv: 'W6O', fase: 'Cuartos de Final' },
    { e1: 'TBD', e2: 'TBD', f: '2026-07-18T22:00:00Z', sl: 'W7O', sv: 'W8O', fase: 'Cuartos de Final' },
  ];

  const Semis: { e1: string; e2: string; f: string; sl: string; sv: string; fase: string }[] = [
    { e1: 'TBD', e2: 'TBD', f: '2026-07-21T22:00:00Z', sl: 'W1C', sv: 'W2C', fase: 'Semifinal' },
    { e1: 'TBD', e2: 'TBD', f: '2026-07-22T22:00:00Z', sl: 'W3C', sv: 'W4C', fase: 'Semifinal' },
  ];

  const TercerPuesto = { e1: 'TBD', e2: 'TBD', f: '2026-07-25T18:00:00Z', sl: 'L1S', sv: 'L2S', fase: 'Tercer Puesto' };
  const Final        = { e1: 'TBD', e2: 'TBD', f: '2026-07-26T18:00:00Z', sl: 'W1S', sv: 'W2S', fase: 'Final' };

  for (const p of [...R32, ...Octavos, ...Cuartos, ...Semis, TercerPuesto, Final]) {
    await prisma.partido.create({
      data: {
        equipoLocal: p.e1,
        equipoVisitante: p.e2,
        fechaHora: new Date(p.f),
        fase: p.fase,
        slotLocal: p.sl,
        slotVisitante: p.sv,
      },
    });
  }
  console.log(`✅ ${R32.length + Octavos.length + Cuartos.length + Semis.length + 2} partidos eliminatorios creados (equipos TBD)\n`);

  console.log('✅ Seed completo.');
  console.log('🔑 Admin: cédula=00000000 / password=admin2026\n');
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
