import { Link } from 'wouter';
import { ChevronLeft } from 'lucide-react';
import { Logo } from '@/components/logo';

const LAST_UPDATED = 'July 2026';

export default function Terms() {
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
          <h1 className="text-5xl font-serif font-black uppercase tracking-tight">Terms of Use</h1>
          <p className="text-muted-foreground font-mono text-sm mt-4">Last updated: {LAST_UPDATED}</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16 space-y-10 prose-legal">
        <Section title="1. Acceptance of Terms">
          By accessing or using Turasum ("the Service", "we", "us", "our"), you agree to be bound by these Terms of Use. If you do not agree, do not use the Service. These Terms apply to all visitors, users, and others who access or use the Service.
        </Section>

        <Section title="2. Description of Service">
          Turasum is an AI-powered travel narrative platform that processes your photographs to generate written stories, trip summaries, and exportable documents. The Service uses third-party artificial intelligence to analyse image metadata and produce content. You understand that AI-generated content may occasionally be inaccurate, incomplete, or require review.
        </Section>

        <Section title="3. User Accounts">
          You must create an account to access certain features. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must promptly notify us of any unauthorised use. You agree to provide accurate and current information during registration and to keep such information up to date.
        </Section>

        <Section title="4. Content Ownership and Licence">
          <strong>Your content:</strong> You retain all intellectual property rights in the photographs and materials you upload ("User Content"). By uploading content, you grant Turasum a limited, non-exclusive, royalty-free licence to process, store, and use your User Content solely to operate and improve the Service.
          <br /><br />
          <strong>Generated content:</strong> AI-generated narratives, summaries, and documents produced from your content are provided to you for personal, non-commercial use. We make no claim of ownership over generated content derived from your uploads.
        </Section>

        <Section title="5. Prohibited Use">
          You agree not to: (a) upload content you do not own or have the right to use; (b) upload content that is unlawful, defamatory, obscene, or infringes any third-party rights; (c) use the Service to harass, abuse, or harm any person; (d) attempt to reverse-engineer, scrape, or otherwise circumvent any security or access control of the Service; (e) use automated tools to access the Service without prior written consent; or (f) use the Service for any commercial purpose without a written agreement with us.
        </Section>

        <Section title="6. Privacy">
          Your use of the Service is also governed by our <Link href="/privacy" className="text-primary underline underline-offset-2">Privacy Policy</Link>, which is incorporated herein by reference. Please review it carefully.
        </Section>

        <Section title="7. Intellectual Property">
          All trademarks, service marks, logos, and trade names displayed on the Service are proprietary to Turasum or their respective owners. Nothing in these Terms grants you any right to use any such marks without prior written permission.
        </Section>

        <Section title="8. Disclaimer of Warranties">
          THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.
        </Section>

        <Section title="9. Limitation of Liability">
          TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, TURASUM SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF DATA, REVENUE, PROFITS, BUSINESS, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH THESE TERMS OR YOUR USE OF THE SERVICE, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. OUR TOTAL LIABILITY TO YOU FOR ANY CAUSE OF ACTION SHALL NOT EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID US IN THE TWELVE MONTHS PRECEDING THE CLAIM OR (B) £100 GBP.
        </Section>

        <Section title="10. Indemnification">
          You agree to defend, indemnify, and hold harmless Turasum, its affiliates, officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses (including legal fees) arising out of or related to your use of the Service, your User Content, or your breach of these Terms.
        </Section>

        <Section title="11. Termination">
          We reserve the right to suspend or terminate your access to the Service at any time and for any reason, including but not limited to breach of these Terms, without prior notice or liability. Upon termination, your right to use the Service will immediately cease.
        </Section>

        <Section title="12. Changes to Terms">
          We may update these Terms from time to time. We will notify you of significant changes by updating the "Last updated" date above or by other means. Your continued use of the Service after changes take effect constitutes your acceptance of the revised Terms.
        </Section>

        <Section title="13. Governing Law">
          These Terms are governed by and construed in accordance with the laws of England and Wales, without regard to its conflict of law provisions. Any disputes arising under or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts of England and Wales.
        </Section>

        <Section title="14. Contact">
          If you have questions about these Terms, please contact us via the Service.
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
