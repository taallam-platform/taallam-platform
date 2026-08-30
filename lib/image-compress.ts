import imageCompression from 'browser-image-compression';

/** يضغط الصورة في المتصفح قبل الرفع عشان تكون تحت 2 ميجا */
export async function compressAvatar(file: File): Promise<File> {
  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    throw new Error('الصيغة المسموحة jpg أو png بس');
  }

  const options = {
    maxSizeMB: 2,
    maxWidthOrHeight: 800,
    useWebWorker: true,
    fileType: file.type,
  };

  const compressed = await imageCompression(file, options);
  return compressed as File;
}
