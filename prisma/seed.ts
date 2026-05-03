import {
  BookingStatus,
  PrismaClient,
  RoomType,
  TimeSlotType,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const prisma = new PrismaClient();

const permissions = [
  "GET_USER",
  "UPDATE_USER",
  "GET_ROLE",
  "GET_PERMISSION",
  "GET_ASSIGNED_PERMISSION",
  "ASSIGN_PERMISSION",
  "ASSIGN_ROLE",
  "MANAGE_HOTEL",
  "MANAGE_RESTAURANT",
  "MANAGE_BOOKING",
];

const roles = [
  { name: "ADMIN", permissions },
  {
    name: "STAFF",
    permissions: [
      "GET_USER",
      "UPDATE_USER",
      "MANAGE_HOTEL",
      "MANAGE_RESTAURANT",
      "MANAGE_BOOKING",
    ],
  },
  {
    name: "USER",
    permissions: [],
  },
];

const usersSeed: Array<{
  email: string;
  name: string;
  phone: string;
  roleName: "ADMIN" | "STAFF" | "USER";
  fcmToken?: string;
}> = [
  {
    email: "admin@example.com",
    name: "Arafat Chowdhury",
    phone: "01711000001",
    roleName: "ADMIN",
    fcmToken: "demo-admin-token",
  },
  {
    email: "staff@example.com",
    name: "Mim Akter",
    phone: "01711000002",
    roleName: "STAFF",
    fcmToken: "demo-staff-token",
  },
  {
    email: "user@example.com",
    name: "Arif Rahman",
    phone: "01711000003",
    roleName: "USER",
    fcmToken: "demo-user-token",
  },
  {
    email: "sadia@example.com",
    name: "Sadia Noor",
    phone: "01711000004",
    roleName: "USER",
  },
  {
    email: "farhan@example.com",
    name: "Farhan Hasan",
    phone: "01711000005",
    roleName: "USER",
  },
  {
    email: "nabila@example.com",
    name: "Nabila Hossain",
    phone: "01711000006",
    roleName: "USER",
  },
];

const hotelsSeed = [
  {
    name: "Bayview Grand Resort",
    location: "Cox's Bazar, Bangladesh",
    image: [
      "https://images.unsplash.com/photo-1501117716987-c8e1ecb210cc",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688",
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb",
    ],
    description:
      "A polished beachfront resort with sea-facing rooms, family facilities, and sunset dining.",
    amenities: [
      "Private Beach",
      "Infinity Pool",
      "Airport Shuttle",
      "Kids Club",
      "Spa",
    ],
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
  {
    name: "Hillside Crest Retreat",
    location: "Sajek Valley, Bangladesh",
    image: [
      "https://images.unsplash.com/photo-1518732714860-b62714ce0c59",
      "https://images.unsplash.com/photo-1445019980597-93fa8acb246c",
      "https://images.unsplash.com/photo-1500375592092-40eb2168fd21",
    ],
    description:
      "An eco-lodge with valley views, campfire nights, and adventure-focused guest experiences.",
    amenities: [
      "Bonfire Lounge",
      "Trekking Guide",
      "Rooftop Cafe",
      "24/7 Front Desk",
    ],
    rooms: [
      {
        roomType: RoomType.TWIN,
        price: 110,
        quantity: 10,
        image: ["https://images.unsplash.com/photo-1494526585095-c41746248156"],
        amenities: ["Mountain View", "Shared Deck", "Tea Station"],
      },
      {
        roomType: RoomType.DOUBLE,
        price: 160,
        quantity: 8,
        image: ["https://images.unsplash.com/photo-1560448204-603b3fc33ddc"],
        amenities: ["Private Balcony", "Heated Shower", "Workspace"],
      },
      {
        roomType: RoomType.TRIPLE,
        price: 225,
        quantity: 4,
        image: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750"],
        amenities: ["Camp View", "Sofa Bed", "Breakfast Included"],
      },
    ],
  },
  {
    name: "Capital Suites Dhaka",
    location: "Gulshan, Dhaka, Bangladesh",
    image: [
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d",
    ],
    description:
      "A business-friendly city hotel with executive rooms, boardrooms, and convenient airport access.",
    amenities: [
      "Conference Hall",
      "Rooftop Gym",
      "Airport Transfer",
      "Laundry Service",
      "Business Center",
    ],
    rooms: [
      {
        roomType: RoomType.SINGLE,
        price: 80,
        quantity: 20,
        image: ["https://images.unsplash.com/photo-1505693416388-ac5ce068fe85"],
        amenities: ["Desk Lamp", "Fast Wi-Fi", "City View"],
      },
      {
        roomType: RoomType.DOUBLE,
        price: 130,
        quantity: 14,
        image: ["https://images.unsplash.com/photo-1559599238-308793637427"],
        amenities: ["King Bed", "Streaming TV", "Minibar"],
      },
      {
        roomType: RoomType.TRIPLE,
        price: 185,
        quantity: 5,
        image: ["https://images.unsplash.com/photo-1582719471387-9c8d1f1c7c39"],
        amenities: ["Lounge Area", "Extra Sofa", "Meeting Table"],
      },
    ],
  },
  {
    name: "Riverfront Heritage Inn",
    location: "Sylhet, Bangladesh",
    image: [
      "https://images.unsplash.com/photo-1455587734955-081b22074882",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85",
    ],
    description:
      "A calm riverside stay blending heritage design with modern comfort and tea-country excursions.",
    amenities: [
      "River Deck",
      "Heritage Lounge",
      "Tea Garden Tours",
      "Breakfast Buffet",
    ],
    rooms: [
      {
        roomType: RoomType.DOUBLE,
        price: 125,
        quantity: 16,
        image: ["https://images.unsplash.com/photo-1505691723518-36a5ac3be353"],
        amenities: ["River View", "Balcony", "Reading Chair"],
      },
      {
        roomType: RoomType.TWIN,
        price: 105,
        quantity: 10,
        image: ["https://images.unsplash.com/photo-1494526585095-c41746248156"],
        amenities: ["Separate Beds", "Work Desk", "Tea Maker"],
      },
      {
        roomType: RoomType.TRIPLE,
        price: 175,
        quantity: 6,
        image: ["https://images.unsplash.com/photo-1542314831-068cd1dbfeeb"],
        amenities: ["Family Suite", "Extra Bed", "Sitting Area"],
      },
    ],
  },
  {
    name: "Mangrove Eco Lodge",
    location: "Khulna, Bangladesh",
    image: [
      "https://images.unsplash.com/photo-1496417263034-38ec4f0b665a",
      "https://images.unsplash.com/photo-1468824357306-a439d58ccb1c",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85",
    ],
    description:
      "An eco-conscious lodge for wildlife travelers, with guided tours and locally sourced dining.",
    amenities: [
      "Eco Tours",
      "Solar Power",
      "Nature Walks",
      "Local Cuisine",
      "Boat Hire",
    ],
    rooms: [
      {
        roomType: RoomType.SINGLE,
        price: 70,
        quantity: 14,
        image: ["https://images.unsplash.com/photo-1505693416388-ac5ce068fe85"],
        amenities: ["Garden View", "Mosquito Net", "Ceiling Fan"],
      },
      {
        roomType: RoomType.DOUBLE,
        price: 115,
        quantity: 10,
        image: ["https://images.unsplash.com/photo-1551882547-ff40c63fe5fa"],
        amenities: ["River Breeze", "Balcony", "Eco Toiletries"],
      },
      {
        roomType: RoomType.TRIPLE,
        price: 165,
        quantity: 4,
        image: ["https://images.unsplash.com/photo-1578683010236-d716f9a3f461"],
        amenities: ["Family Setup", "Luggage Rack", "Breakfast Included"],
      },
    ],
  },
] as const satisfies ReadonlyArray<{
  name: string;
  location: string;
  image: string[];
  description: string;
  amenities: string[];
  rooms: Array<{
    roomType: RoomType;
    price: number;
    quantity: number;
    image: string[];
    amenities: string[];
  }>;
}>;

const restaurantsSeed = [
  {
    name: "Skyline Spice Rooftop",
    location: "Dhaka, Bangladesh",
    description:
      "A rooftop dining room serving modern Bangladeshi plates and late-night tasting menus.",
    cuisine: ["Bangladeshi", "Fusion", "Rooftop Dining"],
    timeSlots: [TimeSlotType.EVENING, TimeSlotType.NIGHT],
    image: [
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0",
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
    ],
    seats: 72,
    menu: [
      { name: "Smoked Hilsa Plate", price: 24 },
      { name: "Beef Tehari Bowl", price: 18 },
      { name: "Mango Mousse", price: 9 },
    ],
  },
  {
    name: "Tea Garden Cafe",
    location: "Sylhet, Bangladesh",
    description:
      "A relaxed cafe with tea-pairing menus, baked snacks, and day-time work-friendly seating.",
    cuisine: ["Cafe", "Tea House", "Bakery"],
    timeSlots: [TimeSlotType.MORNING, TimeSlotType.NOON, TimeSlotType.AFTERNOON],
    image: [
      "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17",
      "https://images.unsplash.com/photo-1473093295043-cdd812d0e601",
    ],
    seats: 84,
    menu: [
      { name: "Seven-Layer Tea", price: 5 },
      { name: "Pitha Platter", price: 7 },
      { name: "Chicken Puff", price: 4 },
    ],
  },
  {
    name: "Coastline Grill",
    location: "Cox's Bazar, Bangladesh",
    description:
      "Seafood-forward grill house with family seating and sunset service on the beach side.",
    cuisine: ["Seafood", "Grill", "Family Dining"],
    timeSlots: [TimeSlotType.AFTERNOON, TimeSlotType.EVENING, TimeSlotType.NIGHT],
    image: [
      "https://images.unsplash.com/photo-1547592180-85f173990554",
      "https://images.unsplash.com/photo-1559339352-11d035aa65de",
    ],
    seats: 64,
    menu: [
      { name: "Grilled Prawn Skewer", price: 22 },
      { name: "Herb Butter Fish", price: 26 },
      { name: "Tropical Salad", price: 10 },
    ],
  },
  {
    name: "Heritage Plate",
    location: "Chittagong, Bangladesh",
    description:
      "A destination restaurant spotlighting regional recipes, clay oven breads, and slow braises.",
    cuisine: ["Regional", "Fine Dining", "Clay Oven"],
    timeSlots: [TimeSlotType.NOON, TimeSlotType.AFTERNOON, TimeSlotType.EVENING],
    image: [
      "https://images.unsplash.com/photo-1490645935967-10de6ba17061",
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4",
    ],
    seats: 58,
    menu: [
      { name: "Beef Rezala", price: 20 },
      { name: "Smoked Rice Pilaf", price: 16 },
      { name: "Rasmalai", price: 6 },
    ],
  },
  {
    name: "Mangrove Table",
    location: "Khulna, Bangladesh",
    description:
      "A locally sourced kitchen serving river fish, seasonal vegetables, and shared tasting boards.",
    cuisine: ["Local", "Seasonal", "Shared Plates"],
    timeSlots: [TimeSlotType.MORNING, TimeSlotType.NOON, TimeSlotType.EVENING],
    image: [
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5",
    ],
    seats: 46,
    menu: [
      { name: "Chingri Bhorta Plate", price: 14 },
      { name: "Vegetable Korma", price: 11 },
      { name: "Jaggery Rice Pudding", price: 5 },
    ],
  },
] as const satisfies ReadonlyArray<{
  name: string;
  location: string;
  description: string;
  cuisine: string[];
  timeSlots: TimeSlotType[];
  image: string[];
  seats: number;
  menu: Array<{ name: string; price: number }>;
}>;

type HotelSeed = (typeof hotelsSeed)[number];
type RestaurantSeed = (typeof restaurantsSeed)[number];
type UserSeed = (typeof usersSeed)[number];

function hashPassword() {
  return bcrypt.hash("Password@123", 10);
}

function averageRating(ratings: number[]) {
  const total = ratings.reduce((sum, value) => sum + value, 0);
  return Math.round((total / ratings.length) * 10) / 10;
}

async function resetDatabase() {
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.review.deleteMany();
  await prisma.room.deleteMany();
  await prisma.hotel.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.user.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.permission.deleteMany();
}

async function seedPermissionsAndRoles() {
  for (const permission of permissions) {
    await prisma.permission.create({
      data: { name: permission },
    });
  }

  const permissionRows = await prisma.permission.findMany();

  for (const role of roles) {
    const rolePermissions = permissionRows.filter((permission) =>
      role.permissions.includes(permission.name),
    );

    await prisma.role.create({
      data: {
        name: role.name,
        rolePermission: {
          createMany: {
            data: rolePermissions.map((permission) => ({
              permissionId: permission.id,
            })),
          },
        },
      },
    });
  }
}

async function seedUsers() {
  const password = await hashPassword();
  const roleRows = await prisma.role.findMany();

  const users = [] as Array<{ id: number; email: string; name: string | null }>;

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
      name: created.name,
    });
  }

  return users;
}

