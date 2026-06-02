import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';

const CameraCapture = ({ onCapture, autoCapture = false }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);

  const startCamera = useCallback(async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 500 }
        }
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
    } catch (err) {
      console.error("Camera error:", err);
      setError("Không thể truy cập Camera. Vui lòng cấp quyền.");
    }
  }, [stream]);

  useEffect(() => {
    startCamera();
  }, []);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      // Scale down image to avoid database bloating while preserving enough detail for face recognition/audit
      const targetWidth = 320;
      const targetHeight = 240;
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      
      context.drawImage(video, 0, 0, targetWidth, targetHeight);

      const imageData = canvas.toDataURL('image/jpeg', 0.6); // Quality 0.6 is extremely lightweight yet very clear for face audits!
      setCapturedImage(imageData);
      onCapture(imageData);
    }
  };

  const retake = () => {
    setCapturedImage(null);
    onCapture(null);
  };

  return (
    <div className="w-full max-w-[400px] mx-auto bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-700 relative group">
      {!capturedImage ? (
        <div className="relative w-full aspect-square bg-black flex items-center justify-center">
          {error ? (
            <div className="text-center p-6 space-y-4">
              <p className="text-rose-400 font-bold mb-2">{error}</p>
              <button
                type="button"
                onClick={startCamera}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-2xl text-white text-xs font-bold transition mx-auto block"
              >
                Thử lại
              </button>
            </div>
          ) : (
            <>
              <video
                ref={(el) => {
                  videoRef.current = el;
                  if (el && stream && el.srcObject !== stream) {
                    el.srcObject = stream;
                  }
                }}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
                style={{ transform: 'scaleX(-1)' }} // Mirror view for user
              />
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-48 h-64 border-2 border-white/30 rounded-2xl border-dashed"></div>
              </div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
                <button
                  onClick={capturePhoto}
                  className="w-16 h-16 bg-white hover:bg-blue-50 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 border-4 border-blue-500/30"
                >
                  <Camera size={28} className="text-blue-600" />
                </button>
              </div>
              <div className="absolute top-4 left-4">
                <span className="bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-2xl flex items-center">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse mr-1"></span> LIVE
                </span>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="relative w-full aspect-square bg-black">
          <img
            src={capturedImage}
            alt="Captured"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
            <div className="bg-emerald-500 text-white p-3 rounded-full animate-in zoom-in duration-300">
              <ShieldCheck size={48} />
            </div>
          </div>
          <div className="absolute bottom-4 right-4 flex gap-2">
            <button
              onClick={retake}
              className="px-4 py-2 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white rounded-2xl text-xs font-bold transition flex items-center"
            >
              <RefreshCw size={14} className="mr-2" /> Chụp lại
            </button>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
      <div className="p-3 bg-slate-800 border-t border-slate-700 flex items-center justify-center">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center">
          <ShieldCheck size={12} className="mr-1 text-blue-500" /> Identity Verification Active
        </p>
      </div>
    </div>
  );
};

export default CameraCapture;
