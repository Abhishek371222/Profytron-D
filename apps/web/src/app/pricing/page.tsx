import Link from "next/link";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    monthly: "Free",
    description: "For new traders exploring signals and paper strategies.",
    cta: "Get Started",
    href: "/register",
    featured: false,
    testId: "starter-plan",
    features: [
      "Community strategies",
      "Paper trading account",
      "Basic analytics",
    ],
  },
  {
    name: "Premium",
    monthly: "$49/mo",
    description: "For active traders who need automation and AI assistance.",
    cta: "Subscribe",
    href: "/marketplace",
    featured: true,
    testId: "premium-plan",
    features: [
      "AI coach insights",
      "Advanced analytics",
      "Marketplace access",
      "Priority support",
    ],
  },
  {
    name: "Elite",
    monthly: "$149/mo",
    description: "For serious creators deploying high-frequency strategies.",
    cta: "Contact Sales",
    href: "/community",
    featured: false,
    testId: "elite-plan",
    features: [
      "All Premium features",
      "Multi-account orchestration",
      "Creator monetization tools",
    ],
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-black text-white px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Pricing
        </h1>
        <p className="mt-3 text-white/60 max-w-2xl">
          Choose a plan and start building automated strategies with Profytron.
        </p>

        <section className="mt-12 grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              data-testid={plan.testId}
              className={`rounded-2xl border p-6 ${
                plan.featured
                  ? "border-indigo-400/60 bg-indigo-500/10"
                  : "border-white/10 bg-white/5"
              }`}
            >
              <h2 className="text-2xl font-semibold">{plan.name}</h2>
              <p className="mt-2 text-3xl font-bold">{plan.monthly}</p>
              <p className="mt-3 text-sm text-white/60">{plan.description}</p>

              <ul className="mt-6 space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-emerald-400" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                data-testid={plan.name === "Premium" ? "subscribe-button" : undefined}
                className={`mt-8 inline-flex h-11 w-full items-center justify-center rounded-lg font-semibold transition ${
                  plan.featured
                    ? "bg-indigo-500 hover:bg-indigo-400"
                    : "bg-white/10 hover:bg-white/20"
                }`}
              >
                {plan.cta}
              </Link>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
