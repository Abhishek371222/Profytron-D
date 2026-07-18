export function isExperienceEngineEnabled(): boolean {
  return process.env.NEXT_PUBLIC_EXPERIENCE_ENGINE !== '0';
}
