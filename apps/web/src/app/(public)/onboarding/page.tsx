import { redirect } from 'next/navigation';

/** Legacy route — real onboarding lives at /onboarding/risk */
export default function OnboardingRedirectPage() {
  redirect('/onboarding/risk');
}
