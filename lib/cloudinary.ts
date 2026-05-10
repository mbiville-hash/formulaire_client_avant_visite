import imageCompression from 'browser-image-compression'

const CLOUDINARY_FOLDER = 'fortis-visites-sdb'

export async function uploadBathroomPhoto(file: File) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

  if (!cloudName || !uploadPreset) {
    throw new Error('Configuration Cloudinary manquante.')
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('Seules les images sont acceptées.')
  }

  const compressed = await imageCompression(file, {
    maxSizeMB: 0.45,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  })

  const form = new FormData()
  form.append('file', compressed)
  form.append('upload_preset', uploadPreset)
  form.append('folder', CLOUDINARY_FOLDER)

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: form,
  })

  const data = (await response.json().catch(() => ({}))) as { secure_url?: string; error?: { message?: string } }
  if (!response.ok || !data.secure_url) {
    throw new Error(data.error?.message || `Erreur Cloudinary ${response.status}`)
  }

  return data.secure_url
}
