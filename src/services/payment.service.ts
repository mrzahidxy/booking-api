import { BookingStatus, PaymentStatus, PropertyKind } from "@prisma/client";
import Stripe from "stripe";
import { getStripe } from "./stripe.service";
import prisma from "../utils/prisma";
import env from "../utils/env";

const BDT_CURRENCY = "bdt";

export const createCheckoutSessionService = async (
  bookingId: number,
  domain: string,
  userId?: number,
  tenantId?: number | null
) => {
  const booking = await prisma.booking.findUnique({
    where: {
      id: bookingId,
    },
    include: {
      payment: true,
      property: true,
    },
  });

  if (!booking) {
    return { statusCode: 404, body: { message: "Booking not found" } };
  }

  if (tenantId && booking.tenantId !== tenantId) {
    return { statusCode: 403, body: { message: "You cannot pay for this booking" } };
  }

  const isHotelBooking = booking.property.kind === PropertyKind.HOTEL;
  const isRestaurantBooking = booking.property.kind === PropertyKind.RESTAURANT;

  if (!isHotelBooking && !isRestaurantBooking) {
    return {
      statusCode: 409,
      body: { message: "Payment is only available for room or restaurant bookings" },
    };
  }

  if (userId && booking.userId !== userId) {
    return { statusCode: 403, body: { message: "You cannot pay for this booking" } };
  }

  if (booking.status !== BookingStatus.PENDING) {
    return {
      statusCode: 409,
      body: { message: "This booking is not payable" },
    };
  }

  const hasSucceededPayment = booking.payment.some(
    (payment) => payment.status === PaymentStatus.SUCCEEDED
  );

  if (hasSucceededPayment) {
    return {
      statusCode: 409,
      body: { message: "This booking has already been paid" },
    };
  }

  const stripe = getStripe();
  const existingPendingPayment = booking.payment
    .slice()
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .find((payment) => payment.status === PaymentStatus.PENDING);

  if (existingPendingPayment?.stripeSessionId) {
    const existingSession = await stripe.checkout.sessions.retrieve(
      existingPendingPayment.stripeSessionId
    );

    if (existingSession.status === "expired") {
      await prisma.payment.update({
        where: { stripeSessionId: existingPendingPayment.stripeSessionId },
        data: { status: PaymentStatus.FAILED },
      });
    } else {
      return {
        statusCode: 200,
        body: {
          sessionId: existingPendingPayment.stripeSessionId,
          paymentStatus: existingPendingPayment.status,
        },
      };
    }
  }

  const amount = Math.round(booking.totalPrice * 100);
  const bookingLabel = isHotelBooking
    ? `Hotel booking #${booking.id}`
    : `Restaurant reservation #${booking.id}`;
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: BDT_CURRENCY,
          product_data: {
            name: bookingLabel,
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${domain}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${domain}/cancel?booking_id=${booking.id}`,
    metadata: {
      bookingId: booking?.id.toString() as string,
      userId: booking.userId.toString(),
      ...(booking.tenantId ? { tenantId: booking.tenantId.toString() } : {}),
    },
    client_reference_id: booking?.id.toString(),
  });

  await prisma.payment.create({
    data: {
      tenantId: booking.tenantId,
      bookingId,
      amount: amount,
      currency: BDT_CURRENCY,
      status: PaymentStatus.PENDING,
      stripeSessionId: session.id,
    },
  });

  return {
    statusCode: 200,
    body: {
      sessionId: session.id,
      paymentStatus: PaymentStatus.PENDING,
    },
  };
};

export const getCheckoutSessionService = async (sessionId: string, userId?: number, tenantId?: number | null) => {
  const payment = await prisma.payment.findUnique({
    where: {
      stripeSessionId: sessionId,
    },
    include: {
      booking: true,
    },
  });

  if (!payment) {
    return { statusCode: 404, body: { message: "Payment not found" } };
  }

  if (tenantId && payment.booking.tenantId !== tenantId) {
    return { statusCode: 403, body: { message: "You cannot view this payment" } };
  }

  if (userId && payment.booking.userId !== userId) {
    return { statusCode: 403, body: { message: "You cannot view this payment" } };
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (
    session.payment_status === "paid" &&
    payment.status !== PaymentStatus.SUCCEEDED
  ) {
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { stripeSessionId: sessionId },
        data: {
          status: PaymentStatus.SUCCEEDED,
          stripePaymentIntentId: session.payment_intent as string,
        },
      });

      await tx.booking.update({
        where: { id: payment.bookingId },
        data: { status: "CONFIRMED" },
      });
    });
  }

  if (
    session.status === "expired" &&
    payment.status === PaymentStatus.PENDING
  ) {
    await prisma.payment.update({
      where: { stripeSessionId: sessionId },
      data: { status: PaymentStatus.FAILED },
    });
  }

  const refreshedPayment = await prisma.payment.findUnique({
    where: {
      stripeSessionId: sessionId,
    },
    include: {
      booking: true,
    },
  });

  return {
    statusCode: 200,
    body: {
      bookingId: refreshedPayment?.bookingId ?? payment.bookingId,
      bookingStatus: refreshedPayment?.booking.status ?? payment.booking.status,
      paymentStatus: refreshedPayment?.status ?? payment.status,
      currency: refreshedPayment?.currency ?? payment.currency,
      amount: refreshedPayment?.amount ?? payment.amount,
      stripeStatus: session.status,
      stripePaymentStatus: session.payment_status,
    },
  };
};

export const handleStripeWebhookEvent = async (payload: Buffer, signature: string | string[]) => {
  const stripe = getStripe();
  const event: Stripe.Event = stripe.webhooks.constructEvent(
    payload,
    signature,
    env.STRIPE_WEBHOOK_SECRET
  );

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.update({
        where: { stripeSessionId: session.id },
        data: {
          status: PaymentStatus.SUCCEEDED,
          stripePaymentIntentId: session.payment_intent as string,
        },
      });

      await tx.booking.update({
        where: { id: payment.bookingId },
        data: { status: "CONFIRMED" },
      });
    });
  }

  if (
    event.type === "checkout.session.expired" ||
    event.type === "checkout.session.async_payment_failed"
  ) {
    const session = event.data.object as Stripe.Checkout.Session;
    await prisma.payment.updateMany({
      where: {
        stripeSessionId: session.id,
        status: PaymentStatus.PENDING,
      },
      data: {
        status: PaymentStatus.FAILED,
      },
    });
  }

  return event;
};

export const cancelCheckoutSessionService = async (bookingId: number, userId?: number, tenantId?: number | null) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      payment: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!booking) {
    return { statusCode: 404, body: { message: "Booking not found" } };
  }

  if (tenantId && booking.tenantId !== tenantId) {
    return { statusCode: 403, body: { message: "You cannot update this booking" } };
  }

  if (userId && booking.userId !== userId) {
    return { statusCode: 403, body: { message: "You cannot update this booking" } };
  }

  const pendingPayment = booking.payment.find((payment) => payment.status === PaymentStatus.PENDING);

  if (!pendingPayment) {
    return {
      statusCode: 200,
      body: {
        bookingId: booking.id,
        bookingStatus: booking.status,
        paymentStatus: booking.payment[0]?.status ?? "UNPAID",
      },
    };
  }

  const updatedPayment = await prisma.payment.update({
    where: { stripeSessionId: pendingPayment.stripeSessionId },
    data: { status: PaymentStatus.FAILED },
  });

  return {
    statusCode: 200,
    body: {
      bookingId: booking.id,
      bookingStatus: booking.status,
      paymentStatus: updatedPayment.status,
    },
  };
};
