import { API } from "./api";
import { routerLinks } from "./router-links";
import { fileHost } from "./constants";
import type { AttachmentViewModel } from "@/store/user/model";

interface PickedAsset {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
}

/** Upload a picked image to /upload/file and return the attachment metadata. */
export async function uploadImageAsync(
  asset: PickedAsset,
): Promise<AttachmentViewModel | undefined> {
  const form = new FormData();
  const name = asset.fileName || `receipt-${Date.now()}.jpg`;
  const type = asset.mimeType || "image/jpeg";
  form.append("file", {
    // React Native FormData file shape
    uri: asset.uri,
    name,
    type,
  } as unknown as Blob);
  const res = await API.upload<AttachmentViewModel>(
    `${routerLinks("Upload")}/file`,
    form,
  );
  return res.data;
}

/** Resolve an attachment's display URL (absolute, or prefixed with the file host). */
export function resolveFileUrl(att?: AttachmentViewModel): string | undefined {
  const path = att?.filePath || att?.fileUrl;
  if (!path) return undefined;
  return path.startsWith("http") ? path : `${fileHost}${path}`;
}
