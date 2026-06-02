import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

const QRScanner = ({ onScanSuccess, actionText = "Đang quét mã QR..." }) => {
  const qrCodeRef = useRef(null);
  const [error, setError] = useState(null);
  const scanSuccessRef = useRef(onScanSuccess);

  // Keep ref up to date
  useEffect(() => {
    scanSuccessRef.current = onScanSuccess;
  }, [onScanSuccess]);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("qr-reader");
    qrCodeRef.current = html5QrCode;

    const config = { 
      fps: 15, 
      aspectRatio: 1.0,
      formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ]
    };

    const scanningLock = { locked: false, lastText: '' };

    // Auto-start camera
    const startScanner = async () => {
       try {
          await html5QrCode.start(
            { facingMode: "user" },
            config,
            async (decodedText) => {
              if (scanningLock.locked && scanningLock.lastText === decodedText) return;
              
              scanningLock.locked = true; 
              scanningLock.lastText = decodedText;
              
              // Unlock after 3 seconds of cooldown
              setTimeout(() => {
                scanningLock.locked = false;
                scanningLock.lastText = '';
              }, 3000);
              
              // Inform parent via ref
              if (scanSuccessRef.current) {
                scanSuccessRef.current(decodedText);
              }
            },
            () => {}
          );
       } catch (err) {
          console.warn("User facing camera failed, trying fallback to any available camera...", err);
          try {
             const devices = await Html5Qrcode.getCameras();
             if (devices && devices.length > 0) {
                await html5QrCode.start(
                  devices[0].id,
                  config,
                  async (decodedText) => {
                    if (scanningLock.locked && scanningLock.lastText === decodedText) return;
                    
                    scanningLock.locked = true; 
                    scanningLock.lastText = decodedText;
                    
                    setTimeout(() => {
                      scanningLock.locked = false;
                      scanningLock.lastText = '';
                    }, 3000);
                    
                    if (scanSuccessRef.current) {
                      scanSuccessRef.current(decodedText);
                    }
                  },
                  () => {}
                );
             } else {
                throw new Error("No camera devices found");
             }
          } catch (fallbackErr) {
             console.error("Camera fallback start error:", fallbackErr);
             setError("Không thể truy cập Camera. Vui lòng kiểm tra quyền thiết bị.");
          }
       }
    };

    startScanner();

    return () => {
      const stopScanner = async () => {
         if (html5QrCode.isScanning) {
            try {
               await html5QrCode.stop();
               html5QrCode.clear();
            } catch (err) {
               console.log("Cleanup stop error (safe to ignore)", err);
            }
         }
      };
      stopScanner();
    };
  }, []);

  return (
    <div className="w-[400px] mx-auto overflow-hidden">
      <div className="relative">
        <div id="qr-reader" className="w-[400px] h-[400px] bg-[#030712] rounded-2xl overflow-hidden border-2 border-cyan-500/30 shadow-2xl"></div>
        
        {/* Overlay Decoration */}
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
            {/* Corners */}
            <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-white"></div>
            <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-white"></div>
            <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-white"></div>
            <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-white"></div>
            
            {/* Scanning Line */}
            <div className="w-64 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_15px_rgba(99,102,241,0.8)] animate-scan-line"></div>
        </div>
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/50 text-red-500 text-sm rounded-2xl text-center">
          {error}
        </div>
      )}
      
      <p className="mt-4 text-slate-400 text-center font-medium animate-pulse">{actionText}</p>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan-line {
          0% { transform: translateY(-100px); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(100px); opacity: 0; }
        }
        .animate-scan-line {
          animation: scan-line 3s linear infinite;
        }
        #qr-reader video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
        }
      ` }} />
    </div>
  );
};

export default QRScanner;
