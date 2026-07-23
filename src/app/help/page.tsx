import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-brandBg-app text-brandText-medium font-body flex flex-col">
      <Header />
      <main className="flex-grow py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <h1 className="text-4xl font-heading font-black text-brandText-dark tracking-tight mb-6">
          Help & <span className="text-brandRed">Support</span>
        </h1>
        <div className="bg-white p-8 rounded-card border border-brandBorder-light shadow-sm space-y-6">
          <h2 className="text-xl font-bold font-heading text-brandText-dark">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <details className="group border-b border-brandBorder-light pb-4">
              <summary className="font-semibold cursor-pointer text-brandText-dark hover:text-brandRed transition-colors">
                How do I add my business to the directory?
              </summary>
              <p className="mt-2 text-sm text-brandText-medium font-light leading-relaxed">
                You can add your business by clicking the &quot;Add Listing&quot; button in the top right corner of the header. Alternatively, you can browse existing unverified listings and click &quot;Claim Business&quot; to take ownership.
              </p>
            </details>
            <details className="group border-b border-brandBorder-light pb-4">
              <summary className="font-semibold cursor-pointer text-brandText-dark hover:text-brandRed transition-colors">
                How much does it cost?
              </summary>
              <p className="mt-2 text-sm text-brandText-medium font-light leading-relaxed">
                Basic listings are completely free! We also offer Premium and Enterprise tiers which provide featured placements, advanced analytics, and prioritized lead generation.
              </p>
            </details>
            <details className="group border-b border-brandBorder-light pb-4">
              <summary className="font-semibold cursor-pointer text-brandText-dark hover:text-brandRed transition-colors">
                How do I contact support?
              </summary>
              <p className="mt-2 text-sm text-brandText-medium font-light leading-relaxed">
                If you have an urgent inquiry or billing question, you can reach out to our dedicated support team at <strong>support@henrycountydirectory.com</strong> or call us at 770-555-0199.
              </p>
            </details>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
