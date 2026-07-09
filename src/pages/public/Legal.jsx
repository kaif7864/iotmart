import React from 'react';
import { useLocation } from 'react-router-dom';
import { ShieldCheck, FileText, Lock, Scale } from 'lucide-react';

const Legal = () => {
  const location = useLocation();
  const isPrivacy = location.pathname.includes('privacy');

  const content = isPrivacy ? {
    title: 'Privacy Policy',
    subtitle: 'Your Data Security is our Priority',
    icon: Lock,
    lastUpdated: 'May 1, 2024',
    sections: [
      {
        title: 'Information We Collect',
        text: 'We collect information you provide directly to us, such as when you create an account, place an order, or contact us for support. This includes your name, email address, shipping address, and payment information.'
      },
      {
        title: 'How We Use Your Information',
        text: 'We use the information we collect to process your orders, communicate with you about your purchases, and improve our services. We do not sell your personal data to third parties.'
      },
      {
        title: 'Data Security',
        text: 'We implement industry-standard security measures to protect your personal information from unauthorized access, disclosure, or destruction.'
      }
    ]
  } : {
    title: 'Terms & Conditions',
    subtitle: 'Legal Guidelines for Using IoTMart',
    icon: Scale,
    lastUpdated: 'May 1, 2024',
    sections: [
      {
        title: 'Acceptance of Terms',
        text: 'By accessing or using the IoTMart platform, you agree to be bound by these terms and conditions. If you do not agree, please do not use our services.'
      },
      {
        title: 'Product Availability',
        text: 'While we strive for accuracy, product availability and pricing are subject to change without notice. We reserve the right to limit quantities or refuse service.'
      },
      {
        title: 'Limitation of Liability',
        text: 'IoTMart is not liable for any indirect, incidental, or consequential damages arising from the use of components purchased through our platform.'
      }
    ]
  };

  return (
    <div className="pt-32 pb-32 min-h-screen bg-app-bg">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <header className="text-center mb-16">
          <div className="w-20 h-20 bg-accent/5 rounded-full flex items-center justify-center mx-auto mb-6 text-accent border border-accent/10">
            <content.icon className="h-10 w-10" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-text-primary tracking-tight uppercase mb-4">{content.title}</h1>
          <p className="text-text-secondary font-medium uppercase tracking-[0.2em] text-xs">{content.subtitle}</p>
        </header>

        <div className="bg-card-bg rounded-sm border border-border-main p-8 md:p-16 shadow-sm">
          <div className="flex justify-between items-center pb-8 border-b border-border-subtle mb-12">
            <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">Official Document</span>
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Last Updated: {content.lastUpdated}</span>
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
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4">Questions about this document?</p>
            <a href="mailto:legal@iotmart.com" className="text-accent font-black text-sm hover:underline tracking-tight">legal@iotmart.com</a>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Legal;
