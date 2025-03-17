import { PrismaClient } from "@prisma/client";
import { GetSummaryInput } from "../schema/schema";
import { Request, Response } from "express";

const prisma = new PrismaClient();

export const getSummary = async (req: Request, res: Response) => {
  try {
    const { id, language } = GetSummaryInput.parse(req.query);
    const summaries = await prisma.summary.findMany({
      where: {
        videoId: id,
        language: language,
      },
    });
    if (!summaries.length) {
      throw new Error("Videos not found");
    }
    res.send(summaries);
  } catch (error: any) {
    res.status(500).send(error.message);
  }
};
