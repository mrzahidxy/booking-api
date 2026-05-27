import swaggerJSDoc, { Options } from "swagger-jsdoc";
import env from "../utils/env";

const resolveServerUrls = () => {
  const servers: { url: string; description: string }[] = [];

  if (env.SERVER_URL) {
    servers.push({ url: env.SERVER_URL, description: "Production" });
  }

  servers.push({
    url: `http://localhost:${env.PORT}`,
    description: "Local",
  });

  return servers;
};

const swaggerDefinition = {
  openapi: "3.0.1",
  info: {
    title: "Booking App API",
    version: "1.0.0",
    description:
      "API documentation for the Booking App (properties, bookings, payments, notifications, admin, roles, and users).",
  },
  servers: resolveServerUrls(),
  tags: [
    { name: "Health" },
    { name: "Auth" },
    { name: "Properties" },
    { name: "Bookings" },
    { name: "Payments" },
    { name: "Images" },
    { name: "Notifications" },
    { name: "Reviews" },
    { name: "Admin" },
    { name: "Roles & Permissions" },
    { name: "Users" },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      ApiResponse: {
        type: "object",
        properties: {
          message: { type: "string" },
          statusCode: { type: "integer" },
          data: { type: "object", nullable: true, additionalProperties: true },
          body: { type: "object", nullable: true, additionalProperties: true },
        },
        required: ["message", "statusCode"],
      },
      PaginationMeta: {
        type: "object",
        properties: {
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 10 },
          totalPages: { type: "integer", example: 5 },
          totalItems: { type: "integer", example: 50 },
        },
      },
      SignUpRequest: {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8 },
          name: { type: "string" },
        },
        required: ["email", "password"],
      },
      LoginRequest: {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8 },
        },
        required: ["email", "password"],
      },
      Room: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          roomType: { type: "string", enum: ["SINGLE", "DOUBLE", "TWIN", "TRIPLE"] },
          price: { type: "number", example: 120 },
          image: { type: "array", items: { type: "string" } },
          amenities: { type: "array", items: { type: "string" } },
          quantity: { type: "integer", example: 2 },
        },
      },
      HotelPayload: {
        type: "object",
        properties: {
          name: { type: "string" },
          location: { type: "string" },
          image: { type: "array", items: { type: "string" } },
          description: { type: "string" },
          amenities: { type: "array", items: { type: "string" } },
          rooms: { type: "array", items: { $ref: "#/components/schemas/Room" } },
        },
        required: ["name", "location"],
      },
      RestaurantPayload: {
        type: "object",
        properties: {
          name: { type: "string" },
          location: { type: "string" },
          description: { type: "string" },
          cuisine: { type: "array", items: { type: "string" } },
          seats: { type: "integer" },
          menu: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                price: { type: "number" },
              },
            },
          },
          image: { type: "array", items: { type: "string" } },
        },
        required: ["name", "location"],
      },
      ReservationRequest: {
        type: "object",
        properties: {
          propertyId: { type: "integer" },
          restaurantId: { type: "integer", deprecated: true },
          bookingDate: { type: "string", format: "date-time" },
          timeSlot: {
            type: "string",
            enum: ["MORNING", "NOON", "AFTERNOON", "EVENING", "NIGHT"],
          },
          partySize: { type: "integer" },
        },
        required: ["propertyId", "bookingDate", "timeSlot", "partySize"],
      },
      RoomBookingRequest: {
        type: "object",
        properties: {
          roomId: { type: "integer" },
          bookingDate: { type: "string", format: "date" },
          quantity: { type: "integer" },
        },
        required: ["roomId", "bookingDate", "quantity"],
      },
      BookingStatusUpdateRequest: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"],
          },
          type: { type: "string", enum: ["room", "restaurant"] },
        },
        required: ["status"],
      },
      ReviewRequest: {
        type: "object",
        properties: {
          propertyId: { type: "integer" },
          hotelId: { type: "integer", deprecated: true },
          restaurantId: { type: "integer", deprecated: true },
          rating: { type: "integer", minimum: 1, maximum: 5 },
          review: { type: "string" },
        },
        required: ["propertyId", "rating", "review"],
      },
      AssignPermissionsRequest: {
        type: "object",
        properties: {
          roleId: { type: "integer" },
          permissionIds: { type: "array", items: { type: "integer" } },
        },
        required: ["roleId", "permissionIds"],
      },
      AssignRoleRequest: {
        type: "object",
        properties: {
          roleId: { type: "integer" },
        },
        required: ["roleId"],
      },
      FcmTokenRequest: {
        type: "object",
        properties: { fcmToken: { type: "string" } },
        required: ["fcmToken"],
      },
      TenantStatusUpdateRequest: {
        type: "object",
        properties: {
          isActive: { type: "boolean" },
        },
        required: ["isActive"],
      },
      CreateOwnerRequest: {
        type: "object",
        properties: {
          userId: { type: "integer", example: 12 },
          tenantName: { type: "string" },
          tenantSlug: { type: "string", description: "Optional custom slug for the tenant" },
        },
        required: ["userId", "tenantName"],
      },
      CreateOwnerData: {
        type: "object",
        properties: {
          user: {
            type: "object",
            properties: {
              id: { type: "integer", example: 1 },
              email: { type: "string", example: "owner@example.com" },
              name: { type: "string", example: "Tenant Owner" },
              phone: { type: "string", nullable: true, example: "01711000002" },
              roleId: { type: "integer", example: 2 },
              fcmToken: { type: "string", nullable: true },
              createdAt: { type: "string", format: "date-time" },
              updateAt: { type: "string", format: "date-time" },
            },
          },
          tenant: {
            type: "object",
            properties: {
              id: { type: "integer", example: 1 },
              name: { type: "string", example: "My Hotel" },
              slug: { type: "string", example: "my-hotel" },
              isActive: { type: "boolean", example: true },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
          tenantMembership: {
            type: "object",
            properties: {
              id: { type: "integer", example: 1 },
              tenantId: { type: "integer", example: 1 },
              userId: { type: "integer", example: 1 },
              role: { type: "string", enum: ["OWNER", "STAFF"] },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
              tenant: {
                type: "object",
                nullable: true,
                properties: {
                  id: { type: "integer", example: 1 },
                  name: { type: "string", example: "My Hotel" },
                  slug: { type: "string", example: "my-hotel" },
                  isActive: { type: "boolean", example: true },
                },
              },
            },
          },
        },
      },
      CreateOwnerResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "Owner created successfully" },
          statusCode: { type: "integer", example: 201 },
          data: { $ref: "#/components/schemas/CreateOwnerData" },
        },
        required: ["message", "statusCode", "data"],
      },
      CreateCheckoutSessionResponse: {
        type: "object",
        properties: {
          sessionId: { type: "string" },
          paymentStatus: { type: "string" },
        },
        required: ["sessionId", "paymentStatus"],
      },
      CheckoutSessionResponse: {
        type: "object",
        properties: {
          bookingId: { type: "integer" },
          bookingStatus: { type: "string" },
          paymentStatus: { type: "string" },
          currency: { type: "string" },
          amount: { type: "number" },
          stripeStatus: { type: "string" },
          stripePaymentStatus: { type: "string" },
        },
        required: [
          "bookingId",
          "bookingStatus",
          "paymentStatus",
          "currency",
          "amount",
          "stripeStatus",
          "stripePaymentStatus",
        ],
      },
      CancelCheckoutSessionResponse: {
        type: "object",
        properties: {
          bookingId: { type: "integer" },
          bookingStatus: { type: "string" },
          paymentStatus: { type: "string" },
        },
        required: ["bookingId", "bookingStatus", "paymentStatus"],
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: {
          200: { description: "Service is up" },
        },
      },
    },
    "/api/auth/signup": {
      post: {
        tags: ["Auth"],
        summary: "Sign up",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SignUpRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "User registered",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } },
            },
          },
          400: { description: "Validation error" },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "User logged in",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } },
            },
          },
          400: { description: "Invalid credentials" },
        },
      },
    },
    "/api/properties/hotels": {
      get: {
        tags: ["Properties"],
        summary: "List hotel properties",
        parameters: [
          { in: "query", name: "page", schema: { type: "integer" } },
          { in: "query", name: "limit", schema: { type: "integer" } },
        ],
        responses: {
          200: {
            description: "Paginated hotels",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } },
            },
          },
        },
      },
      post: {
        tags: ["Properties"],
        summary: "Create hotel property",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/HotelPayload" } },
          },
        },
        responses: {
          201: {
            description: "Hotel created",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } },
            },
          },
          400: { description: "Validation error" },
        },
      },
    },
    "/api/properties/hotels/{id}": {
      get: {
        tags: ["Properties"],
        summary: "Get hotel property details",
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "integer" } },
        ],
        responses: {
          200: {
            description: "Hotel details",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } },
            },
          },
          404: { description: "Not found" },
        },
      },
      put: {
        tags: ["Properties"],
        summary: "Update hotel property",
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "integer" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/HotelPayload" } },
          },
        },
        responses: {
          200: {
            description: "Hotel updated",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } },
            },
          },
        },
      },
      delete: {
        tags: ["Properties"],
        summary: "Delete hotel property",
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "integer" } },
        ],
        responses: {
          200: { description: "Hotel deleted" },
        },
      },
    },
    "/api/properties/hotels/search/result": {
      get: {
        tags: ["Properties"],
        summary: "Search hotel properties",
        parameters: [
          { in: "query", name: "location", schema: { type: "string" } },
          { in: "query", name: "name", schema: { type: "string" } },
          { in: "query", name: "roomType", schema: { type: "string" } },
          { in: "query", name: "minPrice", schema: { type: "string" } },
          { in: "query", name: "maxPrice", schema: { type: "string" } },
          { in: "query", name: "page", schema: { type: "integer" } },
          { in: "query", name: "limit", schema: { type: "integer" } },
        ],
        responses: {
          200: {
            description: "Search results",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } },
            },
          },
        },
      },
    },
    "/api/properties/restaurants": {
      get: {
        tags: ["Properties"],
        summary: "List restaurant properties",
        parameters: [
          { in: "query", name: "page", schema: { type: "integer" } },
          { in: "query", name: "limit", schema: { type: "integer" } },
        ],
        responses: {
          200: {
            description: "Paginated restaurants",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } },
            },
          },
        },
      },
      post: {
        tags: ["Properties"],
        summary: "Create restaurant property",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RestaurantPayload" },
            },
          },
        },
        responses: {
          201: {
            description: "Restaurant created",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } },
            },
          },
        },
      },
    },
    "/api/properties/restaurants/{id}": {
      get: {
        tags: ["Properties"],
        summary: "Get restaurant property details",
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "integer" } },
        ],
        responses: {
          200: { description: "Restaurant details" },
          404: { description: "Not found" },
        },
      },
      put: {
        tags: ["Properties"],
        summary: "Update restaurant property",
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "integer" } },
        ],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  location: { type: "string" },
                  cuisine: { type: "array", items: { type: "string" } },
                  seats: { type: "integer" },
                  menu: { type: "string", description: "JSON encoded array of menu items" },
                  timeSlots: { type: "array", items: { type: "string" } },
                  description: { type: "string" },
                  image: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Restaurant updated" },
        },
      },
      delete: {
        tags: ["Properties"],
        summary: "Delete restaurant property",
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "integer" } },
        ],
        responses: {
          200: { description: "Restaurant deleted" },
        },
      },
    },
    "/api/properties/restaurants/search/result": {
      get: {
        tags: ["Properties"],
        summary: "Search restaurant properties",
        parameters: [
          { in: "query", name: "name", schema: { type: "string" } },
          { in: "query", name: "location", schema: { type: "string" } },
          { in: "query", name: "ratings", schema: { type: "string" } },
          { in: "query", name: "cuisine", schema: { type: "string" } },
          { in: "query", name: "page", schema: { type: "integer" } },
          { in: "query", name: "limit", schema: { type: "integer" } },
        ],
        responses: {
          200: { description: "Search results" },
        },
      },
    },
    "/api/bookings/check-restaurant": {
      get: {
        tags: ["Bookings"],
        summary: "Check restaurant table availability",
        parameters: [
          { in: "query", name: "propertyId", required: true, schema: { type: "integer" } },
          { in: "query", name: "restaurantId", schema: { type: "integer", deprecated: true } },
          { in: "query", name: "date", required: true, schema: { type: "string", format: "date" } },
          { in: "query", name: "partySize", schema: { type: "integer" } },
          {
            in: "query",
            name: "timeSlot",
            required: true,
            schema: {
              type: "string",
              enum: ["MORNING", "NOON", "AFTERNOON", "EVENING", "NIGHT"],
            },
          },
        ],
        responses: {
          200: { description: "Availability result" },
        },
      },
    },
    "/api/bookings/restaurant": {
      post: {
        tags: ["Bookings"],
        summary: "Book a restaurant table",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ReservationRequest" },
            },
          },
        },
        responses: {
          200: { description: "Reservation created" },
          400: { description: "Validation error" },
        },
      },
    },
    "/api/bookings": {
      get: {
        tags: ["Bookings"],
        summary: "List current user bookings",
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: "query", name: "page", schema: { type: "integer" } },
          { in: "query", name: "limit", schema: { type: "integer" } },
        ],
        responses: {
          200: { description: "Bookings list" },
        },
      },
    },
    "/api/bookings/admin": {
      get: {
        tags: ["Bookings"],
        summary: "List all bookings (admin)",
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: "query", name: "page", schema: { type: "integer" } },
          { in: "query", name: "limit", schema: { type: "integer" } },
        ],
        responses: {
          200: { description: "Bookings list" },
        },
      },
    },
    "/api/bookings/status/{id}": {
      put: {
        tags: ["Bookings"],
        summary: "Update booking status",
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "integer" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/BookingStatusUpdateRequest" },
            },
          },
        },
        responses: {
          200: { description: "Status updated" },
        },
      },
    },
    "/api/bookings/room": {
      post: {
        tags: ["Bookings"],
        summary: "Book a room",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/RoomBookingRequest" } },
          },
        },
        responses: {
          201: { description: "Room booked" },
          400: { description: "Validation error" },
        },
      },
    },
    "/api/bookings/check-room": {
      get: {
        tags: ["Bookings"],
        summary: "Check room availability (alias)",
        parameters: [
          { in: "query", name: "roomId", required: true, schema: { type: "integer" } },
          { in: "query", name: "date", required: true, schema: { type: "string", format: "date" } },
          { in: "query", name: "quantity", required: true, schema: { type: "integer" } },
        ],
        responses: {
          200: { description: "Availability result" },
        },
      },
    },
    "/api/admin/stats": {
      get: {
        tags: ["Admin"],
        summary: "Get admin dashboard stats",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "Dashboard stats" },
        },
      },
    },
    "/api/admin/owners": {
      post: {
        tags: ["Admin"],
        summary: "Create a tenant for an existing user",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateOwnerRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Owner created",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/CreateOwnerResponse" } },
            },
          },
          400: { description: "Validation error or duplicate user" },
          401: { description: "Platform admin access required" },
        },
      },
    },
    "/api/admin/tenants": {
      get: {
        tags: ["Admin"],
        summary: "List tenants",
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: "query", name: "page", schema: { type: "integer" } },
          { in: "query", name: "limit", schema: { type: "integer" } },
        ],
        responses: {
          200: { description: "Tenants list" },
        },
      },
    },
    "/api/admin/tenants/{id}": {
      get: {
        tags: ["Admin"],
        summary: "Get tenant details",
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "integer" } },
        ],
        responses: {
          200: { description: "Tenant details" },
          404: { description: "Tenant not found" },
        },
      },
    },
    "/api/admin/tenants/{id}/status": {
      patch: {
        tags: ["Admin"],
        summary: "Update tenant status",
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "integer" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/TenantStatusUpdateRequest" },
            },
          },
        },
        responses: {
          200: { description: "Tenant status updated" },
          400: { description: "Invalid tenant status" },
          404: { description: "Tenant not found" },
        },
      },
    },
    "/api/payments/{id}": {
      post: {
        tags: ["Payments"],
        summary: "Create Stripe checkout session for booking",
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "integer" }, description: "Booking ID" },
        ],
        responses: {
          200: {
            description: "Session created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateCheckoutSessionResponse" },
              },
            },
          },
          404: { description: "Booking not found" },
          409: { description: "Booking not payable" },
        },
      },
    },
    "/api/payments/{bookingId}/cancel": {
      post: {
        tags: ["Payments"],
        summary: "Cancel a pending checkout session",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "bookingId",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          200: {
            description: "Session cancelled",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CancelCheckoutSessionResponse" },
              },
            },
          },
          404: { description: "Booking not found" },
        },
      },
    },
    "/api/payments/session/{sessionId}": {
      get: {
        tags: ["Payments"],
        summary: "Get checkout session status",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "sessionId",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Session details",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CheckoutSessionResponse" },
              },
            },
          },
          404: { description: "Payment not found" },
        },
      },
    },
    "/api/payments/webhook": {
      post: {
        tags: ["Payments"],
        summary: "Stripe webhook",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { type: "object" } },
          },
        },
        responses: {
          200: { description: "Webhook processed" },
          400: { description: "Signature verification failed" },
        },
      },
    },
    "/api/images/upload": {
      post: {
        tags: ["Images"],
        summary: "Upload image to Cloudinary",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  image: { type: "string", format: "binary" },
                },
                required: ["image"],
              },
            },
          },
        },
        responses: {
          200: { description: "Image uploaded" },
        },
      },
    },
    "/api/notifications": {
      get: {
        tags: ["Notifications"],
        summary: "Get user notifications",
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: "query", name: "page", schema: { type: "integer" } },
          { in: "query", name: "limit", schema: { type: "integer" } },
        ],
        responses: {
          200: { description: "Notifications list" },
        },
      },
    },
    "/api/notifications/{id}/read": {
      patch: {
        tags: ["Notifications"],
        summary: "Mark notification as read",
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "integer" } },
        ],
        responses: {
          200: { description: "Notification updated" },
        },
      },
    },
    "/api/reviews": {
      get: {
        tags: ["Reviews"],
        summary: "List reviews",
        parameters: [
          { in: "query", name: "page", schema: { type: "integer" } },
          { in: "query", name: "limit", schema: { type: "integer" } },
          { in: "query", name: "propertyId", schema: { type: "integer" } },
          { in: "query", name: "hotelId", schema: { type: "integer" } },
          { in: "query", name: "restaurantId", schema: { type: "integer" } },
        ],
        responses: {
          200: { description: "Reviews list" },
        },
      },
      post: {
        tags: ["Reviews"],
        summary: "Create review",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ReviewRequest" } },
          },
        },
        responses: {
          201: { description: "Review created" },
        },
      },
    },
    "/api/reviews/{id}": {
      put: {
        tags: ["Reviews"],
        summary: "Update review",
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "integer" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { rating: { type: "integer" }, review: { type: "string" } },
              },
            },
          },
        },
        responses: {
          200: { description: "Review updated" },
        },
      },
      delete: {
        tags: ["Reviews"],
        summary: "Delete review",
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "integer" } },
        ],
        responses: {
          200: { description: "Review deleted" },
        },
      },
    },
    "/api/role-permission/roles": {
      get: {
        tags: ["Roles & Permissions"],
        summary: "List roles",
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: "query", name: "page", schema: { type: "integer" } },
          { in: "query", name: "limit", schema: { type: "integer" } },
        ],
        responses: {
          200: { description: "Roles list" },
        },
      },
    },
    "/api/role-permission/roles/{id}": {
      get: {
        tags: ["Roles & Permissions"],
        summary: "Get role by id",
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "integer" } },
        ],
        responses: {
          200: { description: "Role details" },
        },
      },
    },
    "/api/role-permission/permissions": {
      get: {
        tags: ["Roles & Permissions"],
        summary: "List permissions",
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: "query", name: "page", schema: { type: "integer" } },
          { in: "query", name: "limit", schema: { type: "integer" } },
        ],
        responses: {
          200: { description: "Permissions list" },
        },
      },
    },
    "/api/role-permission/permissions/{id}": {
      get: {
        tags: ["Roles & Permissions"],
        summary: "Get permission by id",
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "integer" } },
        ],
        responses: {
          200: { description: "Permission details" },
        },
      },
    },
    "/api/role-permission/assigned-permissions": {
      get: {
        tags: ["Roles & Permissions"],
        summary: "List assigned permissions",
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: "query", name: "page", schema: { type: "integer" } },
          { in: "query", name: "limit", schema: { type: "integer" } },
        ],
        responses: {
          200: { description: "Assigned permissions list" },
        },
      },
      post: {
        tags: ["Roles & Permissions"],
        summary: "Assign permissions to a role",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AssignPermissionsRequest" },
            },
          },
        },
        responses: {
          200: { description: "Permissions assigned" },
        },
      },
    },
    "/api/role-permission/assigned-permissions/{id}": {
      get: {
        tags: ["Roles & Permissions"],
        summary: "Get permissions for a role",
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "integer" } },
        ],
        responses: {
          200: { description: "Role permissions" },
        },
      },
    },
    "/api/role-permission/assigned-permissions/edit": {
      put: {
        tags: ["Roles & Permissions"],
        summary: "Replace permissions for a role",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AssignPermissionsRequest" },
            },
          },
        },
        responses: {
          200: { description: "Permissions updated" },
        },
      },
    },
    "/api/role-permission/assigned-roles": {
      get: {
        tags: ["Roles & Permissions"],
        summary: "List users with roles",
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: "query", name: "page", schema: { type: "integer" } },
          { in: "query", name: "limit", schema: { type: "integer" } },
        ],
        responses: {
          200: { description: "User roles" },
        },
      },
    },
    "/api/role-permission/assigned-roles/{id}": {
      get: {
        tags: ["Roles & Permissions"],
        summary: "Get role for a user",
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "integer" } },
        ],
        responses: {
          200: { description: "User role" },
        },
      },
      post: {
        tags: ["Roles & Permissions"],
        summary: "Assign role to user",
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "integer" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/AssignRoleRequest" } },
          },
        },
        responses: {
          201: { description: "Role assigned" },
        },
      },
    },
    "/api/users": {
      get: {
        tags: ["Users"],
        summary: "List users",
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: "query", name: "page", schema: { type: "integer" } },
          { in: "query", name: "limit", schema: { type: "integer" } },
        ],
        responses: {
          200: { description: "Users list" },
        },
      },
    },
    "/api/users/me": {
      get: {
        tags: ["Users"],
        summary: "Get current user",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "Current user" },
        },
      },
      put: {
        tags: ["Users"],
        summary: "Update current user",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", additionalProperties: true },
            },
          },
        },
        responses: {
          200: { description: "Current user updated" },
        },
      },
    },
    "/api/users/{id}": {
      get: {
        tags: ["Users"],
        summary: "Get user by id",
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "integer" } },
        ],
        responses: {
          200: { description: "User detail" },
        },
      },
      put: {
        tags: ["Users"],
        summary: "Update user",
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "integer" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", additionalProperties: true },
            },
          },
        },
        responses: {
          200: { description: "User updated" },
        },
      },
    },
    "/api/users/fcm": {
      put: {
        tags: ["Users"],
        summary: "Save Firebase token",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/FcmTokenRequest" } },
          },
        },
        responses: {
          200: { description: "Token saved" },
        },
      },
    },
  },
};

const options: Options = {
  definition: swaggerDefinition,
  apis: [],
};

export const swaggerSpec = swaggerJSDoc(options);
