import React from 'react';
import { Shield, Zap, Globe, Users, Target, UserCheck } from 'lucide-react';
import SEO from '../../components/SEO';

const About = () => {
  const features = [
    { icon: Shield, title: 'Genuine Parts', desc: 'Every component is verified for authenticity and performance before listing.' },
    { icon: Globe, title: 'Global Reach', desc: 'Shipping worldwide with real-time tracking and secure packaging.' },
    { icon: Users, title: 'Expert Support', desc: 'Our technical team is available to help you troubleshoot your builds.' },
  ];

  return (
    <div className="pt-32 pb-32">
      <SEO 
        title="About Us - Founded by Mohd Kaif | IoTMart"
        description="Learn about IoTMart, the premier hardware marketplace founded and owned by Mohd Kaif for engineers, hobbyists, and IoT innovators."
        keywords="IoTMart About, Mohd Kaif, Founder IoTMart, Hardware Marketplace, IoT Components"
      />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-32">
        <div className="text-center">
          <p className="text-xs font-black text-accent uppercase tracking-[0.3em] mb-4">Founded & Owned by Mohd Kaif</p>
          <h1 className="text-5xl md:text-7xl font-black text-text-primary tracking-tighter mb-8 uppercase">
            Empowering the <br /> <span className="text-accent">IoT Revolution</span>
          </h1>
          <p className="max-w-2xl mx-auto text-text-secondary text-lg font-medium leading-relaxed">
            IoTMart was created by Mohd Kaif to serve as the ultimate backbone for engineers, hobbyists, and industrial innovators building the connected world of tomorrow.
          </p>
        </div>
      </section>

      <section className="bg-app-bg py-32 border-y border-border-subtle mb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-black uppercase tracking-widest border border-accent/20">
                <UserCheck className="w-4 h-4" /> Founder & Owner: Mohd Kaif
              </div>
              <h2 className="text-4xl font-black text-text-primary tracking-tight uppercase">High-Quality Components & Engineering Excellence</h2>
              <p className="text-text-secondary leading-relaxed font-medium">
                Under the leadership of Mohd Kaif, IoTMart provides genuine, rigorously tested, and high-performance IoT hardware at competitive pricing with seamless global logistics.
              </p>
            </div>
            <div className="relative aspect-square rounded-sm overflow-hidden shadow-2xl border-8 border-card-bg">
              <img 
                src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200" 
                alt="IoT Hardware" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div 
                key={feature.title}
                className="glass-card p-10 rounded-sm border border-border-main text-center hover:shadow-xl transition-all group"
              >
                <div className="w-16 h-16 bg-app-bg border border-border-main rounded-sm flex items-center justify-center mx-auto mb-8 group-hover:bg-accent group-hover:text-white transition-all">
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-4">{feature.title}</h3>
                <p className="text-text-muted text-sm leading-relaxed">{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default About;
