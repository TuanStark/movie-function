-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "email" TEXT DEFAULT '',
ADD COLUMN     "fisrtName" TEXT DEFAULT '',
ADD COLUMN     "lastName" TEXT DEFAULT '',
ADD COLUMN     "phoneNumber" TEXT DEFAULT '',
ALTER COLUMN "paymentMethod" SET DEFAULT 'BANK_TRANSFER';