async function seedHotels() {
  const hotelRows: Array<{
    id: number;
    name: string;
    location: string;
    rooms: Array<{ id: number; roomType: RoomType; price: number }>;
  }> = [];

  for (const hotel of hotelsSeed) {
    const created = await prisma.hotel.create({
      data: {
        name: hotel.name,
        location: hotel.location,
        description: hotel.description,
        amenities: [...hotel.amenities],
        image: [...hotel.image],
        rooms: {
          create: hotel.rooms.map((room) => ({
            roomType: room.roomType,
            price: room.price,
            quantity: room.quantity,
            image: [...room.image],
            amenities: [...room.amenities],
          })),
        },
      },
    });

    const rooms = await prisma.room.findMany({
      where: { hotelId: created.id },
      orderBy: { id: "asc" },
    });

    hotelRows.push({
      id: created.id,
      name: created.name,
      location: created.location,
      rooms: rooms.map((room) => ({
        id: room.id,
        roomType: room.roomType,
        price: room.price,
      })),
    });
  }

  return hotelRows;
}

async function seedRestaurants() {
  const restaurantRows: Array<{
    id: number;
    name: string;
    location: string;
    menu: RestaurantSeed["menu"];
  }> = [];

  for (const restaurant of restaurantsSeed) {
    const created = await prisma.restaurant.create({
      data: {
        name: restaurant.name,
        description: restaurant.description,
        location: restaurant.location,
        cuisine: [...restaurant.cuisine],
        image: [...restaurant.image],
        seats: restaurant.seats,
        timeSlots: [...restaurant.timeSlots],
        menu: restaurant.menu.map((item) => ({ ...item })),
      },
    });

    restaurantRows.push({
      id: created.id,
      name: created.name,
      location: created.location,
      menu: restaurant.menu,
    });
  }

  return restaurantRows;
}

