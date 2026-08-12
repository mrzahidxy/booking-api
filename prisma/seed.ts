import {
  BookingStatus,
  PaymentStatus,
  Prisma,
  PrismaClient,
  PropertyKind,
  RoomType,
  TenantMemberRole,
  TimeSlotType,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { slugify } from "../src/utils/slug";

dotenv.config({ path: ".env" });

const prisma = new PrismaClient();
const PAYMENT_CURRENCY = "bdt";

type SeedUser = {
  email: string;
  name: string;
  phone: string;
  roleName: "ADMIN" | "USER";
  fcmToken?: string;
};

type SeedRoom = {
  roomType: RoomType;
  price: number;
  quantity: number;
  image: string[];
  amenities: string[];
};

type SeedReview = {
  userEmail: string;
  rating: number;
  review: string;
};

type HotelBookingSeed = {
  kind: "hotel";
  userEmail: string;
  bookingDate: Date;
  roomType: RoomType;
  roomQuantity: number;
  totalPrice: number;
  status: BookingStatus;
};

type RestaurantBookingSeed = {
  kind: "restaurant";
  userEmail: string;
  bookingDate: Date;
  partySize: number;
  timeSlot: TimeSlotType;
  totalPrice: number;
  status: BookingStatus;
};

type BookingSeed = HotelBookingSeed | RestaurantBookingSeed;

type SeedNotification = {
  email: string;
  title: string;
  body: string;
  metadata: Record<string, unknown>;
};

type TenantSeed = {
  tenant: {
    name: string;
    slug: string;
  };
  members: {
    ownerEmail: string;
    staffEmail: string;
  };
  property: {
    kind: PropertyKind;
    name: string;
    location: string;
    image: string[];
    description: string | null;
    amenities: string[];
    cuisine: string[];
    timeSlots: TimeSlotType[];
    seats: number | null;
    menu: Array<{ name: string; price: number }> | null;
    rooms: SeedRoom[];
  };
  reviews: SeedReview[];
  bookings: BookingSeed[];
  notifications: SeedNotification[];
};

const permissions = [
  "GET_USER",
  "UPDATE_USER",
  "GET_ROLE",
  "GET_PERMISSION",
  "GET_ASSIGNED_PERMISSION",
  "ASSIGN_PERMISSION",
  "ASSIGN_ROLE",
] as const;

const roles: Array<{ name: "ADMIN" | "USER"; permissions: readonly string[] }> = [
  { name: "ADMIN", permissions: [...permissions] },
  { name: "USER", permissions: [] },
];

const usersSeed: SeedUser[] = [
  {
    email: "admin@example.com",
    name: "Platform Admin",
    phone: "01711000001",
    roleName: "ADMIN",
    fcmToken: "demo-admin-token",
  },
  {
    email: "owner@example.com",
    name: "Tenant Owner",
    phone: "01711000002",
    roleName: "USER",
    fcmToken: "demo-owner-token",
  },
  {
    email: "staff@example.com",
    name: "Tenant Staff",
    phone: "01711000003",
    roleName: "USER",
    fcmToken: "demo-staff-token",
  },
  {
    email: "user@example.com",
    name: "Regular User",
    phone: "01711000004",
    roleName: "USER",
    fcmToken: "demo-user-token",
  },
  {
    email: "restaurant-owner@example.com",
    name: "Restaurant Owner",
    phone: "01711000005",
    roleName: "USER",
    fcmToken: "demo-restaurant-owner-token",
  },
  {
    email: "restaurant-staff@example.com",
    name: "Restaurant Staff",
    phone: "01711000006",
    roleName: "USER",
    fcmToken: "demo-restaurant-staff-token",
  },
  {
    email: "restaurant-user@example.com",
    name: "Restaurant Guest",
    phone: "01711000007",
    roleName: "USER",
    fcmToken: "demo-restaurant-user-token",
  },
];

const tenantSeeds: TenantSeed[] = [
  {
    tenant: {
      name: "Gontobbo Seaside Tenant",
      slug: "gontobbo-seaside",
    },
    members: {
      ownerEmail: "owner@example.com",
      staffEmail: "staff@example.com",
    },
    property: {
      kind: PropertyKind.HOTEL,
      name: "Bayview Grand Resort",
      location: "Cox's Bazar, Bangladesh",
      image: [
        "https://images.unsplash.com/photo-1501117716987-c8e1ecb210cc",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688",
        "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb",
      ],
      description:
        "A polished beachfront resort with sea-facing rooms, family facilities, and sunset dining.",
      amenities: ["Private Beach", "Infinity Pool", "Airport Shuttle", "Kids Club", "Spa"],
      cuisine: [],
      timeSlots: [],
      seats: null,
      menu: null,
      rooms: [
        {
          roomType: RoomType.SINGLE,
          price: 95,
          quantity: 12,
          image: ["https://images.unsplash.com/photo-1505693416388-ac5ce068fe85"],
          amenities: ["City View", "Work Desk", "Complimentary Breakfast"],
        },
        {
          roomType: RoomType.DOUBLE,
          price: 145,
          quantity: 18,
          image: ["https://images.unsplash.com/photo-1505691938895-1758d7feb511"],
          amenities: ["Balcony", "Ocean View", "Mini Bar"],
        },
        {
          roomType: RoomType.TRIPLE,
          price: 210,
          quantity: 6,
          image: ["https://images.unsplash.com/photo-1505691723518-36a5ac3be353"],
          amenities: ["Living Area", "Extra Bed", "Family Friendly"],
        },
      ],
    },
    reviews: [
      {
        userEmail: "user@example.com",
        rating: 5,
        review: "Beach access was excellent and the room service was fast.",
      },
      {
        userEmail: "admin@example.com",
        rating: 4,
        review: "Good service flow and a strong beachfront setting.",
      },
      {
        userEmail: "owner@example.com",
        rating: 5,
        review: "Comfortable rooms and helpful staff throughout the stay.",
      },
    ],
    bookings: [
      {
        kind: "hotel",
        userEmail: "user@example.com",
        bookingDate: new Date("2026-06-10T10:00:00.000Z"),
        roomType: RoomType.DOUBLE,
        roomQuantity: 1,
        totalPrice: 290,
        status: BookingStatus.CONFIRMED,
      },
      {
        kind: "hotel",
        userEmail: "owner@example.com",
        bookingDate: new Date("2026-06-14T10:00:00.000Z"),
        roomType: RoomType.TRIPLE,
        roomQuantity: 1,
        totalPrice: 450,
        status: BookingStatus.PENDING,
      },
      {
        kind: "hotel",
        userEmail: "staff@example.com",
        bookingDate: new Date("2026-06-18T10:00:00.000Z"),
        roomType: RoomType.SINGLE,
        roomQuantity: 2,
        totalPrice: 160,
        status: BookingStatus.COMPLETED,
      },
    ],
    notifications: [
      {
        email: "user@example.com",
        title: "Room booking confirmed",
        body: "Your Bayview Grand Resort reservation is confirmed for the selected dates.",
        metadata: { type: "booking", category: "hotel" },
      },
      {
        email: "owner@example.com",
        title: "Review your stay",
        body: "Share feedback for your recent hotel booking to help future guests.",
        metadata: { type: "review_request", category: "hotel" },
      },
      {
        email: "staff@example.com",
        title: "Booking ready",
        body: "A new reservation needs front desk attention.",
        metadata: { type: "ops", category: "hotel" },
      },
    ],
  },
  {
    tenant: {
      name: "Gontobbo Taste Tenant",
      slug: "gontobbo-taste",
    },
    members: {
      ownerEmail: "restaurant-owner@example.com",
      staffEmail: "restaurant-staff@example.com",
    },
    property: {
      kind: PropertyKind.RESTAURANT,
      name: "Skyline Spice Rooftop",
      location: "Dhaka, Bangladesh",
      image: [
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0",
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
      ],
      description:
        "A rooftop dining room serving modern Bangladeshi plates and late-night tasting menus.",
      amenities: [],
      cuisine: ["Bangladeshi", "Fusion", "Rooftop Dining"],
      timeSlots: [TimeSlotType.EVENING, TimeSlotType.NIGHT],
      seats: 72,
      menu: [
        { name: "Smoked Hilsa Plate", price: 24 },
        { name: "Beef Tehari Bowl", price: 18 },
        { name: "Mango Mousse", price: 9 },
      ],
      rooms: [],
    },
    reviews: [
      {
        userEmail: "restaurant-user@example.com",
        rating: 5,
        review: "The rooftop atmosphere and tasting menu were both memorable.",
      },
      {
        userEmail: "admin@example.com",
        rating: 4,
        review: "Good views, smooth service, and a menu that feels current.",
      },
      {
        userEmail: "restaurant-owner@example.com",
        rating: 5,
        review: "Strong kitchen timing and a polished dining room experience.",
      },
    ],
    bookings: [
      {
        kind: "restaurant",
        userEmail: "restaurant-user@example.com",
        bookingDate: new Date("2026-06-10T14:00:00.000Z"),
        partySize: 4,
        timeSlot: TimeSlotType.EVENING,
        totalPrice: 88,
        status: BookingStatus.CONFIRMED,
      },
      {
        kind: "restaurant",
        userEmail: "restaurant-owner@example.com",
        bookingDate: new Date("2026-06-12T08:30:00.000Z"),
        partySize: 2,
        timeSlot: TimeSlotType.MORNING,
        totalPrice: 18,
        status: BookingStatus.COMPLETED,
      },
      {
        kind: "restaurant",
        userEmail: "restaurant-staff@example.com",
        bookingDate: new Date("2026-06-16T17:30:00.000Z"),
        partySize: 6,
        timeSlot: TimeSlotType.AFTERNOON,
        totalPrice: 136,
        status: BookingStatus.PENDING,
      },
    ],
    notifications: [
      {
        email: "restaurant-user@example.com",
        title: "Restaurant reservation confirmed",
        body: "Your rooftop dining booking is ready for this evening.",
        metadata: { type: "booking", category: "restaurant" },
      },
      {
        email: "restaurant-owner@example.com",
        title: "Payment completed",
        body: "Your restaurant payment was processed successfully.",
        metadata: { type: "payment", category: "restaurant" },
      },
      {
        email: "restaurant-staff@example.com",
        title: "New booking assigned",
        body: "A new restaurant reservation needs attention.",
        metadata: { type: "ops", category: "restaurant" },
      },
    ],
  },
];

type SeedUserRow = {
  id: number;
  email: string;
};

type SeedRoomRow = {
  id: number;
  roomType: RoomType;
  price: number;
};

type SeedBookingRow = {
  id: number;
  userId: number;
  roomId: number | null;
  status: BookingStatus;
};

function paymentAmount(totalPrice: number) {
  return Math.round(totalPrice * 100);
}

function paymentStatusForBooking(status: BookingStatus) {
  if (status === BookingStatus.PENDING) return PaymentStatus.PENDING;
  if (status === BookingStatus.CANCELLED) return PaymentStatus.FAILED;
  return PaymentStatus.SUCCEEDED;
}

function averageRating(ratings: number[]) {
  const total = ratings.reduce((sum, value) => sum + value, 0);
  return Math.round((total / ratings.length) * 10) / 10;
}

async function resetDatabase() {
  await prisma.$executeRawUnsafe(`
    DO $$
    DECLARE
      table_name text;
    BEGIN
      FOR table_name IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename <> '_prisma_migrations'
      LOOP
        EXECUTE format('TRUNCATE TABLE %I RESTART IDENTITY CASCADE;', table_name);
      END LOOP;
    END $$;
  `);
}

async function seedPermissionsAndRoles() {
  for (const permission of permissions) {
    await prisma.permission.create({ data: { name: permission } });
  }

  const permissionRows = await prisma.permission.findMany({
    orderBy: { id: "asc" },
  });

  for (const role of roles) {
    const createdRole = await prisma.role.create({
      data: { name: role.name },
    });

    const scopedPermissions = permissionRows.filter((permission) =>
      role.permissions.includes(permission.name),
    );

    if (scopedPermissions.length > 0) {
      await prisma.rolePermission.createMany({
        data: scopedPermissions.map((permission) => ({
          roleId: createdRole.id,
          permissionId: permission.id,
        })),
      });
    }
  }
}

async function seedUsers() {
  const password = await bcrypt.hash("Password@123", 10);
  const roleRows = await prisma.role.findMany({
    orderBy: { id: "asc" },
  });

  const users: SeedUserRow[] = [];

  for (const user of usersSeed) {
    const role = roleRows.find((entry) => entry.name === user.roleName);
    if (!role) {
      throw new Error(`Missing role ${user.roleName}`);
    }

    const created = await prisma.user.create({
      data: {
        email: user.email,
        name: user.name,
        phone: user.phone,
        password,
        roleId: role.id,
        ...(user.fcmToken ? { fcmToken: user.fcmToken } : {}),
      },
    });

    users.push({
      id: created.id,
      email: created.email,
    });
  }

  return users;
}

async function seedTenant(tenantSeed: TenantSeed, users: SeedUserRow[]) {
  const tenant = await prisma.tenant.create({
    data: tenantSeed.tenant,
  });

  const owner = users.find((user) => user.email === tenantSeed.members.ownerEmail);
  const staff = users.find((user) => user.email === tenantSeed.members.staffEmail);

  if (!owner || !staff) {
    throw new Error(`Missing tenant members for ${tenantSeed.tenant.slug}`);
  }

  await prisma.tenantMember.createMany({
    data: [
      {
        tenantId: tenant.id,
        userId: owner.id,
        role: TenantMemberRole.OWNER,
      },
      {
        tenantId: tenant.id,
        userId: staff.id,
        role: TenantMemberRole.STAFF,
      },
    ],
  });

  const property = await prisma.property.create({
    data: {
      tenantId: tenant.id,
      kind: tenantSeed.property.kind,
      slug: slugify(tenantSeed.property.name),
      name: tenantSeed.property.name,
      location: tenantSeed.property.location,
      description: tenantSeed.property.description,
      image: tenantSeed.property.image,
      amenities: tenantSeed.property.amenities,
      cuisine: tenantSeed.property.cuisine,
      timeSlots: tenantSeed.property.timeSlots,
      seats: tenantSeed.property.seats,
      menu: tenantSeed.property.menu === null ? Prisma.DbNull : tenantSeed.property.menu,
      rooms: tenantSeed.property.rooms.length
        ? {
            create: tenantSeed.property.rooms.map((room) => ({
              roomType: room.roomType,
              price: room.price,
              quantity: room.quantity,
              image: [...room.image],
              amenities: [...room.amenities],
            })),
          }
        : undefined,
    },
    include: {
      rooms: true,
    },
  });

  const reviews = await seedReviews(users, tenantSeed.reviews, property.id);
  const bookings = await seedBookingsAndPayments(
    users,
    tenantSeed.bookings,
    {
      id: property.id,
      kind: tenantSeed.property.kind,
      rooms: property.rooms,
    },
    tenant.id,
  );
  await seedNotifications(users, tenantSeed.notifications, bookings);

  await prisma.property.update({
    where: { id: property.id },
    data: { ratings: averageRating(reviews.map((review) => review.rating)) },
  });

  return {
    tenant,
    property,
  };
}

async function seedReviews(
  users: SeedUserRow[],
  reviews: SeedReview[],
  propertyId: number,
) {
  const createdReviews: Array<{ rating: number }> = [];

  for (const review of reviews) {
    const user = users.find((entry) => entry.email === review.userEmail);

    if (!user) {
      throw new Error(`Missing review user ${review.userEmail}`);
    }

    const created = await prisma.review.create({
      data: {
        userId: user.id,
        propertyId,
        rating: review.rating,
        review: review.review,
      },
    });

    createdReviews.push({ rating: created.rating });
  }

  return createdReviews;
}

async function seedBookingsAndPayments(
  users: SeedUserRow[],
  bookingSeeds: BookingSeed[],
  property: { id: number; rooms: Array<{ id: number; roomType: RoomType }>; kind: PropertyKind },
  tenantId: number,
) {
  const bookings: SeedBookingRow[] = [];

  for (const spec of bookingSeeds) {
    const user = users.find((entry) => entry.email === spec.userEmail);
    if (!user) {
      throw new Error(`Missing booking user ${spec.userEmail}`);
    }

    const bookingData =
      spec.kind === "hotel"
        ? (() => {
            const room = property.rooms.find((entry) => entry.roomType === spec.roomType);

            if (!room) {
              throw new Error(`Missing room type ${spec.roomType}`);
            }

            return {
              tenantId,
              propertyId: property.id,
              userId: user.id,
              roomId: room.id,
              bookingDate: spec.bookingDate,
              totalPrice: spec.totalPrice,
              roomQuantity: spec.roomQuantity,
              status: spec.status,
            };
          })()
        : {
            tenantId,
            propertyId: property.id,
            userId: user.id,
            roomId: null,
            bookingDate: spec.bookingDate,
            totalPrice: spec.totalPrice,
            partySize: spec.partySize,
            timeSlot: spec.timeSlot,
            status: spec.status,
          };

    const booking = await prisma.booking.create({
      data: bookingData,
    });

    bookings.push(booking);

    const status = paymentStatusForBooking(booking.status);
    await prisma.payment.create({
      data: {
        tenantId,
        bookingId: booking.id,
        amount: paymentAmount(booking.totalPrice),
        currency: PAYMENT_CURRENCY,
        status,
        stripeSessionId: `seed-session-${booking.id}`,
        stripePaymentIntentId:
          status === PaymentStatus.SUCCEEDED ? `seed-intent-${booking.id}` : null,
      },
    });
  }

  return bookings;
}

async function seedNotifications(
  users: SeedUserRow[],
  notifications: SeedNotification[],
  bookings: SeedBookingRow[],
) {
  const bookingByUserId = new Map<number, SeedBookingRow[]>();

  for (const booking of bookings) {
    const existing = bookingByUserId.get(booking.userId) ?? [];
    existing.push(booking);
    bookingByUserId.set(booking.userId, existing);
  }

  for (const note of notifications) {
    const user = users.find((entry) => entry.email === note.email);

    if (!user) {
      throw new Error(`Missing notification user ${note.email}`);
    }

    const relevantBooking = bookingByUserId.get(user.id)?.[0];

    await prisma.notification.create({
      data: {
        userId: user.id,
        title: note.title,
        body: note.body,
        metadata: relevantBooking
          ? ({ ...note.metadata, bookingId: relevantBooking.id } as Prisma.InputJsonValue)
          : (note.metadata as Prisma.InputJsonValue),
        read: false,
      },
    });
  }
}

async function main() {
  await resetDatabase();
  await seedPermissionsAndRoles();

  const users = await seedUsers();

  for (const tenantSeed of tenantSeeds) {
    await seedTenant(tenantSeed, users);
  }

  console.log(
    "Seeded demo data for permissions, roles, users, multiple tenants, properties, rooms, reviews, bookings, payments, and notifications.",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
