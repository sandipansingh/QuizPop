import { Card } from '../../_shared/components/Card.jsx';
import { usePageMeta } from '../../../shared/hooks/usePageMeta.js';

export default function TermsOfServicePage() {
  usePageMeta({
    title: 'Terms of Service',
    description:
      'Review the QuizPop terms of service for account responsibilities, acceptable use, and service limitations.',
  });

  return (
    <section className="legal-page">
      <Card className="legal-card" accent="yellow">
        <p className="eyebrow">Legal</p>
        <h1>Terms of Service</h1>
        <p className="muted legal-updated">Last updated: April 19, 2026</p>

        <div className="legal-content">
          <h2>1. Acceptance Of Terms</h2>
          <p>
            By using QuizPop, you agree to these terms and all applicable laws.
            If you do not agree, discontinue use of the service.
          </p>

          <h2>2. Account Responsibility</h2>
          <p>
            You are responsible for maintaining account confidentiality and all
            activities performed under your account.
          </p>

          <h2>3. Acceptable Use</h2>
          <p>
            Abuse, automated misuse, cheating manipulation, or attempts to
            disrupt the platform are prohibited and may result in account
            suspension.
          </p>

          <h2>4. Service Availability</h2>
          <p>
            QuizPop may evolve, change, or pause features at any time for
            maintenance, security, or product improvements.
          </p>

          <h2>5. Limitation Of Liability</h2>
          <p>
            The service is provided as-is. To the extent permitted by law,
            maintainers are not liable for indirect damages arising from usage.
          </p>
        </div>
      </Card>
    </section>
  );
}