async function seedReviews(
  users: Array<{ id: number; email: string; name: string | null }>,
  hotels: Array<{ id: number; name: string }>,
  restaurants: Array<{ id: number; name: string }>,
) {
  const hotelReviews = [
    {
      userEmail: "user@example.com",
      hotelName: "Bayview Grand Resort",
      rating: 5,
      review: "Beach access was excellent and the room service was fast.",
    },
    {
      userEmail: "sadia@example.com",
      hotelName: "Bayview Grand Resort",
      rating: 4,
      review: "Great breakfast spread and a very clean pool area.",
    },
    {
      userEmail: "farhan@example.com",
      hotelName: "Hillside Crest Retreat",
      rating: 5,
      review: "Ideal for a quiet mountain escape with genuinely helpful staff.",
    },
    {
      userEmail: "nabila@example.com",
      hotelName: "Hillside Crest Retreat",
      rating: 4,
      review: "The view from the balcony made the stay feel premium.",
    },
    {
      userEmail: "user@example.com",
      hotelName: "Capital Suites Dhaka",
      rating: 4,
      review: "Convenient for meetings and the Wi-Fi was reliable throughout.",
    },
    {
      userEmail: "staff@example.com",
      hotelName: "Capital Suites Dhaka",
      rating: 5,
      review: "Smooth check-in flow, strong service, and very organized facilities.",
    },
    {
      userEmail: "sadia@example.com",
      hotelName: "Riverfront Heritage Inn",
      rating: 5,
      review: "Quiet location with a strong local character and good tea tour access.",
    },
    {
      userEmail: "farhan@example.com",
      hotelName: "Mangrove Eco Lodge",
      rating: 4,
      review: "A practical base for nature trips with thoughtful eco details.",
    },
  ];

  const restaurantReviews = [
    {
      userEmail: "user@example.com",
      restaurantName: "Skyline Spice Rooftop",
      rating: 5,
      review: "The rooftop atmosphere and tasting menu were both memorable.",
    },
    {
      userEmail: "nabila@example.com",
      restaurantName: "Skyline Spice Rooftop",
      rating: 4,
      review: "Good service, good views, and a menu that feels current.",
    },
    {
      userEmail: "sadia@example.com",
      restaurantName: "Tea Garden Cafe",
      rating: 5,
      review: "Easy place to work from with tea options that feel locally specific.",
    },
    {
      userEmail: "farhan@example.com",
      restaurantName: "Tea Garden Cafe",
      rating: 4,
      review: "Solid snack selection and calm daytime seating.",
    },
    {
      userEmail: "user@example.com",
      restaurantName: "Coastline Grill",
      rating: 5,
      review: "Fresh seafood and a layout that works well for families.",
    },
    {
      userEmail: "staff@example.com",
      restaurantName: "Heritage Plate",
      rating: 4,
      review: "The regional dishes felt polished without losing the local taste.",
    },
    {
      userEmail: "sadia@example.com",
      restaurantName: "Mangrove Table",
      rating: 5,
      review: "Seasonal ingredients and balanced menu pricing stood out.",
    },
    {
      userEmail: "nabila@example.com",
      restaurantName: "Mangrove Table",
      rating: 4,
      review: "Good local food and a relaxed atmosphere for group dining.",
    },
  ];

  const createdReviews: Array<{ hotelId?: number; restaurantId?: number; rating: number }> = [];

  for (const review of hotelReviews) {
    const user = users.find((entry) => entry.email === review.userEmail);
    const hotel = hotels.find((entry) => entry.name === review.hotelName);
    if (!user || !hotel) {
      throw new Error(`Missing hotel review relation for ${review.hotelName}`);
    }

    const created = await prisma.review.create({
      data: {
        userId: user.id,
        hotelId: hotel.id,
        rating: review.rating,
        review: review.review,
      },
    });

    createdReviews.push({ hotelId: created.hotelId ?? undefined, rating: created.rating });
  }

  for (const review of restaurantReviews) {
    const user = users.find((entry) => entry.email === review.userEmail);
    const restaurant = restaurants.find((entry) => entry.name === review.restaurantName);
    if (!user || !restaurant) {
      throw new Error(`Missing restaurant review relation for ${review.restaurantName}`);
    }

    const created = await prisma.review.create({
      data: {
        userId: user.id,
        restaurantId: restaurant.id,
        rating: review.rating,
        review: review.review,
      },
    });

    createdReviews.push({
      restaurantId: created.restaurantId ?? undefined,
      rating: created.rating,
    });
  }

  const hotelRatings = hotels.map((hotel) => {
    const ratings = hotelReviews
      .filter((review) => review.hotelName === hotel.name)
      .map((review) => review.rating);
    return {
      id: hotel.id,
      ratings: averageRating(ratings),
    };
  });

  const restaurantRatings = restaurants.map((restaurant) => {
    const ratings = restaurantReviews
      .filter((review) => review.restaurantName === restaurant.name)
      .map((review) => review.rating);
    return {
      id: restaurant.id,
      ratings: averageRating(ratings),
    };
  });

  for (const hotel of hotelRatings) {
    await prisma.hotel.update({
      where: { id: hotel.id },
      data: { ratings: hotel.ratings },
    });
  }

  for (const restaurant of restaurantRatings) {
    await prisma.restaurant.update({
      where: { id: restaurant.id },
      data: { ratings: restaurant.ratings },
    });
  }

  return createdReviews;
}

