import { Card } from '../../_shared/components/Card';
import { usePageMeta } from '../../../shared/hooks/usePageMeta';

export default function CookiePolicyPage() {
  usePageMeta({
    title: 'Cookie Policy',
    description:
      'Learn how QuizPop uses cookies for authentication, security, and basic product analytics.',
  });

  return (
    <section className="grid place-items-center">
      <Card className="w-[min(920px,100%)]" accent="pink">
        <p className="inline-flex items-center gap-2 text-[0.78rem] uppercase tracking-[0.16em] font-bold text-muted-fg">
          Legal
        </p>
        <h1 className="mt-2.5 text-[clamp(1.9rem,4.2vw,3rem)]">
          Cookie Policy
        </h1>
        <p className="text-muted-fg mt-1.5">Last updated: April 19, 2026</p>
        <div className="mt-[18px] grid gap-2.5">
          {[
            {
              title: '1. Essential Cookies',
              body: 'QuizPop uses essential cookies for login sessions, CSRF protection, and secure request handling.',
            },
            {
              title: '2. Preference Cookies',
              body: 'Preference cookies may be used to remember user settings and improve usability across visits.',
            },
            {
              title: '3. Security Usage',
              body: 'Security-related cookies help prevent unauthorized actions and detect suspicious behavior in authenticated flows.',
            },
            {
              title: '4. Third-Party Cookies',
              body: 'QuizPop does not intentionally set advertising cookies. Third-party tools, if introduced, will be documented here.',
            },
            {
              title: '5. Managing Cookies',
              body: 'You can clear or block cookies in your browser settings, but some authenticated features may stop working correctly.',
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
