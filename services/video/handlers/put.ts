import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { UpdateAudioUrlSchema, UpdateSummarySchema } from "../schema/schema";

const primsaClient = new PrismaClient();

export const updateVideoSummary = async (req: Request, res: Response) => {
    try {
        const { id } = req.query;
        if (!id || typeof id !== 'string') {
            return res.status(400).json({ error: "Valid ID is required" });
        }
        const validatedBody = UpdateSummarySchema.parse(req.body);
        const { summary, language } = validatedBody;
        const existingVideo = await primsaClient.video.findUnique({
            where: { id: id as string },
        });
        if (!existingVideo) {
            throw new Error("No video found with this id");
        }
        const currentSummaries = existingVideo?.summaries as Record<string, string> || {};
        const updatedSummaries = {
            ...currentSummaries,
            [language]: summary
        };
        const updatedVideo = await primsaClient.video.update({
            where: {
                id: id as string,
            },
            data: {
                summaries: updatedSummaries,
            },
        });
        res.json(updatedVideo);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const updateAudioUrl = async (req: Request, res: Response) => {
    try {
        const { id, language, url } = UpdateAudioUrlSchema.parse(req.query);
        const existingVideo = await primsaClient.video.findUnique({
            where: { id: id as string },
        });
        if (!existingVideo) {
            throw new Error("No video found with this id");
        }
        const currentAudioUrls = existingVideo?.audioUrls as Record<string, string> || {};
        if (currentAudioUrls?.[language]) {
            throw new Error("Audio with this language already exists");
        }
        const updatedAudioUrls = {
            ...currentAudioUrls,
            [language]: url
        };
        const updatedVideo = await primsaClient.video.update({
            where: {
                id: id as string,
            },
            data: {
                audioUrls: updatedAudioUrls,
            },
        });
        res.json(updatedVideo);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}