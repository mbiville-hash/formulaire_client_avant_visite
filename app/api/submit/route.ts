import { NextResponse } from 'next/server'
import { submitToAppsScript } from '@/lib/appscript'
import { validateSubmitPayload } from '@/lib/validation'
import type { SubmitPayload, SubmitResponse } from '@/types/form'

export async function POST(request: Request) {
  let payload: SubmitPayload

  try {
    payload = (await request.json()) as SubmitPayload
  } catch {
    return NextResponse.json<SubmitResponse>(
      { ok: false, error: 'Le formulaire envoyé est invalide.' },
      { status: 400 },
    )
  }

  const validation = validateSubmitPayload(payload)
  if (!validation.valid || !validation.data) {
    return NextResponse.json<SubmitResponse>(
      { ok: false, error: 'Certains champs sont à corriger.', fieldErrors: validation.fieldErrors },
      { status: 400 },
    )
  }

  const turnstileOk = await verifyTurnstile(payload.cfTurnstileToken)
  if (!turnstileOk) {
    return NextResponse.json<SubmitResponse>(
      {
        ok: false,
        error: 'La vérification anti-spam a échoué. Merci de réessayer.',
        fieldErrors: { cfTurnstileToken: 'Vérification anti-spam invalide.' },
      },
      { status: 400 },
    )
  }

  try {
    const result = await submitToAppsScript(validation.data)
    return NextResponse.json<SubmitResponse>({
      ok: true,
      message: 'Merci, votre formulaire a bien été envoyé.',
      fileId: result.fileId,
      fileName: result.fileName,
      fileUrl: result.fileUrl,
    })
  } catch (error) {
    console.error('Submit failed', error)
    return NextResponse.json<SubmitResponse>(
      {
        ok: false,
        error: 'Une erreur est survenue pendant l’envoi. Merci de réessayer ou de nous contacter directement.',
      },
      { status: 502 },
    )
  }
}

async function verifyTurnstile(token?: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true
  if (!token) return false

  const body = new FormData()
  body.append('secret', secret)
  body.append('response', token)

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
      cache: 'no-store',
    })
    const result = (await response.json()) as { success?: boolean }
    return Boolean(result.success)
  } catch (error) {
    console.error('Turnstile verification failed', error)
    return false
  }
}
