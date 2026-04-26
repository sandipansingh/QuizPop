import { Card } from '../../_shared/components/Card';
import { usePageMeta } from '../../../shared/hooks/usePageMeta';

export default function PrivacyPolicyPage() {
  usePageMeta({
    title: 'Privacy Policy',
    description:
      'Read the QuizPop privacy policy to understand what data we collect, why we collect it, and how it is protected.',
  });

  return (
    <section className="grid place-items-center">
      <Card className="w-[min(920px,100%)]" accent="mint">
        <p className="inline-flex items-center gap-2 text-[0.78rem] uppercase tracking-[0.16em] font-bold text-muted-fg">
          Legal
        </p>
        <h1 className="mt-2.5 text-[clamp(1.9rem,4.2vw,3rem)]">
          Privacy Policy
        </h1>
        <p className="text-muted-fg mt-1.5">Last updated: April 19, 2026</p>
        <div className="mt-[18px] grid gap-2.5">
          {[
            {
              title: '1. Information We Collect',
              body: 'QuizPop collects account details you provide directly such as username, email, and profile preferences. We also store gameplay information including scores, quiz attempts, and leaderboard stats.',
            },
            {
              title: '2. How We Use Data',
              body: 'Your data is used to authenticate your account, provide quiz features, personalize your profile, and power rankings and multiplayer rooms.',
            },
            {
              title: '3. Cookies And Sessions',
              body: 'We use secure cookies and tokens to manage authenticated sessions, CSRF protection, and essential platform security features.',
            },
            {
              title: '4. Data Sharing',
              body: 'We do not sell personal data. Limited technical service providers may process data only as required to operate core platform infrastructure.',
            },
            {
              title: '5. Contact',
              body: 'If you have privacy questions, contact the QuizPop maintainers for support and deletion requests.',
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
