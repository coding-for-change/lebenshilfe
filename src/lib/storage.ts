import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const endpoint = process.env.S3_ENDPOINT;
const accessKeyId = process.env.S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
const bucket = process.env.S3_BUCKET;

let cachedClient: S3Client | null = null;

function getClient(): S3Client {
  if (cachedClient) return cachedClient;
  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error(
      "Hetzner S3 storage not configured. Set S3_ENDPOINT, S3_REGION, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY.",
    );
  }
  cachedClient = new S3Client({
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
    region: "auto", //r2 does not need region defined
  });
  return cachedClient;
}

export function getBucketName(): string {
  if (!bucket) throw new Error("S3_BUCKET is not set.");
  return bucket;
}

export async function uploadSignaturePng(key: string, dataUrlOrBase64: string) {
  const base64 = dataUrlOrBase64.startsWith("data:")
    ? dataUrlOrBase64.slice(dataUrlOrBase64.indexOf(",") + 1)
    : dataUrlOrBase64;
  const body = Buffer.from(base64, "base64");
  await getClient().send(
    new PutObjectCommand({
      Bucket: getBucketName(),
      Key: key,
      Body: body,
      ContentType: "image/png",
      CacheControl: "private, max-age=31536000, immutable",
    }),
  );
  return key;
}

/** Downloads an object from S3 and returns its raw bytes. */
export async function downloadObject(key: string): Promise<Buffer> {
  const response = await getClient().send(
    new GetObjectCommand({ Bucket: getBucketName(), Key: key }),
  );
  if (!response.Body) {
    throw new Error(`S3-Objekt nicht gefunden: ${key}`);
  }
  const bytes = await response.Body.transformToByteArray();
  return Buffer.from(bytes);
}
