"use client";

import { useEffect, useRef, useState } from "react";
import {
  Mic,
  Square,
  Play,
  Pause,
  Trash2,
  Upload,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getClientUser } from "@/lib/auth/get-client-user";
import { queueOfflineVoice } from "@/lib/offline/mediaQueue";

type VoiceRecorderProps = {
  surveyId: string;
  farmerId: string;
  fieldId: string;
  section: string;
  questionKey: string;
  latitude?: string;
  longitude?: string;
  language?: string;
  title?: string;
  description?: string;
  existingVoicePath?: string | null;
  onUploaded?: (storagePath: string) => void;
};

export default function VoiceRecorder({
  surveyId,
  farmerId,
  fieldId,
  section,
  questionKey,
  latitude = "",
  longitude = "",
  language = "",
  title = "Voice Recording",
  description = "Record the farmer's response.",
  existingVoicePath = null,
  onUploaded,
}: VoiceRecorderProps) {
  const supabase = createClient();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartRef = useRef<number | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState("");
  const [audioDuration, setAudioDuration] = useState(0);

  const [voicePath, setVoicePath] = useState(
    existingVoicePath ?? ""
  );

  const [existingVoiceUrl, setExistingVoiceUrl] = useState("");

  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadExistingVoice() {
      if (!existingVoicePath) {
        setVoicePath("");
        setExistingVoiceUrl("");
        return;
      }

      setVoicePath(existingVoicePath);

      const { data, error } = await supabase.storage
        .from("voices")
        .createSignedUrl(existingVoicePath, 60 * 60);

      if (!error && data?.signedUrl) {
        setExistingVoiceUrl(data.signedUrl);
      }
    }

    loadExistingVoice();
  }, [existingVoicePath, supabase]);

  useEffect(() => {
    return () => {
      if (audioPreviewUrl) {
        URL.revokeObjectURL(audioPreviewUrl);
      }
    };
  }, [audioPreviewUrl]);

  function getSupportedMimeType() {
    const mimeTypes = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/ogg;codecs=opus",
    ];

    for (const type of mimeTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return "";
  }

  async function startRecording() {
    setError("");
    setMessage("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        "Voice recording is not supported by this browser."
      );
      return;
    }

    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      const mimeType = getSupportedMimeType();

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });

        const previewUrl = URL.createObjectURL(blob);

        if (audioPreviewUrl) {
          URL.revokeObjectURL(audioPreviewUrl);
        }

        setAudioBlob(blob);
        setAudioPreviewUrl(previewUrl);

        const duration = recordingStartRef.current
          ? (Date.now() - recordingStartRef.current) / 1000
          : 0;

        setAudioDuration(Number(duration.toFixed(2)));

        stream.getTracks().forEach((track) => {
          track.stop();
        });

        recordingStartRef.current = null;
      };

      recorder.onerror = () => {
        setError("Unable to record audio.");

        stream.getTracks().forEach((track) => {
          track.stop();
        });

        setIsRecording(false);
      };

      mediaRecorderRef.current = recorder;
      recordingStartRef.current = Date.now();

      recorder.start();

      setIsRecording(true);
    } catch (error) {
      console.error(error);

      setError(
        "Microphone permission was denied or unavailable."
      );
    }
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;

    if (!recorder || recorder.state === "inactive") {
      return;
    }

    recorder.stop();
    setIsRecording(false);
  }

  function togglePlayback() {
    const audio = audioPreviewRef.current;

    if (!audio) {
      return;
    }

    if (audio.paused) {
      audio.play();
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }

  function removeRecording() {
    const audio = audioPreviewRef.current;

    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
    }

    setAudioBlob(null);
    setAudioPreviewUrl("");
    setAudioDuration(0);
    setIsPlaying(false);
    setError("");
    setMessage("");
  }

  function getAudioExtension(mimeType: string) {
    if (mimeType.includes("mp4")) {
      return "mp4";
    }

    if (mimeType.includes("ogg")) {
      return "ogg";
    }

    return "webm";
  }

  async function queueVoiceOffline(userId: string) {
    if (!audioBlob) {
      throw new Error(
        "Voice recording is missing."
      );
    }

    const extension = getAudioExtension(
      audioBlob.type
    );

    const fileName =
      `voice-${crypto.randomUUID()}.${extension}`;

    await queueOfflineVoice({
      surveyId,
      section,
      file: audioBlob,
      fileName,
      mimeType:
        audioBlob.type || "audio/webm",
      metadata: {
        surveyId,
        farmerId,
        fieldId,
        enumeratorId: userId,
        section,
        questionKey,
        durationSeconds: audioDuration,
        language: language || null,
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
  }

  async function uploadRecording() {
    setError("");
    setMessage("");

    if (!audioBlob) {
      setError(
        "Please record a voice response first."
      );
      return;
    }

    setUploading(true);

    try {
      const user = await getClientUser();

      if (!user) {
        setError(
          "Your session has expired. Please log in again."
        );
        return;
      }

      /*
       * OFFLINE MODE
       *
       * Store the voice recording locally.
       * It will be uploaded automatically when
       * internet connection returns.
       */
      if (!navigator.onLine) {
        await queueVoiceOffline(user.id);

        setMessage(
          "Voice recording saved on this device. It will upload automatically when internet returns."
        );

        return;
      }

      /*
       * ONLINE MODE
       *
       * Upload directly to Supabase.
       */
      const extension = getAudioExtension(
        audioBlob.type
      );

      const fileName =
        `voice-${crypto.randomUUID()}.${extension}`;

      const filePath =
        `${user.id}/${surveyId}/${fileName}`;

      const { error: uploadError } =
        await supabase.storage
          .from("voices")
          .upload(filePath, audioBlob, {
            contentType:
              audioBlob.type || "audio/webm",
            upsert: false,
          });

      if (uploadError) {
        console.error(uploadError);

        /*
         * If connection disappeared while
         * uploading, preserve the recording.
         */
        if (!navigator.onLine) {
          await queueVoiceOffline(user.id);

          setMessage(
            "Connection lost. Voice recording was saved on this device and will upload automatically."
          );

          return;
        }

        setError(uploadError.message);
        return;
      }

      const { error: insertError } =
        await supabase
          .from("voice_notes")
          .insert({
            survey_id: surveyId,
            farmer_id: farmerId,
            field_id: fieldId,
            enumerator_id: user.id,
            section,
            question_key: questionKey,
            storage_path: filePath,
            file_name: fileName,
            mime_type:
              audioBlob.type || "audio/webm",
            file_size: audioBlob.size,
            duration_seconds: audioDuration,
            language: language || null,
            latitude:
              latitude.trim() !== ""
                ? Number(latitude)
                : null,
            longitude:
              longitude.trim() !== ""
                ? Number(longitude)
                : null,
          });

      if (insertError) {
        console.error(insertError);

        await supabase.storage
          .from("voices")
          .remove([filePath]);

        setError(insertError.message);
        return;
      }

      setVoicePath(filePath);

      if (onUploaded) {
        onUploaded(filePath);
      }

      setMessage(
        "Voice recording uploaded successfully."
      );

      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        audioPreviewRef.current.currentTime = 0;
      }

      setIsPlaying(false);
    } catch (error) {
      console.error(error);

      /*
       * Unexpected network failure.
       * Preserve the recording locally.
       */
      if (!navigator.onLine && audioBlob) {
        try {
          const user = await getClientUser();

          if (user) {
            await queueVoiceOffline(user.id);

            setMessage(
              "Connection lost. Voice recording was saved on this device and will upload automatically."
            );

            return;
          }
        } catch (queueError) {
          console.error(
            "Unable to save voice recording offline:",
            queueError
          );
        }
      }

      setError(
        "Unable to upload the voice recording."
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-700">
          <Mic size={20} />
        </div>

        <div>
          <h2 className="font-semibold text-slate-900">
            {title}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {!isRecording ? (
          <button
            type="button"
            onClick={startRecording}
            disabled={uploading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-green-700 px-5 text-sm font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Mic size={18} />
            Start Recording
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700"
          >
            <Square size={17} />
            Stop Recording
          </button>
        )}
      </div>

      {isRecording && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-600" />
          Recording in progress...
        </div>
      )}

      {audioPreviewUrl && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <audio
            ref={audioPreviewRef}
            src={audioPreviewUrl}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-800">
                Recorded voice
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Duration: {audioDuration.toFixed(1)} seconds
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={togglePlayback}
                disabled={uploading}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {isPlaying ? (
                  <>
                    <Pause size={17} />
                    Pause
                  </>
                ) : (
                  <>
                    <Play size={17} />
                    Play
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={removeRecording}
                disabled={uploading}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-red-200 bg-white px-4 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 size={17} />
                Delete
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={uploadRecording}
            disabled={uploading || !audioBlob}
            className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-green-700 px-5 text-sm font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading ? (
              <>
                <Loader2
                  size={18}
                  className="animate-spin"
                />
                Saving voice...
              </>
            ) : (
              <>
                <Upload size={18} />
                Save Voice
              </>
            )}
          </button>
        </div>
      )}

      {existingVoiceUrl && !audioPreviewUrl && (
        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-medium text-green-800">
            Existing voice recording
          </p>

          <audio
            controls
            src={existingVoiceUrl}
            className="mt-3 w-full"
          />
        </div>
      )}

      {!audioPreviewUrl &&
        !existingVoiceUrl &&
        !error && (
          <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-500">
            No voice recording yet.
          </div>
        )}

      {message && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </section>
  );
}