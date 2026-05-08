-- Breaking domain simplification: one tenant owns one property total.

DROP TABLE IF EXISTS "Payment" CASCADE;
DROP TABLE IF EXISTS "Booking" CASCADE;
DROP TABLE IF EXISTS "Review" CASCADE;
DROP TABLE IF EXISTS "Room" CASCADE;
DROP TABLE IF EXISTS "Hotel" CASCADE;
DROP TABLE IF EXISTS "Restaurant" CASCADE;

CREATE TYPE "PropertyKind" AS ENUM ('HOTEL', 'RESTAURANT');

CREATE TABLE "Property" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "kind" "PropertyKind" NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "image" TEXT[] NOT NULL,
    "description" TEXT,
    "amenities" TEXT[] NOT NULL,
    "cuisine" TEXT[] NOT NULL,
    "timeSlots" "TimeSlotType"[] NOT NULL,
    "seats" INTEGER,
    "menu" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ratings" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Property_tenantId_key" ON "Property"("tenantId");
CREATE UNIQUE INDEX "Property_slug_key" ON "Property"("slug");
CREATE INDEX "Property_kind_idx" ON "Property"("kind");
CREATE INDEX "Property_location_idx" ON "Property"("location");

ALTER TABLE "Property"
ADD CONSTRAINT "Property_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "Room" (
    "id" SERIAL NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "image" TEXT[] NOT NULL,
    "roomType" "RoomType" NOT NULL DEFAULT 'SINGLE',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "amenities" TEXT[] NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Room_propertyId_idx" ON "Room"("propertyId");

ALTER TABLE "Room"
ADD CONSTRAINT "Room_propertyId_fkey"
FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Review" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "review" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Review_propertyId_idx" ON "Review"("propertyId");

ALTER TABLE "Review"
ADD CONSTRAINT "Review_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Review"
ADD CONSTRAINT "Review_propertyId_fkey"
FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Booking" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "roomId" INTEGER,
    "bookingDate" TIMESTAMP(3) NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "roomQuantity" INTEGER,
    "partySize" INTEGER,
    "timeSlot" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Booking_roomId_bookingDate_idx" ON "Booking"("roomId", "bookingDate");
CREATE INDEX "Booking_propertyId_bookingDate_idx" ON "Booking"("propertyId", "bookingDate");
CREATE INDEX "Booking_tenantId_bookingDate_idx" ON "Booking"("tenantId", "bookingDate");
CREATE INDEX "Booking_tenantId_status_idx" ON "Booking"("tenantId", "status");

ALTER TABLE "Booking"
ADD CONSTRAINT "Booking_propertyId_fkey"
FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Booking"
ADD CONSTRAINT "Booking_roomId_fkey"
FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Booking"
ADD CONSTRAINT "Booking_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Booking"
ADD CONSTRAINT "Booking_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "Payment" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "stripeSessionId" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Payment_stripeSessionId_key" ON "Payment"("stripeSessionId");
CREATE INDEX "Payment_tenantId_idx" ON "Payment"("tenantId");
CREATE INDEX "Payment_tenantId_status_idx" ON "Payment"("tenantId", "status");
CREATE INDEX "Payment_bookingId_idx" ON "Payment"("bookingId");

ALTER TABLE "Payment"
ADD CONSTRAINT "Payment_bookingId_fkey"
FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Payment"
ADD CONSTRAINT "Payment_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

DROP INDEX IF EXISTS "TenantMember_tenantId_userId_key";
CREATE UNIQUE INDEX "TenantMember_userId_key" ON "TenantMember"("userId");
