import { useRef, useState } from "react";
import { uploadFileToMinio, uploadTextAsFile } from "../services/uploadApi";

type Props = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;

  /** tên file khi upload từ TEXT */
  buildFileName?: () => string;

  /** cho phép upload-from-text (default true) */
  allowUploadText?: boolean;

  /** cho phép upload-from-file (default true) */
  allowUploadFile?: boolean;
    disabled?: boolean; // ✅ thêm dòng này

};

export default function UploadTextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 6,
  buildFileName,
  allowUploadText = true,
  allowUploadFile = true,
}: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string>("");

  const doUploadFile = async (file: File) => {
    setUploading(true);
    setErr("");
    try {
      const key = await uploadFileToMinio(file);
      onChange(key); // IMPORTANT: replace value = minio key
    } catch (e: any) {
      setErr(e?.message ?? "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    await doUploadFile(f);
  };

  const onUploadText = async () => {
    const content = value ?? "";
    if (!content.trim()) {
      setErr("Textarea đang trống, không có gì để upload.");
      return;
    }
    const name = buildFileName?.() ?? "file.txt";

    setUploading(true);
    setErr("");
    try {
      const key = await uploadTextAsFile(content, name);
      onChange(key); // replace value = minio key
    } catch (e: any) {
      setErr(e?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="field">
      <label className="label">{label}</label>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
        {allowUploadText && (
          <button className="btn" type="button" onClick={onUploadText} disabled={uploading}>
            {uploading ? "Uploading..." : "Upload text"}
          </button>
        )}

        {allowUploadFile && (
          <>
            <button className="btn" type="button" onClick={() => fileRef.current?.click()} disabled={uploading}>
              Upload file
            </button>
            <input
              ref={fileRef}
              type="file"
              style={{ display: "none" }}
              onChange={onPickFile}
            />
          </>
        )}

        {buildFileName && (
          <span className="hint" style={{ marginLeft: 6 }}>
            filename: <b>{buildFileName()}</b>
          </span>
        )}
      </div>

      <textarea
        className="input textarea"
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />

      {err && <div className="hint hint--bad" style={{ marginTop: 6 }}>{err}</div>}
      <div className="hint" style={{ marginTop: 6 }}>
        Tip: Dán text vào đây → bấm <b>Upload text</b> → value sẽ đổi thành <b>MinIO key</b>.
      </div>
    </div>
  );
}
