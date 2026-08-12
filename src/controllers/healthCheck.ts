import { Request, Response } from "express";

export const liveCheck = (_req: Request, res: Response) => {
  return res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
};

export const healthCheck = (_req: Request, res: Response) => {
  return res.status(200).json({ status: "ok" });
};
