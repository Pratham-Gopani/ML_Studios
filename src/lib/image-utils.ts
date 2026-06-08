import JSZip from 'jszip';
import * as tf from '@tensorflow/tfjs';

// Setup TFJS backend properly
async function initTF() {
  try {
    if (typeof window === 'undefined') {
      await tf.setBackend('cpu');
      return;
    }
    // Try to register webgl first if registered, fall back to cpu on error
    if (tf.findBackend('webgl')) {
      await tf.setBackend('webgl');
      console.log('Using TensorFlow.js WebGL backend');
    } else {
      await tf.setBackend('cpu');
      console.log('TensorFlow.js WebGL backend not registered, using CPU');
    }
  } catch (err) {
    if (typeof window !== 'undefined') {
      console.warn('WebGL backend not supported/failed to load, using CPU:', err);
    }
    try {
      await tf.setBackend('cpu');
    } catch (e) {
      if (typeof window !== 'undefined') {
        console.error('Failed to fallback to CPU backend:', e);
      }
    }
  }
}
initTF();

export interface ImageDataset {
  images: (number[] | Float32Array)[];
  labels: number[];
  classNames?: string[];
  inputShape: [number, number, number];
}

function findCommonFolderPrefix(paths: string[]): string {
  if (paths.length === 0) return '';
  const firstPathParts = paths[0].split('/');
  firstPathParts.pop(); // remove file name
  
  let commonParts: string[] = [];
  for (let i = 0; i < firstPathParts.length; i++) {
    const part = firstPathParts[i];
    const isCommon = paths.every(path => {
      const parts = path.split('/');
      return parts[i] === part;
    });
    if (isCommon) {
      commonParts.push(part);
    } else {
      break;
    }
  }
  return commonParts.length > 0 ? commonParts.join('/') + '/' : '';
}

/**
 * Processes an HTMLImageElement into a flat Float32Array of normalized RGB values
 * using an offline HTML Canvas. This completely bypasses WebGL shader-compilation,
 * ensuring high performance and absolute compatibility under all sandboxed iframe
 * and low-power hardware environments.
 */
function imageToFloat32ArrayCanvas(img: HTMLImageElement, targetSize: [number, number]): Float32Array {
  const [width, height] = targetSize;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }
  // Standard Browser drawImage handles smooth scaling/bilinear interpolation
  ctx.drawImage(img, 0, 0, width, height);
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data; // Uint8ClampedArray of RGBA
  
  // Create a flat Float32Array for normalized RGB values (depth of 3)
  const floatData = new Float32Array(width * height * 3);
  let dstIdx = 0;
  for (let i = 0; i < data.length; i += 4) {
    floatData[dstIdx] = data[i] / 255.0;       // Red
    floatData[dstIdx + 1] = data[i + 1] / 255.0; // Green
    floatData[dstIdx + 2] = data[i + 2] / 255.0; // Blue
    dstIdx += 3;
  }
  return floatData;
}

export async function loadImageDatasetFromZip(
  zipFile: File,
  targetSize: [number, number] = [64, 64],
  maxSamplesPerClass?: number
): Promise<ImageDataset> {
  const zip = await JSZip.loadAsync(zipFile);
  
  // 1. Gather all valid image file paths in the zip, ignoring system files/folders like __MACOSX or hidden files starting with '.'
  const imagePaths = Object.keys(zip.files).filter(path => {
    const isImage = /\.(jpg|jpeg|png|webp|bmp|gif)$/i.test(path);
    const isHiddenOrMeta = path.split('/').some(part => part.startsWith('.') || part === '__MACOSX');
    return isImage && !isHiddenOrMeta;
  });

  if (imagePaths.length === 0) {
    throw new Error('No valid images (JPG, JPEG, PNG, WEBP, BMP, GIF) found in the ZIP archive.');
  }

  // 2. Identify the common directory prefix to correctly determine the class/label directories
  const commonPrefix = findCommonFolderPrefix(imagePaths);

  // 3. Map images to their respective classes based on the folder path after stripping the common prefix
  const classToPaths = new Map<string, string[]>();
  for (const path of imagePaths) {
    const remainder = path.startsWith(commonPrefix) ? path.substring(commonPrefix.length) : path;
    const parts = remainder.split('/');
    let className = 'default';
    if (parts.length > 1) {
      className = parts[0];
    }
    if (!classToPaths.has(className)) {
      classToPaths.set(className, []);
    }
    classToPaths.get(className)!.push(path);
  }

  const classNames = Array.from(classToPaths.keys()).sort();

  // 4. Construct tasks to process each image with limited concurrency for high performance and low memory
  const allImagesData: Float32Array[] = [];
  const allLabels: number[] = [];

  const tasks: (() => Promise<void>)[] = [];

  classNames.forEach((className, classIndex) => {
    let paths = classToPaths.get(className)!;
    if (maxSamplesPerClass && paths.length > maxSamplesPerClass) {
      paths = paths.slice(0, maxSamplesPerClass);
    }

    for (const path of paths) {
      tasks.push(async () => {
        try {
          const fileEntry = zip.files[path];
          const blob = await fileEntry.async('blob');
          const img = await blobToImage(blob);
          
          // Use Canvas 2D which runs perfectly inside all sandboxed iframe and web environments without any WebGL/TensorFlow initialization issues
          const imgData = imageToFloat32ArrayCanvas(img, targetSize);
          
          allImagesData.push(imgData);
          allLabels.push(classIndex);
        } catch (err) {
          console.error(`Failed to load image at "${path}":`, err);
        }
      });
    }
  });

  // 5. Execute loading tasks in parallel with a concurrency of 15
  const CONCURRENCY = 15;
  let taskIndex = 0;
  async function worker() {
    while (taskIndex < tasks.length) {
      const idx = taskIndex++;
      await tasks[idx]();
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY, tasks.length) }, worker);
  await Promise.all(workers);

  if (allImagesData.length === 0) {
    throw new Error('All image files in the ZIP archive failed to load or were corrupted.');
  }

  return {
    images: allImagesData,
    labels: allLabels,
    classNames,
    inputShape: [targetSize[1], targetSize[0], 3]
  };
}

function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to decode image from blob'));
    };
    img.src = URL.createObjectURL(blob);
  });
}
