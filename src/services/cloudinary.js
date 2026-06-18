const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME?.replace(/^'|'$/g, '')
const PRESET     = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET?.replace(/^'|'$/g, '')

export function cloudinaryReady() {
  return !!(CLOUD_NAME && PRESET)
}

// Uploads a Blob or File to Cloudinary, returns the secure URL.
// resource_type 'auto' handles audio (webm/ogg/mp3) and images.
export async function uploadToCloudinary(blob, filename) {
  if (!cloudinaryReady()) return null

  const form = new FormData()
  form.append('file', blob, filename)
  form.append('upload_preset', PRESET)
  form.append('resource_type', 'auto')

  const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
    method: 'POST',
    body:   form,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || `Cloudinary upload failed (${res.status})`)
  return data.secure_url
}
