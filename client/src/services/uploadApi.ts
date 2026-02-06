import { getAccessToken, clearAuth } from "../storage/authStorage";
import type { CommonResponse } from "../types/api";

const UPLOAD_BASE_URL = "http://localhost:5000/api/v1/file";

function isOk(resp: any) {
  // backend lúc thì isSuccessFull, lúc thì isSuccessfull
  return resp?.isSuccessFull === true || resp?.isSuccessfull === true;
}

export async function uploadFileToMinio(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);

  const token = getAccessToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${UPLOAD_BASE_URL}/upload`, {
    method: "POST",
    headers, // KHÔNG set Content-Type cho FormData
    body: form,
  });

  if (res.status === 401) {
    clearAuth();
    throw new Error("Unauthorized");
  }

  const text = await res.text();
  if (!text) throw new Error(`Upload failed: HTTP ${res.status}`);

  const data = JSON.parse(text) as CommonResponse<string> & { isSuccessfull?: boolean };
  if (!isOk(data)) {
    throw new Error((data as any)?.message || (data as any)?.code || "Upload failed");
  }

  return (data.data as string) ?? "";
}

// tiện cho UploadTextArea: upload từ string -> file
export async function uploadTextAsFile(content: string, fileName: string): Promise<string> {
  const blob = new Blob([content ?? ""], { type: "text/plain;charset=utf-8" });
  const file = new File([blob], fileName, { type: "text/plain" });
  return uploadFileToMinio(file);
}

export async function readFileContent(fileName: string): Promise<string> {
  const token = getAccessToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${UPLOAD_BASE_URL}/read-file-content`, {
    method: "POST",
    headers,
    body: JSON.stringify({ fileName }),
  });

  if (res.status === 401) {
    clearAuth();
    throw new Error("Unauthorized");
  }

  const text = await res.text();
  if (!text) throw new Error(`Read file failed: HTTP ${res.status}`);

  const data = JSON.parse(text) as CommonResponse<string> & { isSuccessfull?: boolean };
  if (!isOk(data)) {
    throw new Error((data as any)?.message || (data as any)?.code || "Read file failed");
  }

  return (data.data as string) ?? "";
}
export async function readFileAsBlobUrl(fileName: string): Promise<string> {
  const token = getAccessToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${UPLOAD_BASE_URL}/read-file-bytes`, {
    method: "POST",
    headers,
    body: JSON.stringify({ fileName }),
  });

  if (res.status === 401) {
    clearAuth();
    throw new Error("Unauthorized");
  }
  if (!res.ok) throw new Error(`Read bytes failed: HTTP ${res.status}`);

  const blob = await res.blob();
  return URL.createObjectURL(blob);
}