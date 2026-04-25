import { Card } from '../../_shared/components/Card';
import { usePageMeta } from '../../../shared/hooks/usePageMeta';

export default function TermsOfServicePage() {
  usePageMeta({
    title: 'Terms of Service',
    description:
      'Review the QuizPop terms of service for account responsibilities, acceptable use, and service limitations.',
  });

  return (
    <section className="grid place-items-center">
      <Card className="w-[min(920px,100%)]" accent="yellow">
        <p className="inline-flex items-center gap-2 text-[0.78rem] uppercase tracking-[0.16em] font-bold text-muted-fg">
          Legal
        </p>
        <h1 className="mt-2.5 text-[clamp(1.9rem,4.2vw,3rem)]">
          Terms of Service
        </h1>
        <p className="text-muted-fg mt-1.5">Last updated: April 19, 2026</p>
        <div className="mt-[18px] grid gap-2.5">
          {[
            {
              title: '1. Acceptance Of Terms',
              body: 'By using QuizPop, you agree to these terms and all applicable laws. If you do not agree, discontinue use of the service.',
            },
            {
              title: '2. Account Responsibility',
              body: 'You are responsible for maintaining account confidentiality and all activities performed under your account.',
            },
            {
              title: '3. Acceptable Use',
              body: 'Abuse, automated misuse, cheating manipulation, or attempts to disrupt the platform are prohibited and may result in account suspension.',
            },
            {
              title: '4. Service Availability',
              body: 'QuizPop may evolve, change, or pause features at any time for maintenance, security, or product improvements.',
            },
            {
              title: '5. Limitation Of Liability',
              body: 'The service is provided as-is. To the extent permitted by law, maintainers are not liable for indirect damages arising from usage.',
            },
          ].map(({ title, body }) => (
            <div key={title}>
              <h2 className="mt-2 text-[1.25rem] font-heading">{title}</h2>
              <p className="text-muted-fg">{body}</p>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}
