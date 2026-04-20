const MAX_FRAMES = 60;
const FRAME_WIDTH = 960;
const FRAME_SEEK_TIMEOUT_MS = 10_000;

/**
 * Extracts frames from a video file using the browser's native video decoder.
 * Avoids FFmpeg.wasm memory issues with large files by using HTMLVideoElement + Canvas.
 *
 * @param file The video File object
 * @param intervalSeconds Minimum seconds between frames (used to calculate spread)
 * @param onProgress Optional callback with human-readable status updates
 * @returns Array of object URLs for the extracted JPEG frames
 */
export async function extractFrames(
  file: File,
  _intervalSeconds: number = 3,
  onProgress?: (message: string) => void,
): Promise<string[]> {
  onProgress?.("Carregando vídeo...");

  const video = document.createElement("video");
  video.preload = "auto";
  video.muted = true;
  video.playsInline = true;

  const videoUrl = URL.createObjectURL(file);

  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("Erro ao carregar metadados do vídeo"));
      video.src = videoUrl;
    });

    const duration = video.duration;
    if (!isFinite(duration) || duration <= 0) {
      throw new Error("Não foi possível determinar a duração do vídeo");
    }

    // Distribute frames evenly across the video, capped at 1 per second for short clips
    const frameCount = Math.min(MAX_FRAMES, Math.max(1, Math.floor(duration)));
    const spread = frameCount > 1 ? duration / (frameCount - 1) : 0;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D não suportado neste browser");

    const scale = FRAME_WIDTH / video.videoWidth;
    canvas.width = FRAME_WIDTH;
    canvas.height = Math.round(video.videoHeight * scale);

    const frameUrls: string[] = [];

    for (let i = 0; i < frameCount; i++) {
      const timestamp = i === frameCount - 1 ? duration - 0.1 : i * spread;
      onProgress?.(`Extraindo frame ${i + 1} de ${frameCount}...`);

      await seekTo(video, Math.max(0, timestamp));
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blobUrl = await new Promise<string>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error(`Falha ao gerar frame ${i + 1}`));
              return;
            }
            resolve(URL.createObjectURL(blob));
          },
          "image/jpeg",
          0.85,
        );
      });

      frameUrls.push(blobUrl);
    }

    return frameUrls;
  } finally {
    URL.revokeObjectURL(videoUrl);
    video.src = "";
  }
}

function seekTo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Timeout ao capturar frame do vídeo")), FRAME_SEEK_TIMEOUT_MS);
    video.onseeked = () => {
      clearTimeout(timeout);
      resolve();
    };
    video.currentTime = time;
  });
}
