-- AlterTable
ALTER TABLE "candidates" ADD COLUMN     "archivoNombre" TEXT,
ADD COLUMN     "archivoRuta" TEXT,
ADD COLUMN     "archivoTipo" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'user';