async function seedBookingsAndPayments(
  users: Array<{ id: number; email: string; name: string | null }>,
  hotels: Array<{
    id: number;
    name: string;
    rooms: Array<{ id: number; roomType: RoomType; price: number }>;
  }>,
  restaurants: Array<{ id: number; name: string }>,
) {
  const bookingSpecs = [
    {
      userEmail: "user@example.com",
      kind: "hotel" as const,
      hotelName: "Bayview Grand Resort",
      roomType: RoomType.DOUBLE,
      bookingDate: new Date("2026-06-10T10:00:00.000Z"),
      roomQuantity: 1,
      totalPrice: 290,
      status: BookingStatus.CONFIRMED,
    },
    {
      userEmail: "sadia@example.com",
      kind: "hotel" as const,
      hotelName: "Hillside Crest Retreat",
      roomType: RoomType.TRIPLE,
      bookingDate: new Date("2026-06-14T10:00:00.000Z"),
      roomQuantity: 1,
      totalPrice: 450,
      status: BookingStatus.PENDING,
    },
    {
      userEmail: "farhan@example.com",
      kind: "hotel" as const,
      hotelName: "Capital Suites Dhaka",
      roomType: RoomType.SINGLE,
      bookingDate: new Date("2026-06-18T10:00:00.000Z"),
      roomQuantity: 2,
      totalPrice: 160,
      status: BookingStatus.COMPLETED,
    },
    {
      userEmail: "nabila@example.com",
      kind: "hotel" as const,
      hotelName: "Riverfront Heritage Inn",
      roomType: RoomType.DOUBLE,
      bookingDate: new Date("2026-06-22T10:00:00.000Z"),
      roomQuantity: 1,
      totalPrice: 250,
      status: BookingStatus.CONFIRMED,
    },
    {
      userEmail: "user@example.com",
      kind: "hotel" as const,
      hotelName: "Mangrove Eco Lodge",
      roomType: RoomType.TRIPLE,
      bookingDate: new Date("2026-06-28T10:00:00.000Z"),
      roomQuantity: 1,
      totalPrice: 330,
      status: BookingStatus.CANCELLED,
    },
    {
      userEmail: "sadia@example.com",
      kind: "restaurant" as const,
      restaurantName: "Skyline Spice Rooftop",
      bookingDate: new Date("2026-06-10T14:00:00.000Z"),
      partySize: 4,
      timeSlot: TimeSlotType.EVENING,
      totalPrice: 88,
      status: BookingStatus.CONFIRMED,
    },
    {
      userEmail: "farhan@example.com",
      kind: "restaurant" as const,
      restaurantName: "Tea Garden Cafe",
      bookingDate: new Date("2026-06-12T08:30:00.000Z"),
      partySize: 2,
      timeSlot: TimeSlotType.MORNING,
      totalPrice: 18,
      status: BookingStatus.COMPLETED,
    },
    {
      userEmail: "nabila@example.com",
      kind: "restaurant" as const,
      restaurantName: "Coastline Grill",
      bookingDate: new Date("2026-06-16T17:30:00.000Z"),
      partySize: 6,
      timeSlot: TimeSlotType.AFTERNOON,
      totalPrice: 136,
      status: BookingStatus.PENDING,
    },
    {
      userEmail: "user@example.com",
      kind: "restaurant" as const,
      restaurantName: "Heritage Plate",
      bookingDate: new Date("2026-06-21T13:00:00.000Z"),
      partySize: 3,
      timeSlot: TimeSlotType.NOON,
      totalPrice: 54,
      status: BookingStatus.CONFIRMED,
    },
    {
      userEmail: "staff@example.com",
      kind: "restaurant" as const,
      restaurantName: "Mangrove Table",
      bookingDate: new Date("2026-06-25T19:00:00.000Z"),
      partySize: 5,
      timeSlot: TimeSlotType.EVENING,
      totalPrice: 70,
      status: BookingStatus.COMPLETED,
    },
  ];

  const bookings = [];

  for (const spec of bookingSpecs) {
    const user = users.find((entry) => entry.email === spec.userEmail);
    if (!user) {
      throw new Error(`Missing booking user ${spec.userEmail}`);
    }

    const bookingData =
      spec.kind === "hotel"
        ? (() => {
            const hotel = hotels.find((entry) => entry.name === spec.hotelName);
            if (!hotel) {
              throw new Error(`Missing hotel ${spec.hotelName}`);
            }

            const room = hotel.rooms.find((entry) => entry.roomType === spec.roomType);
            if (!room) {
              throw new Error(`Missing room type ${spec.roomType} for ${spec.hotelName}`);
            }

            return {
              userId: user.id,
              roomId: room.id,
              bookingDate: spec.bookingDate,
              totalPrice: spec.totalPrice,
              roomQuantity: spec.roomQuantity,
              status: spec.status,
            };
          })()
        : (() => {
            const restaurant = restaurants.find((entry) => entry.name === spec.restaurantName);
            if (!restaurant) {
              throw new Error(`Missing restaurant ${spec.restaurantName}`);
            }

            return {
              userId: user.id,
              restaurantId: restaurant.id,
              bookingDate: spec.bookingDate,
              totalPrice: spec.totalPrice,
              partySize: spec.partySize,
              timeSlot: spec.timeSlot,
              status: spec.status,
            };
          })();

    const booking = await prisma.booking.create({
      data: bookingData,
    });

    bookings.push(booking);

    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: booking.totalPrice,
        currency: "USD",
        status:
          booking.status === BookingStatus.CANCELLED
            ? "FAILED"
            : booking.status === BookingStatus.PENDING
              ? "PENDING"
              : "SUCCEEDED",
        stripeSessionId: `seed-session-${booking.id}`,
        stripePaymentIntentId:
          booking.status === BookingStatus.CANCELLED
            ? `seed-intent-failed-${booking.id}`
            : `seed-intent-${booking.id}`,
      },
    });
  }

  return bookings;
}

