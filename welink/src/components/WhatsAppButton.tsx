import React from 'react';

interface WhatsAppButtonProps {
  phone: string;
  message?: string;
  className?: string;
  iconOnly?: boolean;
  label?: string;
}

export default function WhatsAppButton({
  phone,
  message = "Bonjour ! Je vous contacte depuis la plateforme WeLink.",
  className = "",
  iconOnly = true,
  label
}: WhatsAppButtonProps) {
  // Strip all non-numeric characters from the phone number
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (!cleanPhone) return null;

  const handleWhatsAppRedirect = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Standard URL format for wa.me direct API redirection
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    // Log for debugging/telemetry (optional, standard browser behaviour)
  };

  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

  if (iconOnly) {
    return (
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleWhatsAppRedirect}
        className={`inline-flex items-center justify-center p-1.5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white rounded-lg transition duration-150 hover:scale-[1.1] shadow-sm hover:shadow cursor-pointer ${className}`}
        title={`Discuter sur WhatsApp: ${phone}`}
      >
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-11.75c-.124-.207-.464-.329-.977-.585s1.424-.754 1.89-1.011c.469-.172.812-.258 1.153.259.34.515 1.318 1.664 1.614 2 .297.334-.593.376 1.107.12a14.502 14.502 0 0 0 4.089-2.528c1.093-.974 1.83-2.178 2.045-2.548.215-.371.023-.57.192-.784-.193-.19-.464-.537-.696-.807-.23-.27-.307-.456-.461-.759-.153-.304-.077-.571-.038-.827.115-.257-.977-2.355-1.339-3.227-.353-.849-.714-.734-.977-.747-.253-.013-.541-.015-.83-.015s-.758.11-1.153.541c-.395.432-1.51 1.478-1.51 3.606 0 2.129 1.548 4.183 1.761 4.47 1.168 1.562 2.502 2.871 4.103 3.562.953.41 1.696.656 2.274.839.957.304 1.83.261 2.518.158.767-.115 2.355-.962 2.686-1.892.33-.93.33-1.727.23-1.892-.099-.165-.395-.256-.91-.512z"/>
        </svg>
      </a>
    );
  }

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleWhatsAppRedirect}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg transition duration-150 cursor-pointer shadow-sm ${className}`}
    >
      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-11.75c-.124-.207-.464-.329-.977-.585s1.424-.754 1.89-1.011c.469-.172.812-.258 1.153.259.34.515 1.318 1.664 1.614 2 .297.334-.593.376 1.107.12a14.502 14.502 0 0 0 4.089-2.528c1.093-.974 1.83-2.178 2.045-2.548.215-.371.023-.57.192-.784-.193-.19-.464-.537-.696-.807-.23-.27-.307-.456-.461-.759-.153-.304-.077-.571-.038-.827.115-.257-.977-2.355-1.339-3.227-.353-.849-.714-.734-.977-.747-.253-.013-.541-.015-.83-.015s-.758.11-1.153.541c-.395.432-1.51 1.478-1.51 3.606 0 2.129 1.548 4.183 1.761 4.47 1.168 1.562 2.502 2.871 4.103 3.562.953.41 1.696.656 2.274.839.957.304 1.83.261 2.518.158.767-.115 2.355-.962 2.686-1.892.33-.93.33-1.727.23-1.892-.099-.165-.395-.256-.91-.512z"/>
      </svg>
      <span>{label || 'WhatsApp'}</span>
    </a>
  );
}
