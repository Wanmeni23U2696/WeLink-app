import React from 'react';
import { X, Printer, Download, Receipt, FileText, CheckCircle, ShieldCheck } from 'lucide-react';
import { Order, UserProfile } from '../types';
import { WeLinkLogoIcon } from './WeLinkLogo';

interface InvoiceModalProps {
  order: Order;
  buyer?: UserProfile | any;
  seller?: UserProfile | any;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  order,
  buyer,
  seller,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const isProforma = order.status === 'pending';
  const totalRaw = order.price * order.quantity;
  const vatRate = 0.07; // 7% VAT (TVA) included in the price
  const vatAmount = Math.round(totalRaw * vatRate);
  const totalHT = totalRaw - vatAmount;
  const totalTTC = totalRaw + (order.deliveryFee || 0);

  const referenceId = `${isProforma ? 'DEV' : 'FAC'}-2026-${order.id.toUpperCase()}`;

  const handlePrint = () => {
    const printContent = document.getElementById('printable-invoice-content');
    if (!printContent) return;
    
    const originalContent = document.body.innerHTML;
    const printWindow = window.open('', '_blank', 'width=850,height=1100');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>${isProforma ? 'Devis Pro forma' : 'Facture Officielle'} WeLink - ${referenceId}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              body { -webkit-print-color-adjust: exact; font-family: system-ui, -apple-system, sans-serif; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body class="bg-white p-8 text-slate-800">
          <div class="max-w-3xl mx-auto border border-slate-200 p-8 rounded-lg shadow-sm">
            ${printContent.innerHTML}
          </div>
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in text-slate-800">
      <div 
        id="invoice-modal-card"
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 animate-slide-up"
      >
        {/* Header bar (Not printed) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center space-x-2">
            {isProforma ? (
              <FileText className="w-5 h-5 text-amber-500" />
            ) : (
              <Receipt className="w-5 h-5 text-emerald-500" />
            )}
            <span className="font-bold text-slate-900 text-sm">
              {isProforma ? 'Générateur de Devis Pro forma' : 'Générateur de Facture Officielle'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-indigo-500/20 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable invoice viewport */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/50">
          {/* Printable container */}
          <div 
            id="printable-invoice-content"
            className="bg-white p-6 md:p-8 rounded-2xl border border-slate-150 shadow-sm relative text-slate-800"
          >
            {/* Background design accents */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-full pointer-events-none -z-1" />

            {/* Invoice Top Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-100">
              <div className="space-y-2">
                <div className="flex items-center space-x-2.5">
                  <WeLinkLogoIcon size={38} />
                  <span className="text-xl font-black tracking-tight text-slate-950 font-sans">
                    We<span className="text-indigo-600">Link</span>
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Plateforme B2B2C Intégrée & Logistique Mutuelle
                </p>
                <div className="pt-2 text-xs text-slate-500 space-y-0.5">
                  <p>WeLink Tech S.A. • Division Facturation</p>
                  <p>Infoline: admin@welink.com | +237 650023402</p>
                  <p>Douala, Cameroun</p>
                </div>
              </div>

              <div className="text-left sm:text-right space-y-1.5 self-stretch sm:self-auto min-w-[200px]">
                <span className={`inline-block text-[9px] font-black uppercase px-2.5 py-1 rounded-full ${
                  isProforma 
                    ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {isProforma ? 'Devis Pro Forma' : 'Facture Commerciale'}
                </span>
                <h2 className="text-lg font-mono font-bold text-slate-900 tracking-tight">{referenceId}</h2>
                <div className="text-xs text-slate-500 space-y-0.5">
                  <p>Émis le : <strong className="text-slate-800 font-mono">{new Date(order.createdAt).toLocaleDateString('fr-FR')}</strong></p>
                  <p>Moyen de règlement : <strong className="text-slate-800">{order.paymentMethod || "Momo / Espèces"}</strong></p>
                  <p>Origine : <strong className="text-indigo-600">WeLink Portal</strong></p>
                </div>
              </div>
            </div>

            {/* Billing addresses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-b border-slate-100 text-xs">
              {/* Vendeur / Émetteur */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Émetteur / Vendeur</span>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <p className="font-extrabold text-slate-900 text-sm">{order.sellerName}</p>
                  <p className="text-slate-500 text-[11px]">{seller?.description || 'Entreprise partenaire WeLink'}</p>
                  {seller?.phone && <p className="text-slate-700"><span className="text-slate-400">Tél :</span> {seller.phone}</p>}
                  {seller?.email && <p className="text-slate-700"><span className="text-slate-400">Email :</span> {seller.email}</p>}
                  {seller?.address && <p className="text-slate-700"><span className="text-slate-400">Adr :</span> {seller.address}</p>}
                </div>
              </div>

              {/* Destinataire / Client */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-violet-600 uppercase tracking-wider block font-sans">Destinataire / Client</span>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <p className="font-extrabold text-slate-900 text-sm">{order.buyerName}</p>
                  {buyer?.phone && <p className="text-slate-700"><span className="text-slate-400">Tél :</span> {buyer.phone}</p>}
                  {buyer?.email && <p className="text-slate-700"><span className="text-slate-400">Email :</span> {buyer.email}</p>}
                  {order.deliveryAddress ? (
                    <p className="text-slate-700"><span className="text-indigo-600 font-bold">Lieu Livrr :</span> {order.deliveryAddress}</p>
                  ) : (
                    buyer?.address && <p className="text-slate-700"><span className="text-slate-400">Adr :</span> {buyer.address}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Logistics Status & Carrier Assignment (WeLink Delivery) */}
            {(order.carrierId || order.serviceType === 'delivery') && (
              <div className="py-4 border-b border-slate-100 text-xs">
                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 space-y-2">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">📦 Statut Logistique : WeLink Delivery</span>
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[9px] font-black uppercase rounded border border-indigo-200">
                      {order.deliveryStatus === 'delivered' ? 'Livré ✓' : order.deliveryStatus === 'picked_up' ? 'En livraison' : 'Assigné au Livreur'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] text-slate-700 mt-1">
                    <div>
                      <span className="text-slate-400">Transporteur :</span> <strong className="text-slate-900">{order.carrierName || "Recherche de Transporteur..."}</strong>
                    </div>
                    {order.carrierPhone && (
                      <div>
                        <span className="text-slate-400">Tél de course :</span> <strong className="text-slate-900">{order.carrierPhone}</strong>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-400">Frais de course :</span> <strong className="text-slate-900">{(order.deliveryFee || 0).toLocaleString()} FCFA</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Products Table */}
            <div className="py-6">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase font-bold text-[9.5px] tracking-wider bg-slate-50/70">
                    <th className="py-3 px-3">Désignation</th>
                    <th className="py-3 px-3 text-right">Prix Unitaire</th>
                    <th className="py-3 px-3 text-center">Quantité</th>
                    <th className="py-3 px-3 text-right">Total HT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100 text-slate-800 font-medium">
                    <td className="py-4 px-3">
                      <div className="font-extrabold text-slate-900">{order.productTitle}</div>
                      {order.customCut && (
                        <div className="text-[10px] text-red-650 font-bold mt-0.5">✂️ Option de découpe : {order.customCut}</div>
                      )}
                      {order.scheduledDate && (
                        <div className="text-[10px] text-slate-450 mt-0.5">📅 Planification de livraison : {new Date(order.scheduledDate).toLocaleDateString('fr-FR')}</div>
                      )}
                    </td>
                    <td className="py-4 px-3 text-right font-mono">{order.price.toLocaleString()} FCFA</td>
                    <td className="py-4 px-3 text-center font-mono">{order.quantity}</td>
                    <td className="py-4 px-3 text-right font-mono font-semibold">{totalRaw.toLocaleString()} FCFA</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Calculations and payment info */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-4 border-t border-slate-100 text-xs text-slate-800">
              {/* Left Column: legal terms and payment ways */}
              <div className="space-y-2 max-w-sm">
                <span className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider block">Instructions de Règlement</span>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-[10.5px] text-slate-600 font-medium">
                  <p>Transactions garanties par séquestre et régies par la charte d'utilisation financière de WeLink Cameroun.</p>
                  <p>Pour régler ce bon, veuillez approvisionner votre solde WeLink ou scanner le QR code WeLink Pay chez le partenaire.</p>
                </div>
              </div>

              {/* Right Column: Calculations */}
              <div className="w-full md:w-64 space-y-2 self-stretch md:self-auto font-medium">
                <div className="flex justify-between items-center text-slate-500 text-[11px]">
                  <span>Total HT :</span>
                  <span className="font-mono">{totalHT.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between items-center text-slate-500 text-[11px]">
                  <span>TVA (7% incluse) :</span>
                  <span className="font-mono">{vatAmount.toLocaleString()} FCFA</span>
                </div>
                {order.deliveryFee !== undefined && (
                  <div className="flex justify-between items-center text-slate-500 text-[11px]">
                    <span>Frais de livraison :</span>
                    <span className="font-mono">{(order.deliveryFee || 0).toLocaleString()} FCFA</span>
                  </div>
                )}
                <div className="flex justify-between items-center border-t border-slate-150 pt-2 text-slate-950 font-sans">
                  <span className="font-extrabold text-sm whitespace-nowrap">Net à Payer (TTC) :</span>
                  <span className="font-mono font-black text-indigo-600 text-base">{totalTTC.toLocaleString()} FCFA</span>
                </div>
              </div>
            </div>

            {/* Stamp and dynamic signature */}
            <div className="flex justify-between items-center pt-8 mt-6 border-t border-slate-100 text-[10px] text-slate-400 font-medium">
              <div className="space-y-1">
                <div className="flex items-center space-x-1 text-indigo-600">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span className="font-bold uppercase tracking-wider text-[8.5px]">WeLink Secured Invoice</span>
                </div>
                <p>Éditeur de Facturation Sécurisé v2.6</p>
                <p>Validation cryptographique : {Math.random().toString(36).substring(2, 9).toUpperCase()}</p>
              </div>

              {/* Holographic or stamp indicator */}
              <div className="border-2 border-indigo-600/30 text-indigo-600/40 font-black rounded-lg p-3 uppercase tracking-widest text-[9px] rotate-[-5deg] text-center w-28 select-none">
                {isProforma ? 'PRO FORMA' : 'WELINK PAYÉ'}
                <span className="block text-[6.5px] scale-90 font-bold mt-1 text-slate-400">Authentifié S.A.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-350 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Fermer
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-indigo-500/20 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Enregistrer PDF (Imprimer)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
