import type { AppsScriptResponse, BathroomFormData } from '@/types/form'

export async function submitToAppsScript(data: BathroomFormData): Promise<AppsScriptResponse> {
  const webhookUrl = process.env.APPS_SCRIPT_WEBHOOK_URL
  const webhookSecret = process.env.APPS_SCRIPT_WEBHOOK_SECRET

  if (!webhookUrl) {
    throw new Error('APPS_SCRIPT_WEBHOOK_URL manquant.')
  }

  if (!webhookSecret) {
    throw new Error('APPS_SCRIPT_WEBHOOK_SECRET manquant.')
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...data,
      webhook_secret: webhookSecret,
      submittedAt: new Date().toISOString(),
    }),
    cache: 'no-store',
  })

  const text = await response.text()
  let parsed: AppsScriptResponse

  try {
    parsed = text ? (JSON.parse(text) as AppsScriptResponse) : { ok: false, error: 'Réponse Apps Script vide.' }
  } catch {
    throw new Error(`Réponse Apps Script illisible: ${text.slice(0, 240)}`)
  }

  if (!response.ok || !parsed.ok) {
    throw new Error(parsed.error || `Erreur Apps Script ${response.status}`)
  }

  return parsed
}
