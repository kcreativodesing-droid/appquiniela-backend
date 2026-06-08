-- CreateEnum
CREATE TYPE "EstadoPartido" AS ENUM ('Pendiente', 'En Juego', 'Finalizado');

-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'USER');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "cedula" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "password_hash" TEXT NOT NULL,
    "puntos_totales" INTEGER NOT NULL DEFAULT 0,
    "rol" "Rol" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partidos" (
    "id" TEXT NOT NULL,
    "api_fixture_id" TEXT,
    "equipo_local" TEXT NOT NULL,
    "equipo_visitante" TEXT NOT NULL,
    "fecha_hora" TIMESTAMP(3) NOT NULL,
    "goles_local" INTEGER,
    "goles_visitante" INTEGER,
    "estado" "EstadoPartido" NOT NULL DEFAULT 'Pendiente',
    "fase" TEXT NOT NULL DEFAULT 'Grupos',
    "grupo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "predicciones" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "partido_id" TEXT NOT NULL,
    "pred_goles_local" INTEGER NOT NULL,
    "pred_goles_visitante" INTEGER NOT NULL,
    "puntos_obtenidos" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "predicciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_cedula_key" ON "usuarios"("cedula");

-- CreateIndex
CREATE INDEX "usuarios_cedula_idx" ON "usuarios"("cedula");

-- CreateIndex
CREATE UNIQUE INDEX "partidos_api_fixture_id_key" ON "partidos"("api_fixture_id");

-- CreateIndex
CREATE INDEX "partidos_estado_idx" ON "partidos"("estado");

-- CreateIndex
CREATE INDEX "partidos_fecha_hora_idx" ON "partidos"("fecha_hora");

-- CreateIndex
CREATE INDEX "predicciones_usuario_id_idx" ON "predicciones"("usuario_id");

-- CreateIndex
CREATE INDEX "predicciones_partido_id_idx" ON "predicciones"("partido_id");

-- CreateIndex
CREATE UNIQUE INDEX "predicciones_usuario_id_partido_id_key" ON "predicciones"("usuario_id", "partido_id");

-- AddForeignKey
ALTER TABLE "predicciones" ADD CONSTRAINT "predicciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predicciones" ADD CONSTRAINT "predicciones_partido_id_fkey" FOREIGN KEY ("partido_id") REFERENCES "partidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
