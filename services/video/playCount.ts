import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const incrementPlayCount = async (videoIds: string | string[]) => {
  try {
    const ids = Array.isArray(videoIds) ? videoIds : [videoIds];
    
    await prisma.$transaction(
      ids.map((id) =>
        prisma.video.update({
          where: { id },
          data: {
            plays: {
              increment: 1
            }
          }
        })
      )
    );

    console.log(`✅ Updated play count for videos:`, ids);
  } catch (error) {
    console.error("❌ Error updating play count:", error);
    throw error;
  }
};