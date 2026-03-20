import { createAdminClient } from "@/lib/supabase/admin";

function getAdmin() {
  return createAdminClient();
}

export async function uploadFile(
  bucket: string,
  path: string,
  data: ArrayBuffer | Uint8Array | Buffer,
  contentType: string
) {
  const { error } = await getAdmin()
    .storage.from(bucket)
    .upload(path, data, { contentType, upsert: false });

  if (error) throw new Error(`Upload failed: ${error.message}`);
  return path;
}

export async function downloadFile(
  bucket: string,
  path: string
): Promise<ArrayBuffer> {
  const { data, error } = await getAdmin()
    .storage.from(bucket)
    .download(path);

  if (error || !data) throw new Error(`Download failed: ${error?.message}`);
  return data.arrayBuffer();
}

export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresInSeconds = 300
): Promise<string> {
  const { data, error } = await getAdmin()
    .storage.from(bucket)
    .createSignedUrl(path, expiresInSeconds);

  if (error || !data)
    throw new Error(`Signed URL failed: ${error?.message}`);
  return data.signedUrl;
}

export async function uploadAndGetPath(
  bucket: string,
  path: string,
  data: ArrayBuffer | Uint8Array | Buffer,
  contentType: string
): Promise<string> {
  const { error } = await getAdmin()
    .storage.from(bucket)
    .upload(path, data, { contentType, upsert: true });

  if (error) throw new Error(`Upload failed: ${error.message}`);
  return path;
}