async function seedNotifications(
  users: Array<{ id: number; email: string; name: string | null }>,
  bookings: Array<{
    id: number;
    userId: number;
    roomId: number | null;
    restaurantId: number | null;
    status: BookingStatus;
  }>,
) {
  const notifications = [
    {
      email: "user@example.com",
      title: "Room booking confirmed",
      body: "Your Bayview Grand Resort reservation is confirmed for the selected dates.",
      metadata: { type: "booking", category: "hotel" },
    },
    {
      email: "user@example.com",
      title: "Review your stay",
      body: "Share feedback for your recent hotel booking to help future guests.",
      metadata: { type: "review_request", category: "hotel" },
    },
    {
      email: "sadia@example.com",
      title: "Restaurant reservation confirmed",
      body: "Your rooftop dining booking is ready for this evening.",
      metadata: { type: "booking", category: "restaurant" },
    },
    {
      email: "farhan@example.com",
      title: "Payment completed",
      body: "Your restaurant payment was processed successfully.",
      metadata: { type: "payment", category: "restaurant" },
    },
    {
      email: "staff@example.com",
      title: "New booking assigned",
      body: "A new reservation needs front desk attention.",
      metadata: { type: "ops", category: "hotel" },
    },
    {
      email: "nabila@example.com",
      title: "Trip reminder",
      body: "Your upcoming booking is scheduled for this week.",
      metadata: { type: "reminder", category: "travel" },
    },
  ];

  for (const note of notifications) {
    const user = users.find((entry) => entry.email === note.email);
    if (!user) {
      throw new Error(`Missing notification user ${note.email}`);
    }

    await prisma.notification.create({
      data: {
        userId: user.id,
        title: note.title,
        body: note.body,
        metadata: note.metadata,
        read: false,
      },
    });
  }
}

async function main() {
  await resetDatabase();
  await seedPermissionsAndRoles();

  const users = await seedUsers();
  const hotels = await seedHotels();
  const restaurants = await seedRestaurants();
  await seedReviews(users, hotels, restaurants);
  const bookings = await seedBookingsAndPayments(users, hotels, restaurants);
  await seedNotifications(users, bookings);

  console.log(
    "Seeded demo data for permissions, roles, users, hotels, rooms, restaurants, reviews, bookings, payments, and notifications.",
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
