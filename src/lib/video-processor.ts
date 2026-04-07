import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

const ffmpeg = new FFmpeg();

/**
 * Extracts frames from a video file at a specified interval (e.g., 1 frame every 5 seconds)
 * 
 * @param file The video File object
 * @param intervalSeconds How often to extract a frame
 * @returns Array of object URLs for the extracted frames (images)
 */
export async function extractFrames(file: File, intervalSeconds: number = 3): Promise<string[]> {
  try {
    if (!ffmpeg.loaded) {
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
    }

    const inputName = 'input.mp4';
    await ffmpeg.writeFile(inputName, await fetchFile(file));

    // Get video duration using ffprobe or just reading it from browser
    // As a simple workaround for the browser, we use a hidden video element
    const duration = await getVideoDuration(file);
    const frameUrls: string[] = [];
    
    // Create output dir
    await ffmpeg.createDir("out");

    // Run ffmpeg to extract frames
    // Optimization: Cap frames at ~12 to reduce tokens/cost while keeping enough context
    const maxFrames = 12;
    const calculatedInterval = Math.max(intervalSeconds, Math.floor(duration / (maxFrames - 1)));
    
    await ffmpeg.exec([
      '-i', inputName,
      '-vf', `fps=1/${calculatedInterval},scale=1280:-1`, // Also scale to 720p for cost/size balance
      '-vsync', 'vfr',
      'out/frame_%d.jpg'
    ]);

    // Read the frames back
    const fileCount = Math.min(maxFrames, Math.floor(duration / calculatedInterval) + 1);
    
    for (let i = 1; i <= fileCount; i++) {
        try {
            const data = await ffmpeg.readFile(`out/frame_${i}.jpg`);
            const blobData = typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data);
            const blob = new Blob([blobData], { type: 'image/jpeg' });
            frameUrls.push(URL.createObjectURL(blob));
        } catch (e) {
             // Reached the end or file doesn't exist
             break;
        }
    }

    // Cleanup
    await ffmpeg.deleteFile(inputName);
    // Cleanup generated frames from ffmpeg memfs
    for (let i = 1; i <= frameUrls.length; i++) {
        try { await ffmpeg.deleteFile(`out/frame_${i}.jpg`); } catch(e){}
    }
    try { await ffmpeg.deleteDir("out"); } catch(e){}

    return frameUrls;
  } catch (error) {
    console.error("Error extracting frames:", error);
    throw error;
  }
}

// Helper to get duration using browser API to avoid complex ffprobe parsing
const getVideoDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => reject('Error loading video metadata');
    video.src = URL.createObjectURL(file);
  });
};
