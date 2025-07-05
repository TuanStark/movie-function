-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "images" TEXT DEFAULT 'images.png',
ADD COLUMN     "paymentMethod" TEXT DEFAULT 'CASH';
