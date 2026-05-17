import webpush from 'web-push';

const REQUIRED_PUSH_ENV_VARS = ['VAPID_SUBJECT', 'VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY'] as const;

let vapidConfigured = false;

export interface PushPayload {
  title: string;
  body: string;
}

export interface PushTarget {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export function getMissingPushEnvVars(): string[] {
  return REQUIRED_PUSH_ENV_VARS.filter((key) => !process.env[key]);
}

function ensureWebPushConfigured() {
  if (vapidConfigured) return;

  const missingEnvVars = getMissingPushEnvVars();
  if (missingEnvVars.length > 0) {
    throw new Error(`Missing VAPID environment variables: ${missingEnvVars.join(', ')}`);
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );

  vapidConfigured = true;
}

export async function sendPush(target: PushTarget, payload: PushPayload): Promise<'sent' | 'stale'> {
  ensureWebPushConfigured();

  try {
    await webpush.sendNotification(
      { endpoint: target.endpoint, keys: target.keys },
      JSON.stringify(payload),
    );
    return 'sent';
  } catch (err: unknown) {
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 410 || status === 404) return 'stale';
    throw err;
  }
}
