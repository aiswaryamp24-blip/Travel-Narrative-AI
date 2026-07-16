import { Link } from 'wouter';
import { ChevronLeft } from 'lucide-react';
import { Logo } from '@/components/logo';

const LAST_UPDATED = 'July 2026';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <nav className="py-4 px-6 flex justify-between items-center border-b border-border bg-background/90 backdrop-blur-sm sticky top-0 z-40">
        <Logo className="text-lg" />
        <Link href="/" className="inline-flex items-center text-xs font-bold font-mono uppercase tracking-widest border border-primary/50 px-3 py-1.5 text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200">
          <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Back
        </Link>
      </nav>

      <header className="border-b border-border py-16 px-6 bg-card">
        <div className="max-w-3xl mx-auto">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">Legal</p>
          <h1 className="text-5xl font-serif font-black uppercase tracking-tight">Privacy Policy</h1>
          <p className="text-muted-foreground font-mono text-sm mt-4">Last updated: {LAST_UPDATED}</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16 space-y-10">
        <Section title="1. Introduction">
          Turasum ("we", "us", "our") is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your data when you use the Service. Please read this policy carefully. If you do not agree, please discontinue use of the Service.
        </Section>

        <Section title="2. Information We Collect">
          <strong>Account information:</strong> When you register, we collect your email address and any profile details you provide via our authentication provider (Clerk).
          <br /><br />
          <strong>Photos and media:</strong> Photos you upload are stored securely in cloud object storage. We extract and store metadata (EXIF data including GPS coordinates and timestamps) to power trip clustering and mapping features.
          <br /><br />
          <strong>Usage data:</strong> We collect standard server logs (IP addresses, browser user-agent, pages visited, timestamps) for security, debugging, and service improvement.
          <br /><br />
          <strong>Communications:</strong> If you contact us, we retain those communications to respond to you.
        </Section>

        <Section title="3. How We Use Your Information">
          We use your personal data to: (a) provide and operate the Service; (b) generate AI-powered trip narratives and documents from your photos; (c) send service-related notifications (account alerts, feature updates) where you have not opted out; (d) detect and prevent fraud, abuse, or security incidents; and (e) comply with legal obligations.
        </Section>

        <Section title="4. AI Processing">
          Photos and metadata you upload are processed using third-party AI services (including Anthropic and OpenAI) to generate narratives and analyse content. These providers process data on our behalf under data processing agreements that restrict their use of your data to providing their services to us. We do not sell your data to AI providers for model training.
        </Section>

        <Section title="5. Data Sharing and Disclosure">
          We do not sell your personal information. We may share your data with: (a) service providers acting on our behalf (cloud storage, authentication, AI processing, email delivery); (b) law enforcement or regulatory bodies where required by law; or (c) a successor entity in the event of a merger, acquisition, or asset sale, subject to the same privacy commitments.
        </Section>

        <Section title="6. Public and Private Content">
          Trip stories set to "public" visibility may be displayed to other users on the platform. Stories set to "private" or "friends only" are only accessible by you or users you explicitly permit. We do not surface private content publicly.
        </Section>

        <Section title="7. Data Retention">
          We retain your account data and uploaded content for as long as your account is active. You may delete individual trips or your entire account at any time through the Service; deleted data is purged from our storage within 30 days, except where retention is required by law.
        </Section>

        <Section title="8. Security">
          We use industry-standard security measures including encryption in transit (TLS) and at rest. However, no method of transmission or storage is 100% secure. You are responsible for keeping your account credentials confidential.
        </Section>

        <Section title="9. Cookies and Tracking">
          We use cookies and similar technologies to maintain your session and remember your preferences. We do not use third-party advertising cookies. You can disable cookies in your browser settings, though this may affect Service functionality.
        </Section>

        <Section title="10. Your Rights">
          Depending on your jurisdiction, you may have rights to: access, rectify, or erase your personal data; restrict or object to certain processing; data portability; and withdraw consent where processing is based on consent. To exercise your rights, contact us through the Service. We will respond within 30 days.
        </Section>

        <Section title="11. Children's Privacy">
          The Service is not directed to children under the age of 16. We do not knowingly collect personal data from children under 16. If we learn we have collected such data, we will delete it promptly.
        </Section>

        <Section title="12. International Transfers">
          Your data may be processed in countries outside your own, including the United States and the European Union. We ensure appropriate safeguards are in place for any international transfers of personal data.
        </Section>

        <Section title="13. Changes to This Policy">
          We may update this Privacy Policy from time to time. We will notify you by updating the "Last updated" date. Your continued use of the Service after changes take effect constitutes your acceptance of the updated policy.
        </Section>

        <Section title="14. Contact">
          If you have questions or concerns about this Privacy Policy, please contact us through the Service.
        </Section>
      </main>

      <footer className="border-t border-border py-8 px-6 text-center">
        <div className="flex items-center justify-center gap-6 text-xs font-mono uppercase tracking-widest text-muted-foreground">
          <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Use</Link>
          <span className="h-3 w-px bg-border" />
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 border-b border-border pb-10">
      <h2 className="text-xl font-serif font-bold text-foreground">{title}</h2>
      <div className="text-muted-foreground leading-relaxed text-[15px]">{children}</div>
    </section>
  );
}
