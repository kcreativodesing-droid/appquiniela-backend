import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const isClean = process.argv.includes('--clean') || process.env.CLEAN_SEED === 'true';

async function main() {
  if (isClean) {
    console.log('🧹 Iniciando limpieza y configuración inicial (Clean Seed)...\n');
  } else {
    console.log('🧪 Iniciando prueba completa del sistema (Demo Seed)...\n');
  }

  // ─── 1. LIMPIAR TODO ──────────────────────────────────────────
  console.log('🧹 Limpiando base de datos...');
  await prisma.prediccion.deleteMany();
  await prisma.partido.deleteMany();
  await prisma.usuario.deleteMany();
  console.log('   ✅ Base de datos limpia\n');

  // ─── 2. CREAR USUARIOS ────────────────────────────────────────
  console.log('👥 Creando usuarios...');
  const adminHash = await bcrypt.hash('admin2026', 10);
  const admin = await prisma.usuario.create({
    data: {
      cedula: '00000000',
      nombre: 'Administrador',
      telefono: '0414-0000000',
      passwordHash: adminHash,
      rol: 'ADMIN',
    },
  });
  console.log(`   ✅ Admin: ${admin.nombre} (${admin.cedula})`);

  const usuarios = [];
  if (!isClean) {
    const nombresUsuarios = [
      { cedula: '12345678', nombre: 'Juan Pérez', telefono: '0414-1234567' },
      { cedula: '23456789', nombre: 'María García', telefono: '0412-2345678' },
      { cedula: '34567890', nombre: 'Carlos López', telefono: '0416-3456789' },
      { cedula: '45678901', nombre: 'Ana Rodríguez', telefono: '0424-4567890' },
      { cedula: '56789012', nombre: 'Luis Martínez', telefono: '0426-5678901' },
      { cedula: '67890123', nombre: 'Sofía Hernández', telefono: '0412-6789012' },
      { cedula: '78901234', nombre: 'Diego Ramírez', telefono: '0414-7890123' },
      { cedula: '89012345', nombre: 'Valentina Torres', telefono: '0424-8901234' },
      { cedula: '90123456', nombre: 'Andrés Morales', telefono: '0416-9012345' },
      { cedula: '11223344', nombre: 'Camila Díaz', telefono: '0426-1122334' },
    ];

    for (const u of nombresUsuarios) {
      const hash = await bcrypt.hash('clave123', 10);
      const user = await prisma.usuario.create({
        data: { ...u, passwordHash: hash },
      });
      usuarios.push(user);
      console.log(`   ✅ ${user.nombre} (${user.cedula})`);
    }
    console.log(`   Total: ${usuarios.length + 1} usuarios\n`);
  }

  // ─── 3. CREAR PARTIDOS (las 3 jornadas completas) ─────────────
  console.log('⚽ Creando partidos...');
  const partidosData = [
    // Jornada 1
    { equipoLocal: 'México', equipoVisitante: 'Sudáfrica', fechaHora: '2026-06-11T15:00:00Z', grupo: 'A', fase: 'Jornada 1' },
    { equipoLocal: 'Rep. Corea', equipoVisitante: 'Rep. Checa', fechaHora: '2026-06-11T22:00:00Z', grupo: 'A', fase: 'Jornada 1' },
    { equipoLocal: 'Canadá', equipoVisitante: 'Bosnia', fechaHora: '2026-06-12T15:00:00Z', grupo: 'B', fase: 'Jornada 1' },
    { equipoLocal: 'EEUU', equipoVisitante: 'Paraguay', fechaHora: '2026-06-12T21:00:00Z', grupo: 'D', fase: 'Jornada 1' },
    { equipoLocal: 'Catar', equipoVisitante: 'Suiza', fechaHora: '2026-06-13T15:00:00Z', grupo: 'B', fase: 'Jornada 1' },
    { equipoLocal: 'Brasil', equipoVisitante: 'Marruecos', fechaHora: '2026-06-13T18:00:00Z', grupo: 'C', fase: 'Jornada 1' },
    { equipoLocal: 'Haití', equipoVisitante: 'Escocia', fechaHora: '2026-06-13T21:00:00Z', grupo: 'C', fase: 'Jornada 1' },
    { equipoLocal: 'Australia', equipoVisitante: 'Turquía', fechaHora: '2026-06-14T00:00:00Z', grupo: 'D', fase: 'Jornada 1' },
    { equipoLocal: 'Alemania', equipoVisitante: 'Curazao', fechaHora: '2026-06-14T13:00:00Z', grupo: 'E', fase: 'Jornada 1' },
    { equipoLocal: 'Países Bajos', equipoVisitante: 'Japón', fechaHora: '2026-06-14T16:00:00Z', grupo: 'F', fase: 'Jornada 1' },
    { equipoLocal: 'C. Marfil', equipoVisitante: 'Ecuador', fechaHora: '2026-06-14T19:00:00Z', grupo: 'E', fase: 'Jornada 1' },
    { equipoLocal: 'Suecia', equipoVisitante: 'Túnez', fechaHora: '2026-06-14T22:00:00Z', grupo: 'F', fase: 'Jornada 1' },
    { equipoLocal: 'España', equipoVisitante: 'Cabo Verde', fechaHora: '2026-06-15T12:00:00Z', grupo: 'H', fase: 'Jornada 1' },
    { equipoLocal: 'Bélgica', equipoVisitante: 'Egipto', fechaHora: '2026-06-15T15:00:00Z', grupo: 'G', fase: 'Jornada 1' },
    { equipoLocal: 'A. Saudí', equipoVisitante: 'Uruguay', fechaHora: '2026-06-15T18:00:00Z', grupo: 'H', fase: 'Jornada 1' },
    { equipoLocal: 'Irán', equipoVisitante: 'N. Zelanda', fechaHora: '2026-06-15T21:00:00Z', grupo: 'G', fase: 'Jornada 1' },
    { equipoLocal: 'Francia', equipoVisitante: 'Senegal', fechaHora: '2026-06-16T15:00:00Z', grupo: 'I', fase: 'Jornada 1' },
    { equipoLocal: 'Irak', equipoVisitante: 'Noruega', fechaHora: '2026-06-16T18:00:00Z', grupo: 'I', fase: 'Jornada 1' },
    { equipoLocal: 'Argentina', equipoVisitante: 'Argelia', fechaHora: '2026-06-16T21:00:00Z', grupo: 'J', fase: 'Jornada 1' },
    { equipoLocal: 'Austria', equipoVisitante: 'Jordania', fechaHora: '2026-06-17T00:00:00Z', grupo: 'J', fase: 'Jornada 1' },
    { equipoLocal: 'Portugal', equipoVisitante: 'RD Congo', fechaHora: '2026-06-17T13:00:00Z', grupo: 'K', fase: 'Jornada 1' },
    { equipoLocal: 'Inglaterra', equipoVisitante: 'Croacia', fechaHora: '2026-06-17T16:00:00Z', grupo: 'L', fase: 'Jornada 1' },
    { equipoLocal: 'Ghana', equipoVisitante: 'Panamá', fechaHora: '2026-06-17T19:00:00Z', grupo: 'L', fase: 'Jornada 1' },
    { equipoLocal: 'Uzbekistán', equipoVisitante: 'Colombia', fechaHora: '2026-06-17T22:00:00Z', grupo: 'K', fase: 'Jornada 1' },
    // Jornada 2
    { equipoLocal: 'Rep. Checa', equipoVisitante: 'Sudáfrica', fechaHora: '2026-06-18T12:00:00Z', grupo: 'A', fase: 'Jornada 2' },
    { equipoLocal: 'Suiza', equipoVisitante: 'Bosnia', fechaHora: '2026-06-18T15:00:00Z', grupo: 'B', fase: 'Jornada 2' },
    { equipoLocal: 'Canadá', equipoVisitante: 'Catar', fechaHora: '2026-06-18T18:00:00Z', grupo: 'B', fase: 'Jornada 2' },
    { equipoLocal: 'México', equipoVisitante: 'Rep. Corea', fechaHora: '2026-06-18T21:00:00Z', grupo: 'A', fase: 'Jornada 2' },
    { equipoLocal: 'EEUU', equipoVisitante: 'Australia', fechaHora: '2026-06-19T15:00:00Z', grupo: 'D', fase: 'Jornada 2' },
    { equipoLocal: 'Escocia', equipoVisitante: 'Marruecos', fechaHora: '2026-06-19T18:00:00Z', grupo: 'C', fase: 'Jornada 2' },
    { equipoLocal: 'Brasil', equipoVisitante: 'Haití', fechaHora: '2026-06-19T20:30:00Z', grupo: 'C', fase: 'Jornada 2' },
    { equipoLocal: 'Turquía', equipoVisitante: 'Paraguay', fechaHora: '2026-06-20T23:00:00Z', grupo: 'D', fase: 'Jornada 2' },
    { equipoLocal: 'Países Bajos', equipoVisitante: 'Suecia', fechaHora: '2026-06-20T13:00:00Z', grupo: 'F', fase: 'Jornada 2' },
    { equipoLocal: 'Alemania', equipoVisitante: 'C. Marfil', fechaHora: '2026-06-20T16:00:00Z', grupo: 'E', fase: 'Jornada 2' },
    { equipoLocal: 'Ecuador', equipoVisitante: 'Curazao', fechaHora: '2026-06-20T20:00:00Z', grupo: 'E', fase: 'Jornada 2' },
    { equipoLocal: 'Túnez', equipoVisitante: 'Japón', fechaHora: '2026-06-21T00:00:00Z', grupo: 'F', fase: 'Jornada 2' },
    { equipoLocal: 'España', equipoVisitante: 'A. Saudí', fechaHora: '2026-06-21T12:00:00Z', grupo: 'H', fase: 'Jornada 2' },
    { equipoLocal: 'Bélgica', equipoVisitante: 'Irán', fechaHora: '2026-06-21T15:00:00Z', grupo: 'G', fase: 'Jornada 2' },
    { equipoLocal: 'Uruguay', equipoVisitante: 'Cabo Verde', fechaHora: '2026-06-21T18:00:00Z', grupo: 'H', fase: 'Jornada 2' },
    { equipoLocal: 'Nueva Zelanda', equipoVisitante: 'Egipto', fechaHora: '2026-06-21T21:00:00Z', grupo: 'G', fase: 'Jornada 2' },
    { equipoLocal: 'Argentina', equipoVisitante: 'Austria', fechaHora: '2026-06-22T14:00:00Z', grupo: 'J', fase: 'Jornada 2' },
    { equipoLocal: 'Jordania', equipoVisitante: 'Argelia', fechaHora: '2026-06-22T16:00:00Z', grupo: 'J', fase: 'Jornada 2' },
    { equipoLocal: 'Francia', equipoVisitante: 'Irak', fechaHora: '2026-06-22T17:00:00Z', grupo: 'I', fase: 'Jornada 2' },
    { equipoLocal: 'Noruega', equipoVisitante: 'Senegal', fechaHora: '2026-06-22T20:00:00Z', grupo: 'I', fase: 'Jornada 2' },
    { equipoLocal: 'Portugal', equipoVisitante: 'Uzbekistán', fechaHora: '2026-06-23T13:00:00Z', grupo: 'K', fase: 'Jornada 2' },
    { equipoLocal: 'Inglaterra', equipoVisitante: 'Ghana', fechaHora: '2026-06-23T16:00:00Z', grupo: 'L', fase: 'Jornada 2' },
    { equipoLocal: 'Panamá', equipoVisitante: 'Croacia', fechaHora: '2026-06-23T19:00:00Z', grupo: 'L', fase: 'Jornada 2' },
    { equipoLocal: 'Colombia', equipoVisitante: 'RD Congo', fechaHora: '2026-06-23T22:00:00Z', grupo: 'K', fase: 'Jornada 2' },
    // Jornada 3
    { equipoLocal: 'Suiza', equipoVisitante: 'Canadá', fechaHora: '2026-06-24T16:00:00Z', grupo: 'B', fase: 'Jornada 3' },
    { equipoLocal: 'Bosnia', equipoVisitante: 'Catar', fechaHora: '2026-06-24T16:00:00Z', grupo: 'B', fase: 'Jornada 3' },
    { equipoLocal: 'Rep. Checa', equipoVisitante: 'México', fechaHora: '2026-06-24T19:00:00Z', grupo: 'A', fase: 'Jornada 3' },
    { equipoLocal: 'Sudáfrica', equipoVisitante: 'Rep. Corea', fechaHora: '2026-06-24T19:00:00Z', grupo: 'A', fase: 'Jornada 3' },
    { equipoLocal: 'Marruecos', equipoVisitante: 'Haití', fechaHora: '2026-06-25T18:00:00Z', grupo: 'C', fase: 'Jornada 3' },
    { equipoLocal: 'Escocia', equipoVisitante: 'Brasil', fechaHora: '2026-06-25T18:00:00Z', grupo: 'C', fase: 'Jornada 3' },
    { equipoLocal: 'Paraguay', equipoVisitante: 'Australia', fechaHora: '2026-06-25T22:00:00Z', grupo: 'D', fase: 'Jornada 3' },
    { equipoLocal: 'Turquía', equipoVisitante: 'EEUU', fechaHora: '2026-06-25T22:00:00Z', grupo: 'D', fase: 'Jornada 3' },
    { equipoLocal: 'Curazao', equipoVisitante: 'C. Marfil', fechaHora: '2026-06-26T16:00:00Z', grupo: 'E', fase: 'Jornada 3' },
    { equipoLocal: 'Ecuador', equipoVisitante: 'Alemania', fechaHora: '2026-06-26T16:00:00Z', grupo: 'E', fase: 'Jornada 3' },
    { equipoLocal: 'Túnez', equipoVisitante: 'Países Bajos', fechaHora: '2026-06-26T16:00:00Z', grupo: 'F', fase: 'Jornada 3' },
    { equipoLocal: 'Japón', equipoVisitante: 'Suecia', fechaHora: '2026-06-26T16:00:00Z', grupo: 'F', fase: 'Jornada 3' },
    { equipoLocal: 'Uruguay', equipoVisitante: 'España', fechaHora: '2026-06-26T19:00:00Z', grupo: 'H', fase: 'Jornada 3' },
    { equipoLocal: 'Cabo Verde', equipoVisitante: 'A. Saudí', fechaHora: '2026-06-26T19:00:00Z', grupo: 'H', fase: 'Jornada 3' },
    { equipoLocal: 'Nueva Zelanda', equipoVisitante: 'Bélgica', fechaHora: '2026-06-26T23:00:00Z', grupo: 'G', fase: 'Jornada 3' },
    { equipoLocal: 'Egipto', equipoVisitante: 'Irán', fechaHora: '2026-06-26T23:00:00Z', grupo: 'G', fase: 'Jornada 3' },
    { equipoLocal: 'Senegal', equipoVisitante: 'Irak', fechaHora: '2026-06-27T13:00:00Z', grupo: 'I', fase: 'Jornada 3' },
    { equipoLocal: 'Noruega', equipoVisitante: 'Francia', fechaHora: '2026-06-27T13:00:00Z', grupo: 'I', fase: 'Jornada 3' },
    { equipoLocal: 'Colombia', equipoVisitante: 'Portugal', fechaHora: '2026-06-27T19:30:00Z', grupo: 'K', fase: 'Jornada 3' },
    { equipoLocal: 'RD Congo', equipoVisitante: 'Uzbekistán', fechaHora: '2026-06-27T19:30:00Z', grupo: 'K', fase: 'Jornada 3' },
    { equipoLocal: 'Panamá', equipoVisitante: 'Inglaterra', fechaHora: '2026-06-27T17:00:00Z', grupo: 'L', fase: 'Jornada 3' },
    { equipoLocal: 'Croacia', equipoVisitante: 'Ghana', fechaHora: '2026-06-27T17:00:00Z', grupo: 'L', fase: 'Jornada 3' },
    { equipoLocal: 'Jordania', equipoVisitante: 'Argentina', fechaHora: '2026-06-27T22:00:00Z', grupo: 'J', fase: 'Jornada 3' },
    { equipoLocal: 'Argelia', equipoVisitante: 'Austria', fechaHora: '2026-06-27T22:00:00Z', grupo: 'J', fase: 'Jornada 3' },
  ];

  const partidos = [];
  for (const p of partidosData) {
    const partido = await prisma.partido.create({
      data: {
        equipoLocal: p.equipoLocal,
        equipoVisitante: p.equipoVisitante,
        fechaHora: new Date(p.fechaHora),
        fase: p.fase,
        grupo: p.grupo,
      },
    });
    partidos.push(partido);
  }
  console.log(`   ✅ ${partidos.length} partidos creados\n`);

  if (isClean) {
    console.log(`\n✅ Base de datos limpia e inicializada para producción.`);
    console.log(`🔑 Credenciales del Administrador:`);
    console.log(`   Admin:    cédula=00000000   password=admin2026\n`);
    return;
  }

  // ─── 4. GENERAR PREDICCIONES ALEATORIAS ────────────────────────
  console.log('🎯 Generando predicciones aleatorias para los primeros 6 partidos...');

  // Tomamos los primeros 6 partidos (los que vamos a "jugar")
  const partidosAJugar = partidos.slice(0, 6);
  let totalPreds = 0;

  for (const partido of partidosAJugar) {
    for (const user of usuarios) {
      const predLocal = Math.floor(Math.random() * 4);
      const predVisitante = Math.floor(Math.random() * 4);

      await prisma.prediccion.create({
        data: {
          usuarioId: user.id,
          partidoId: partido.id,
          predGolesLocal: predLocal,
          predGolesVisitante: predVisitante,
        },
      });
      totalPreds++;
    }
  }
  console.log(`   ✅ ${totalPreds} predicciones creadas (${usuarios.length} usuarios × ${partidosAJugar.length} partidos)\n`);

  // ─── 5. FINALIZAR 3 PARTIDOS CON RESULTADOS ───────────────────
  console.log('🏁 Finalizando partidos con resultados simulados...');

  const resultadosSimulados = [
    { index: 0, golesLocal: 2, golesVisitante: 1 },  // México 2-1 Sudáfrica
    { index: 1, golesLocal: 0, golesVisitante: 0 },  // Rep. Corea 0-0 Rep. Checa
    { index: 2, golesLocal: 1, golesVisitante: 3 },  // Canadá 1-3 Bosnia
  ];

  for (const res of resultadosSimulados) {
    const partido = partidosAJugar[res.index];

    // Actualizar el partido
    await prisma.partido.update({
      where: { id: partido.id },
      data: {
        golesLocal: res.golesLocal,
        golesVisitante: res.golesVisitante,
        estado: 'Finalizado',
      },
    });

    console.log(`   ⚽ ${partido.equipoLocal} ${res.golesLocal}-${res.golesVisitante} ${partido.equipoVisitante}`);

    // Calcular puntos para cada predicción
    const predicciones = await prisma.prediccion.findMany({
      where: { partidoId: partido.id },
      include: { usuario: true },
    });

    let exactos = 0, parciales = 0, fallos = 0;

    for (const pred of predicciones) {
      let puntos = 0;
      let tipo = 'fallo';

      // Resultado exacto
      if (pred.predGolesLocal === res.golesLocal && pred.predGolesVisitante === res.golesVisitante) {
        puntos = 3;
        tipo = 'exacto';
        exactos++;
      }
      // Resultado parcial (acertó el ganador o empate)
      else {
        const predResultado = Math.sign(pred.predGolesLocal - pred.predGolesVisitante);
        const realResultado = Math.sign(res.golesLocal - res.golesVisitante);
        if (predResultado === realResultado) {
          puntos = 1;
          tipo = 'parcial';
          parciales++;
        } else {
          fallos++;
        }
      }

      // Guardar puntos en predicción
      await prisma.prediccion.update({
        where: { id: pred.id },
        data: { puntosObtenidos: puntos },
      });

      // Sumar al usuario
      if (puntos > 0) {
        await prisma.usuario.update({
          where: { id: pred.usuarioId },
          data: { puntosTotales: { increment: puntos } },
        });
      }
    }

    console.log(`      → 🎯 ${exactos} exactos | ✅ ${parciales} parciales | ❌ ${fallos} fallos`);
  }

  // ─── 6. MOSTRAR RANKING FINAL ─────────────────────────────────
  console.log('\n🏆 RANKING ACTUAL:');
  console.log('─'.repeat(50));

  const ranking = await prisma.usuario.findMany({
    where: { rol: 'USER' },
    orderBy: { puntosTotales: 'desc' },
    select: { nombre: true, cedula: true, puntosTotales: true },
  });

  ranking.forEach((u, i) => {
    const medalla = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
    console.log(`   ${medalla} ${u.nombre.padEnd(20)} ${u.puntosTotales} pts`);
  });

  console.log('─'.repeat(50));
  console.log(`\n✅ Prueba completa finalizada exitosamente.`);
  console.log(`\n🔑 Credenciales:`);
  console.log(`   Admin:    cédula=00000000   password=admin2026`);
  console.log(`   Usuarios: cédula=12345678   password=clave123`);
  console.log(`             (y las demás cédulas creadas arriba)\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
