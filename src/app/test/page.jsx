"use client";

import React, { useEffect, useRef } from 'react';
import { Bricolage_Grotesque } from 'next/font/google';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['200', '400', '600', '800'],
  variable: '--font-bricolage',
  display: 'swap',
});

const MinimalGradientAnimation = () => {
  const containerRef = useRef(null);
  const scrollPositionRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      // احسب النسبة المئوية للتمرير
      scrollPositionRef.current = window.scrollY / (document.body.scrollHeight - window.innerHeight);

      // تحديث الخلفية: من الأسود إلى الأخضر حسب التمرير
      containerRef.current.style.background = `
        linear-gradient(to bottom, 
          rgba(0, 0, 0, ${1 - scrollPositionRef.current * 0.8}), 
          rgba(0, 228, 0, ${scrollPositionRef.current * 1.2})
        )
      `;

      // تدوير العنصر حسب التمرير
      const rotation = scrollPositionRef.current * 160;
      
      const frames = containerRef.current.querySelectorAll('.animated-frame');
      frames.forEach((frame) => {
        frame.style.transform = `rotate(${rotation}deg)`;
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div 
      ref={containerRef}
      className="min-h-[1000vh] w-full transition-colors duration-100"
    >
      <div className={bricolage.className}>
        <h1 className="text-[260px] mt-1 ml-[10px] text-white">Webtrix</h1>
        <h1 className="text-[260px] mt-1 ml-[700px] text-white">Webtrix</h1>

      </div>

      {/* الإطارات المتحركة في الوسط */}
      <div className="fixed flex top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="animated-frame w-[240px] h-[360px] bg-white rounded-[40px] transition-transform duration-300 mb-4" />
        <div className="animated-frame w-[240px] h-[360px] bg-white rounded-[40px] transition-transform duration-100" />
      </div>
    </div>
  );
};

export default MinimalGradientAnimation;
