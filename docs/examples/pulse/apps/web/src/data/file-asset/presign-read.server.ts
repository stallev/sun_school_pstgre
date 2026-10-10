import "server-only";

import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import {
  isFileUploadObjectKey,
  parseFileUploadPurposeFromObjectKey,
} from "@pulse/domain";
import { getPrisma } from "@pulse/db";
import { assertCanReadFileAsset, PolicyError } from "@pulse/policy-server";

import { getS3Client } from "@/lib/s3/s3-client";
import { getS3BucketName, S3_READ_URL_TTL_SECONDS } from "@/lib/s3/s3-config";
import { getPolicySessionContext } from "@/server/auth/session-to-policy-context";

export async function createPresignedReadUrlForFileAsset(
  fileAssetId: string,
): Promise<string | null> {
  const asset = await getPrisma().fileAsset.findUnique({
    where: { id: fileAssetId },
    select: {
      blobPathname: true,
      uploadStatus: true,
      ownerUserId: true,
    },
  });

  if (!asset || asset.uploadStatus !== "ready") {
    return null;
  }

  if (!isFileUploadObjectKey(asset.blobPathname)) {
    return null;
  }

  const purpose = parseFileUploadPurposeFromObjectKey(asset.blobPathname);
  if (!purpose) {
    return null;
  }

  const ctx = await getPolicySessionContext();

  try {
    assertCanReadFileAsset(ctx, {
      ownerUserId: asset.ownerUserId,
      purpose,
    });
  } catch (error) {
    if (error instanceof PolicyError) {
      return null;
    }

    throw error;
  }

  const command = new GetObjectCommand({
    Bucket: getS3BucketName(),
    Key: asset.blobPathname,
  });

  return getSignedUrl(getS3Client(), command, {
    expiresIn: S3_READ_URL_TTL_SECONDS,
  });
}
