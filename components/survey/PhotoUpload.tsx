"use client";

import { useEffect, useState } from "react";
import { Camera, Loader2, Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getClientUser } from "@/lib/auth/get-client-user";
import { queueOfflinePhoto } from "@/lib/offline/mediaQueue";

type PhotoUploadProps = {
  surveyId: string;
  farmerId: string;
  fieldId: string;
  photoType: string;
  latitude?: string;
  longitude?: string;
  title?: string;
  description?: string;
  existingPhotoPath?: string | null;
  onUploaded?: (storagePath: string) => void;
};

export default function PhotoUpload({
  surveyId,
  farmerId,
  fieldId,
  photoType,
  latitude = "",
  longitude = "",
  title = "Photo",
  description = "Capture a clear photo.",
  existingPhotoPath = null,
  onUploaded,
}: PhotoUploadProps) {
  const supabase = createClient();

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoPath, setPhotoPath] = useState(
    existingPhotoPath ?? ""
  );
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoMessage, setPhotoMessage] = useState("");
  const [photoError, setPhotoError] = useState("");

  useEffect(() => {
    async function loadExistingPhoto() {
      if (!existingPhotoPath) {
        setPhotoPath("");
        setPhotoUrl("");
        return;
      }

      setPhotoPath(existingPhotoPath);

      const { data } = await supabase.storage
        .from("photos")
        .createSignedUrl(existingPhotoPath, 60 * 60);

      if (data?.signedUrl) {
        setPhotoUrl(data.signedUrl);
      }
    }

    loadExistingPhoto();
  }, [existingPhotoPath, supabase]);

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  function handlePhotoChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    setPhotoError("");
    setPhotoMessage("");

    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setPhotoError("Please select an image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setPhotoError("Photo size must be less than 10 MB.");
      return;
    }

    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }

    const previewUrl = URL.createObjectURL(file);

    setPhotoFile(file);
    setPhotoPreview(previewUrl);
    setPhotoError("");
    setPhotoMessage("");
  }

  function removeSelectedPhoto() {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }

    setPhotoFile(null);
    setPhotoPreview("");
    setPhotoError("");
    setPhotoMessage("");
  }

  async function uploadPhoto() {
    setPhotoError("");
    setPhotoMessage("");

    if (!photoFile) {
      setPhotoError("Please select a photo first.");
      return;
    }

    setPhotoUploading(true);

    try {
      const user = await getClientUser();

      if (!user) {
        setPhotoError(
          "Your session has expired. Please log in again."
        );
        return;
      }

      /*
       * OFFLINE MODE
       *
       * Save the photo locally in IndexedDB.
       * It will be uploaded to Supabase when
       * internet connection returns.
       */
      if (!navigator.onLine) {
        await queueOfflinePhoto({
          surveyId,
          section: photoType,
          file: photoFile,
          fileName: photoFile.name,
          mimeType: photoFile.type,
          metadata: {
            surveyId,
            farmerId,
            fieldId,
            enumeratorId: user.id,
            photoType,
            latitude:
              latitude.trim() !== ""
                ? Number(latitude)
                : null,
            longitude:
              longitude.trim() !== ""
                ? Number(longitude)
                : null,
          },
        });

        setPhotoMessage(
          "Photo saved on this device. It will upload automatically when internet returns."
        );

        if (photoPreview) {
          URL.revokeObjectURL(photoPreview);
        }

        setPhotoFile(null);
        setPhotoPreview("");

        return;
      }

      /*
       * ONLINE MODE
       *
       * Upload directly to Supabase.
       */
      const fileExtension =
        photoFile.name.split(".").pop()?.toLowerCase() ||
        "jpg";

      const filePath =
        `${user.id}/${surveyId}/${crypto.randomUUID()}.${fileExtension}`;

      const { error: uploadError } = await supabase.storage
        .from("photos")
        .upload(filePath, photoFile, {
          contentType: photoFile.type,
          upsert: false,
        });

      if (uploadError) {
        console.error(uploadError);

        /*
         * If the network disappears during upload,
         * preserve the photo locally instead of losing it.
         */
        if (!navigator.onLine) {
          await queueOfflinePhoto({
            surveyId,
            section: photoType,
            file: photoFile,
            fileName: photoFile.name,
            mimeType: photoFile.type,
            metadata: {
              surveyId,
              farmerId,
              fieldId,
              enumeratorId: user.id,
              photoType,
              latitude:
                latitude.trim() !== ""
                  ? Number(latitude)
                  : null,
              longitude:
                longitude.trim() !== ""
                  ? Number(longitude)
                  : null,
            },
          });

          setPhotoMessage(
            "Connection lost. Photo was saved on this device and will upload automatically."
          );

          if (photoPreview) {
            URL.revokeObjectURL(photoPreview);
          }

          setPhotoFile(null);
          setPhotoPreview("");

          return;
        }

        setPhotoError(uploadError.message);
        return;
      }

      const { error: photoInsertError } =
        await supabase
          .from("photos")
          .insert({
            survey_id: surveyId,
            farmer_id: farmerId,
            field_id: fieldId,
            enumerator_id: user.id,
            photo_type: photoType,
            storage_path: filePath,
            file_name: photoFile.name,
            mime_type: photoFile.type,
            file_size: photoFile.size,
            latitude:
              latitude.trim() !== ""
                ? Number(latitude)
                : null,
            longitude:
              longitude.trim() !== ""
                ? Number(longitude)
                : null,
          });

      if (photoInsertError) {
        console.error(photoInsertError);

        await supabase.storage
          .from("photos")
          .remove([filePath]);

        setPhotoError(photoInsertError.message);
        return;
      }

      const { data: signedUrlData } =
        await supabase.storage
          .from("photos")
          .createSignedUrl(
            filePath,
            60 * 60
          );

      if (signedUrlData?.signedUrl) {
        setPhotoUrl(
          signedUrlData.signedUrl
        );
      }

      setPhotoPath(filePath);

      if (onUploaded) {
        onUploaded(filePath);
      }

      setPhotoMessage(
        "Photo uploaded successfully."
      );

      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }

      setPhotoFile(null);
      setPhotoPreview("");
    } catch (error) {
      console.error(error);

      /*
       * If an unexpected network error occurs,
       * preserve the selected photo locally.
       */
      if (!navigator.onLine && photoFile) {
        try {
          const user = await getClientUser();

          if (user) {
            await queueOfflinePhoto({
              surveyId,
              section: photoType,
              file: photoFile,
              fileName: photoFile.name,
              mimeType: photoFile.type,
              metadata: {
                surveyId,
                farmerId,
                fieldId,
                enumeratorId: user.id,
                photoType,
                latitude:
                  latitude.trim() !== ""
                    ? Number(latitude)
                    : null,
                longitude:
                  longitude.trim() !== ""
                    ? Number(longitude)
                    : null,
              },
            });

            setPhotoMessage(
              "Connection lost. Photo was saved on this device and will upload automatically."
            );

            if (photoPreview) {
              URL.revokeObjectURL(photoPreview);
            }

            setPhotoFile(null);
            setPhotoPreview("");

            return;
          }
        } catch (queueError) {
          console.error(
            "Unable to save photo offline:",
            queueError
          );
        }
      }

      setPhotoError(
        "Unable to upload the photo."
      );
    } finally {
      setPhotoUploading(false);
    }
  }

  return (
    <section className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--light-green)] text-[var(--primary)]">
          <Camera size={20} />
        </div>

        <div>
          <h2 className="font-semibold">
            {title}
          </h2>

          <p className="mt-1 text-sm text-[var(--muted)]">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <label
          htmlFor={`photo-${photoType}`}
          className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-white px-5 text-sm font-semibold transition hover:bg-slate-50 sm:w-auto"
        >
          <Camera size={18} />
          Take / Choose Photo

          <input
            id={`photo-${photoType}`}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoChange}
            disabled={photoUploading}
          />
        </label>
      </div>

      {photoPreview && (
        <div className="mt-4">
          <div className="relative overflow-hidden rounded-xl border border-[var(--border)]">
            <img
              src={photoPreview}
              alt={`${title} preview`}
              className="max-h-80 w-full object-cover"
            />

            <button
              type="button"
              onClick={removeSelectedPhoto}
              disabled={photoUploading}
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black/80 disabled:opacity-50"
              aria-label="Remove selected photo"
            >
              <X size={17} />
            </button>
          </div>

          <button
            type="button"
            onClick={uploadPhoto}
            disabled={
              photoUploading ||
              !photoFile
            }
            className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {photoUploading ? (
              <>
                <Loader2
                  size={18}
                  className="animate-spin"
                />
                Saving photo...
              </>
            ) : (
              <>
                <Upload size={18} />
                Save Photo
              </>
            )}
          </button>
        </div>
      )}

      {photoUrl &&
        !photoPreview && (
          <div className="mt-4">
            <div className="overflow-hidden rounded-xl border border-[var(--border)]">
              <img
                src={photoUrl}
                alt={`Uploaded ${title}`}
                className="max-h-80 w-full object-cover"
              />
            </div>

            <div className="mt-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              Photo uploaded successfully.
            </div>
          </div>
        )}

      {!photoPreview &&
        !photoUrl &&
        !photoMessage &&
        !photoError && (
          <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-xs text-[var(--muted)]">
            No photo uploaded yet.
          </div>
        )}

      {photoMessage && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {photoMessage}
        </div>
      )}

      {photoError && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {photoError}
        </div>
      )}
    </section>
  );
}