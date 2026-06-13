import axios from "axios";
import api from "../services/api";

/**
 * Request a presigned URL from the backend and upload a file directly to Supabase storage.
 * Using a clean axios instance to bypass interceptors (which could cause auth signature/CORS errors).
 * 
 * @param {File} file - The file object to upload
 * @param {string} bucket - Target bucket name ('products', 'avatars', 'shipping_evidence', 'payment_proofs')
 * @returns {Promise<{ publicUrl: string, path: string }>} Public URL and storage path of the uploaded file
 */
export async function uploadFileDirectly(file, bucket) {
  try {
    // 1. Get signed upload URL from backend
    const { data } = await api.post("/storage/signed-upload-url", {
      bucket,
      fileType: file.type,
      originalName: file.name,
    });

    if (!data.success || !data.signedUrl) {
      throw new Error(data.error || "No se pudo obtener la URL firmada de subida.");
    }

    const { signedUrl, publicUrl, path } = data;

    // 2. Upload file directly to Supabase storage using a clean axios instance
    const cleanAxios = axios.create();

    await cleanAxios.put(signedUrl, file, {
      headers: {
        "Content-Type": file.type,
      },
    });

    return { publicUrl, path };
  } catch (err) {
    console.error(`[DirectUploadError] Failed to upload file to ${bucket}:`, err.message);
    throw err;
  }
}
