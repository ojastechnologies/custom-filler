import React from 'react';

interface WhatsAppButtonProps {
  phoneNumber: string;
  message?: string;
}

const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({ 
  phoneNumber, 
  message = "Hello! I'm interested in your aerosol filling services."
}) => {
  // Format phone number (remove any non-digit characters)
  const formattedPhone = phoneNumber.replace(/\D/g, '');
  
  // Create WhatsApp URL with phone and pre-filled message
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  
  return (
    <a 
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
      aria-label="Chat on WhatsApp"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className="w-6 h-6"
      >
        <path 
          d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" 
        />
        <path 
          d="M12 1.5C5.925 1.5 1 6.425 1 12.5c0 2.25.675 4.35 1.875 6.075L1 22.5l4.125-1.125c1.65 1.05 3.6 1.625 5.625 1.625h.375c6.075 0 11-4.925 11-11 0-2.925-1.125-5.7-3.225-7.8C17.7 2.625 14.925 1.5 12 1.5zm0 20.25h-.375c-1.8 0-3.525-.525-5.025-1.5l-.375-.225-3.6.975.975-3.525-.225-.375c-1.05-1.65-1.575-3.525-1.575-5.475 0-5.625 4.575-10.2 10.2-10.2 2.7 0 5.25 1.05 7.125 2.925 1.95 1.95 3 4.5 3 7.275 0 5.625-4.575 10.2-10.125 10.2z" 
          fillRule="evenodd" 
          clipRule="evenodd"
        />
      </svg>
    </a>
  );
};

export default WhatsAppButton;