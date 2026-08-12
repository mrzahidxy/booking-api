import { Request, Response } from 'express';
import env from '../utils/env';
import {
    createCheckoutSessionService,
    cancelCheckoutSessionService,
    getCheckoutSessionService,
    handleStripeWebhookEvent
} from '../services/payment.service';
export async function createCheckoutSession(req: Request, res: Response) {
    const DOMAIN = env.FRONTEND_URL ?? 'http://localhost:3000';
    const bookingId = Number(req.params.id);

    if (!Number.isInteger(bookingId)) {
        return res.status(400).send({ message: 'Invalid booking id' });
    }

    const result = await createCheckoutSessionService(bookingId, DOMAIN, req.user?.id);
    res.status(result.statusCode).send(result.body);
}

export async function getCheckoutSession(req: Request, res: Response) {
    const sessionId = req.params.sessionId;
    const result = await getCheckoutSessionService(sessionId, req.user?.id);
    res.status(result.statusCode).send(result.body);
}

export async function cancelCheckoutSession(req: Request, res: Response) {
    const bookingId = Number(req.params.bookingId);

    if (!Number.isInteger(bookingId)) {
        return res.status(400).send({ message: "Invalid booking id" });
    }

    const result = await cancelCheckoutSessionService(bookingId, req.user?.id);
    return res.status(result.statusCode).send(result.body);
}



export async function stripeWebhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'];

    try {
        const event = await handleStripeWebhookEvent(req.body, sig!);
        console.log('event', event);
        res.status(200).send('ok');
    } catch (err: any) {
        console.error("⚠️  Webhook signature verification failed.", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

}
