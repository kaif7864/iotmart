import React from 'react';
import { useLocation } from 'react-router-dom';
import { ShieldCheck, FileText, Lock, Scale, UserCheck } from 'lucide-react';
import SEO from '../../components/SEO';

const Legal = () => {
  const location = useLocation();
  const isPrivacy = location.pathname.includes('privacy');

  const content = isPrivacy ? {
    title: 'Privacy Policy',
    subtitle: 'Official Data Protection & Privacy Governance',
    icon: Lock,
    lastUpdated: 'July 30, 2026',
    sections: [
      {
        title: 'Platform Ownership & Data Controller',
        text: 'IoTMart is a hardware e-commerce and IoT device ecosystem platform owned and operated by Mohd Kaif ("Founder & Data Controller"). References to "we", "us", or "our" in this policy refer directly to IoTMart and Mohd Kaif as the legal platform owner.'
      },
      {
        title: 'Information We Collect',
        text: 'We collect information you provide directly when creating an account, placing hardware orders, streaming IoT device telemetry, or contacting support. This includes your full name, email address, phone number, shipping address, billing details, and device configurations. Payment transactions are processed directly by certified PCI-DSS compliant gateways (Razorpay & Cashfree); we do not store raw credit card numbers or banking credentials on our servers.'
      },
      {
        title: 'How We Process & Use Data',
        text: 'Your data is processed strictly for: (a) fulfilling component orders and tracking shipments, (b) authenticating users and securing IoT device streams, (c) providing AI-assisted hardware recommendations via Groq AI, and (d) delivering transactional notifications (SMS/Email/WhatsApp alerts). We do NOT sell, rent, or trade user personal data to third-party advertisers.'
      },
      {
        title: 'Data Security & SSL Encryption',
        text: 'We implement modern end-to-end security measures including 256-bit TLS/SSL encryption, bcrypt password hashing, JWT session verification, and restricted database access. All data transmission between your browser, IoT edge devices, and our servers is strictly encrypted.'
      },
      {
        title: 'Cookies, Analytics & Telemetry',
        text: 'IoTMart uses essential functional cookies and local storage to keep you logged in and retain cart state. Real-time telemetry streamed from microcontrollers is processed transiently to render live hardware metrics on your dashboard and is not retained beyond session requirements unless explicitly logged.'
      },
      {
        title: 'Third-Party Service Providers',
        text: 'To deliver our services, we integrate with trusted infrastructure providers: Payment Gateways (Razorpay, Cashfree), Logistics (Shiprocket), Cloud Storage (Cloudinary, MongoDB Atlas), and Infrastructure (Render). All third-party partners adhere to strict data privacy and security mandates.'
      },
      {
        title: 'User Rights & Data Control',
        text: 'Under applicable data protection regulations (including IT Act 2000, DPDP Act, GDPR, and CCPA), you have the right to access, update, export, or permanently delete your account and stored personal data at any time directly through your Profile Settings or by reaching out to our privacy contact.'
      },
      {
        title: 'Contact Information & Grievance',
        text: 'If you have questions regarding this Privacy Policy or wish to exercise your data protection rights, please contact Mohd Kaif (Founder & Data Controller) directly at mohdkaif@iotmart.com or legal@iotmart.com.'
      }
    ]
  } : {
    title: 'Terms & Conditions',
    subtitle: 'Legal Guidelines for Using IoTMart Platform',
    icon: Scale,
    lastUpdated: 'July 30, 2026',
    sections: [
      {
        title: 'Acceptance of Terms & Ownership',
        text: 'By accessing, browsing, or purchasing from IoTMart (owned and operated by Mohd Kaif), you agree to comply with and be bound by these Terms and Conditions. If you do not agree, please discontinue platform usage.'
      },
      {
        title: 'Hardware Products & Specifications',
        text: 'While we ensure high accuracy for electronic component datasheets, specs, and pinouts, hardware variations can occur. All products are guaranteed genuine. Pricing and stock availability are subject to real-time updates.'
      },
      {
        title: 'Orders, Payments & Pricing',
        text: 'All transactions are priced in Indian Rupees (INR) or USD equivalent. We reserve the right to cancel or refund orders in cases of pricing anomalies, component stockout, or fraudulent activity.'
      },
      {
        title: 'Intellectual Property & Rights',
        text: 'All proprietary software, codebases, custom schematics, brand assets, and platform design are the sole intellectual property of Mohd Kaif and IoTMart. Unauthorized reproduction or reverse engineering is prohibited.'
      },
      {
        title: 'Limitation of Liability',
        text: 'IoTMart and Mohd Kaif shall not be held liable for indirect, incidental, or consequential damages resulting from circuit miswiring, short circuits, or misuse of electronic hardware components purchased on our store.'
      }
    ]
  };

  return (
    <div className="pt-32 pb-32 min-h-screen bg-app-bg">
      <SEO 
        title={`${content.title} - Mohd Kaif | IoTMart`}
        description={`Official ${content.title} for IoTMart, owned and operated by Mohd Kaif. Learn about data security, rights, and platform terms.`}
        keywords="IoTMart Privacy Policy, Mohd Kaif Owner, Data Protection, Terms and Conditions"
      />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <header className="text-center mb-16">
          <div className="w-20 h-20 bg-accent/5 rounded-full flex items-center justify-center mx-auto mb-6 text-accent border border-accent/10">
            <content.icon className="h-10 w-10" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-text-primary tracking-tight uppercase mb-4">{content.title}</h1>
          <p className="text-text-secondary font-medium uppercase tracking-[0.2em] text-xs">{content.subtitle}</p>
        </header>

        <div className="bg-card-bg rounded-sm border border-border-main p-8 md:p-16 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-8 border-b border-border-subtle mb-12 gap-4">
            <div>
              <span className="text-[10px] font-black text-accent uppercase tracking-[0.3em] block mb-1">Owner & Controller: Mohd Kaif</span>
              <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">Official Legal Document</span>
            </div>
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest bg-app-bg px-3 py-1.5 border border-border-subtle rounded-sm">Last Updated: {content.lastUpdated}</span>
          </div>

          <div className="space-y-12">
            {content.sections.map((section, i) => (
              <section key={i}>
                <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-3">
                  <span className="text-accent text-lg">0{i+1}.</span>
                  {section.title}
                </h2>
                <p className="text-text-secondary leading-relaxed font-medium">
                  {section.text}
                </p>
              </section>
            ))}
          </div>

          <div className="mt-20 pt-8 border-t border-border-subtle text-center">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Questions or Grievances? Contact Platform Founder</p>
            <p className="text-sm font-bold text-text-primary mb-3">Mohd Kaif <span className="text-text-muted font-normal">(Founder & Owner)</span></p>
            <div className="flex justify-center items-center gap-4 text-xs">
              <a href="mailto:mohdkaif@iotmart.com" className="text-accent font-black hover:underline tracking-tight">mohdkaif@iotmart.com</a>
              <span className="text-text-muted">•</span>
              <a href="mailto:legal@iotmart.com" className="text-accent font-black hover:underline tracking-tight">legal@iotmart.com</a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Legal;
