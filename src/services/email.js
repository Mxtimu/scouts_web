import emailjs from '@emailjs/browser'

const SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID?.replace(/^'|'$/g, '')
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID?.replace(/^'|'$/g, '')
const PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY?.replace(/^'|'$/g, '')

function getFirstName(fullName) {
  return (fullName || '').trim().split(/\s+/)[0]
}

export async function sendWelcomeEmail({ full_name, email }) {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.warn('EmailJS not configured — skipping welcome email.')
    return
  }

  const first_name = getFirstName(full_name)

  await emailjs.send(
    SERVICE_ID,
    TEMPLATE_ID,
    {
      first_name,
      to_name:   full_name,
      to_email:  email,
      from_name: 'Signal Scouts',
      subject:   'Welcome to Signal Scouts — Your missions await',
      reply_to:  'hello@signalscouts.co.za',
    },
    PUBLIC_KEY,
  )
}
