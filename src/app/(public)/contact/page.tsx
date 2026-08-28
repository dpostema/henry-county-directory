import { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactForm from "./ContactForm";
import { Mail, MapPin, Phone } from "lucide-react";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Contact Us | ${siteConfig.name}`,
  description: `Get in touch with the ${siteConfig.name} team for support, inquiries, or feedback.`,
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-brandBg-app text-brandText-medium font-body flex flex-col">
      <Header sticky={false} />
      
      <main className="flex-grow">
        {/* Simple Hero Section */}
        <div className="bg-slate-900 py-16 sm:py-24 text-center px-4">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-heading mb-4 tracking-tight">
            Contact Us
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Have a question, need help with your listing, or want to partner with us? We&apos;d love to hear from you. Fill out the form below and our team will get back to you shortly.
          </p>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Contact Info */}
            <div className="lg:col-span-1 space-y-8">
              <section className="bg-white p-6 rounded-card border border-brandBorder-light shadow-sm">
                <h3 className="text-lg font-bold text-brandText-dark font-heading mb-6 border-b border-brandBorder-light pb-2">
                  Get in Touch
                </h3>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-brandRed-muted rounded-full text-brandRed">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-brandText-dark mb-1">Email Support</h4>
                      <a href="mailto:support@henrycodirectory.online" className="text-sm text-brandText-medium hover:text-brandRed transition-colors">
                        support@henrycodirectory.online
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-brandRed-muted rounded-full text-brandRed">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-brandText-dark mb-1">Call Us</h4>
                      <p className="text-sm text-brandText-medium">
                        Mon-Fri, 9am - 5pm EST<br/>
                        (770) 555-0199
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-brandRed-muted rounded-full text-brandRed">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-brandText-dark mb-1">Office</h4>
                      <p className="text-sm text-brandText-medium">
                        {siteConfig.region.name}<br/>
                        Georgia, USA
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <ContactForm />
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
