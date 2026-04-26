import { Card } from '../../_shared/components/Card';
import { featureItems, steps, cornerColors } from './LandingData';

export function LandingFeatures() {
  return (
    <section
      id="landing-features"
      className="border-2 border-foreground rounded-lg p-6"
      style={{
        background:
          'radial-gradient(circle at 1px 1px, rgba(30,41,59,0.09) 1px, transparent 0) 0 0 / 18px 18px, #fffef8',
      }}
    >
      <p className="w-fit mx-auto mb-2.5 border-2 border-foreground rounded-sm px-3.5 py-2 font-heading text-[0.84rem] uppercase tracking-[0.08em] text-[#f8fafc] bg-secondary shadow-[4px_4px_0_0_var(--color-foreground)] rotate-[1.4deg]">
        Powerful Features
      </p>
      <h2 className="text-center text-[clamp(1.9rem,3.7vw,3rem)] font-heading">
        Everything You Need To Improve Every Round
      </h2>
      <p className="mt-2.5 mx-auto max-w-[720px] text-center text-muted-fg text-[1.05rem]">
        Designed for playful competition with serious performance tracking.
      </p>
      <div className="mt-5 grid grid-cols-3 gap-3.5 max-[960px]:grid-cols-1">
        {featureItems.map((item) => {
          const Icon = item.icon;
          return (
            <Card
              key={item.title}
              accent={item.tone}
              className="relative pt-14 overflow-hidden"
            >
              <span
                className={`absolute w-6 h-6 border-2 border-foreground rounded-[8px_8px_8px_0] right-2.5 top-2.5 ${cornerColors[item.tone]}`}
              />
              <div className="absolute left-[18px] top-4 w-11 h-11 rounded-full border-2 border-foreground bg-[color-mix(in_srgb,var(--color-secondary)_80%,#fff)] grid place-items-center">
                <Icon size={18} strokeWidth={2.5} />
              </div>
              <h3 className="text-[1.45rem] font-heading">{item.title}</h3>
              <p className="text-muted-fg mt-1">{item.description}</p>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

export function LandingHowItWorks() {
  return (
    <section
      id="landing-how"
      className="border-2 border-foreground rounded-lg p-6 bg-[#fffef8]"
    >
      <h2 className="text-center text-[clamp(1.9rem,3.7vw,3rem)] font-heading">
        How QuizPop Works
      </h2>
      <p className="mt-2.5 mx-auto max-w-[720px] text-center text-muted-fg text-[1.05rem]">
        Get up and competing in minutes, not days.
      </p>
      <ol className="relative mt-7 p-0 list-none grid grid-cols-3 gap-[18px] landing-steps-list max-[960px]:grid-cols-1">
        {steps.map((step, index) => (
          <li key={step.title} className="text-center relative z-2">
            <div className="mx-auto mb-3 w-[76px] h-[76px] rounded-full border-2 border-foreground bg-white grid place-items-center font-heading text-[2rem] text-accent">
              {index + 1}
            </div>
            <h3 className="text-[1.6rem] font-heading">{step.title}</h3>
            <p className="mt-2 text-muted-fg">{step.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function LandingValue() {
  return (
    <section
      id="landing-value"
      className="grid grid-cols-[1.1fr_0.9fr] gap-5 border-2 border-foreground rounded-lg bg-[#f5f9ff] p-6 max-[960px]:grid-cols-1"
    >
      <div>
        <p className="w-fit border-2 border-[color-mix(in_srgb,var(--color-accent)_45%,#1e293b)] rounded-sm px-3.5 py-2 font-heading text-[0.84rem] uppercase tracking-[0.08em] text-accent bg-[color-mix(in_srgb,var(--color-accent)_12%,#ffffff)] shadow-[4px_4px_0_0_color-mix(in_srgb,var(--color-accent)_22%,#94a3b8)] rotate-[1.4deg]">
          Why Players Stay
        </p>
        <h2 className="mt-2 text-[clamp(1.8rem,3.4vw,2.7rem)] font-heading">
          Stay Organized, Competitive, And Always Improving
        </h2>
        <p className="mt-3 text-[1.03rem] text-[#475569]">
          QuizPop centralizes your full quiz journey into one visual,
          high-energy experience that feels rewarding every session.
        </p>
        <blockquote className="mt-[18px] border-2 border-foreground rounded-md bg-white p-3.5 italic text-[#334155]">
          "Designed for speed and clarity, so every round feels fun while your
          progress keeps compounding."
        </blockquote>
      </div>
      <div className="relative min-h-[290px] max-[960px]:min-h-[220px]">
        <div className="absolute right-2.5 top-1 w-[210px] h-[210px] rounded-full border-2 border-foreground bg-[#f8fafc] landing-value-circle" />
        <div className="absolute right-[170px] top-[158px] w-[78px] h-[78px] border-2 border-foreground bg-tertiary rotate-12" />
        <div className="absolute left-6 bottom-3.5 w-[230px] h-[170px] border-2 border-foreground rounded-lg bg-[#f8fafc] flex items-center justify-center">
          <span className="w-[54px] h-[54px] bg-foreground rotate-45" />
        </div>
        <div className="absolute left-[200px] bottom-[118px] w-[114px] h-[114px] border-2 border-foreground rounded-full bg-accent" />
      </div>
    </section>
  );
}
