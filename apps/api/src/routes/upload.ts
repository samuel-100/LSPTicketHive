import { Router } from "express";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { authenticate } from "../middleware/auth";
import crypto from "crypto";

export const uploadRouter = Router();

const BUCKET = process.env.S3_BUCKET || "lsptickethive-imagesbucket1e86afb2-c461cx7o1jko";
const REGION = process.env.AWS_REGION || "eu-west-1";

const s3 = new S3Client({ region: REGION });

uploadRouter.post("/presign", authenticate, async (req, res) => {
  try {
    const { contentType, fileExtension } = req.body;

    const isImage = contentType?.startsWith("image/");
    const isAudio = contentType?.startsWith("audio/");
    if (!contentType || (!isImage && !isAudio)) {
      return res.status(400).json({ success: false, error: "Only image or audio uploads allowed" });
    }

    const folder = isAudio ? "voice" : "events";
    const key = `${folder}/${crypto.randomUUID()}.${fileExtension || (isAudio ? "webm" : "jpg")}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
    const publicUrl = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;

    res.json({ success: true, data: { uploadUrl, publicUrl, key } });
  } catch (error) {
    console.error("Presign error:", error);
    res.status(500).json({ success: false, error: "Failed to generate upload URL" });
  }
});
