import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeviceStore } from '../store/deviceStore';
import { useLanguageStore } from '../store/languageStore';
import { Laptop, Smartphone, MonitorSmartphone, Camera, RotateCcw, CheckCircle, ShieldAlert, AlertTriangle, ChevronRight, Info } from 'lucide-react';

const RegisterDevicePage = () => {
    const { t } = useLanguageStore();
    const { createDevice, isLoading } = useDeviceStore();
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        device_type: 'Laptop',
        brand: '',
        model_name: '',
        serial_number: '',
        mac_address: '',
        description: '',
    });
    const [committed, setCommitted] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    // Camera State
    const [stream, setStream] = useState(null);
    const [photo, setPhoto] = useState(null);
    const [cameraActive, setCameraActive] = useState(false);
    
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const startCamera = async () => {
        setCameraActive(true);
        setError('');
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment', width: 640, height: 480 } 
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Camera access denied", err);
            setError("Optical sensor access denied. Verify system permissions.");
            setCameraActive(false);
        }
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setPhoto(dataUrl);
        stopCamera();
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        setStream(null);
        setCameraActive(false);
    };

    const retakePhoto = () => {
        setPhoto(null);
        startCamera();
    };

    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!committed) return;
        if (!photo) {
            setError('Physical asset verification (photo) is mandatory for registration.');
            return;
        }
        setError('');
        
        try {
            await createDevice({
                ...formData,
                image_url: photo 
            });
            setSuccess(true);
            setTimeout(() => {
                navigate('/devices');
            }, 2500);
        } catch (err) {
            setError(err.response?.data?.message || 'Provisioning failed. Contact system administrator.');
        }
    };

    return (
        <div className="min-h-screen bg-canvas text-ink font-sans p-xl">
            {/* Header Section */}
            <div className="mb-xxl">
            <h1 className="text-display-md tracking-tight mb-xs">{t('devices.asset_enrollment')}</h1>
            <p className="text-body-md text-charcoal">{t('devices.declare_assets_desc')}</p>
            </div>

            {success ? (
                <div className="max-w-2xl mx-auto bg-paper border border-fog p-xxl rounded-xl shadow-floating text-center animate-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-xl border border-green-100 shadow-sm">
                        <CheckCircle size={40} className="animate-bounce" />
                    </div>
                    <h2 className="text-display-xs text-ink mb-md">{t('devices.enrollment_confirmed')}</h2>
                    <p className="text-body-md text-charcoal mb-xl">{t('devices.asset_provisioned_desc')}</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-xl">
                    {/* Visual Evidence Section */}
                    <div className="lg:col-span-1 space-y-xl">
                        <div className="bg-paper border border-fog p-md rounded-xl shadow-soft-lift flex flex-col items-center">
                            <div className="w-full aspect-[4/3] bg-cloud border border-fog rounded-md overflow-hidden relative shadow-sm group">
                                {photo ? (
                                    <img src={photo} alt="Captured asset" className="w-full h-full object-cover animate-in fade-in" />
                                ) : cameraActive ? (
                                    <video ref={(el) => {
                                        videoRef.current = el;
                                        if (el && stream && el.srcObject !== stream) {
                                            el.srcObject = stream;
                                        }
                                    }} autoPlay playsInline className="w-full h-full object-cover" />
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-charcoal opacity-40">
                                        <Camera size={48} className="mb-md" />
                                        <p className="text-caption-bold uppercase tracking-widest text-center px-xl">{t('devices.optical_sensor_standby')}</p>
                                    </div>
                                )}
                                <canvas ref={canvasRef} className="hidden" />
                            </div>

                            {error && (
                                <div className="mt-md p-sm bg-red-50 border border-red-100 rounded text-red-600 text-caption-bold flex items-center gap-xs">
                                    <ShieldAlert size={14} /> {error}
                                </div>
                            )}

                            <div className="mt-xl w-full flex flex-col gap-2">
                                {photo ? (
                                    <button
                                        type="button"
                                        onClick={retakePhoto}
                                        className="w-full flex items-center justify-center gap-xs px-md py-sm bg-cloud text-ink font-bold rounded-md border border-fog hover:bg-fog transition-all text-caption-bold"
                                    >
                                        <RotateCcw size={16} /> {t('devices.recalibrate_optic')}
                                    </button>
                                ) : cameraActive ? (
                                    <button
                                        type="button"
                                        onClick={capturePhoto}
                                        className="w-full flex items-center justify-center gap-xs px-md py-sm bg-primary text-on-ink font-bold rounded-md shadow-soft-lift hover:bg-primary-deep transition-all text-caption-bold animate-pulse"
                                    >
                                        <Camera size={16} /> {t('devices.capture_photo')}
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={startCamera}
                                        className="w-full flex items-center justify-center gap-xs px-md py-sm bg-ink text-on-ink font-bold rounded-md border border-charcoal hover:bg-charcoal transition-all text-caption-bold"
                                    >
                                        <Camera size={16} /> {t('devices.activate_sensor')}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Provisioning Sequence */}
                        <div className="bg-paper border border-fog p-xl rounded-xl shadow-soft-lift">
                            <h3 className="text-body-emphasis text-ink mb-xl uppercase tracking-widest flex items-center gap-xs">
                                <Info size={16} className="text-primary" /> {t('devices.enrollment_sequence')}
                            </h3>
                            <div className="space-y-xl">
                                {[
                                    { step: 1, title: t('devices.identity_documentation'), desc: t('devices.identity_documentation_desc'), active: true },
                                    { step: 2, title: t('devices.heuristic_validation'), desc: t('devices.heuristic_validation_desc'), active: false },
                                    { step: 3, title: t('devices.token_initialization'), desc: t('devices.token_initialization_desc'), active: false }
                                ].map((s) => (
                                    <div key={s.step} className="flex gap-md relative">
                                        {s.step !== 3 && <div className="absolute left-3 top-8 w-px h-10 bg-fog"></div>}
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border shrink-0 ${
                                            s.active ? 'bg-primary text-on-ink border-primary' : 'bg-cloud text-graphite border-fog'
                                        }`}>{s.step}</div>
                                        <div>
                                            <p className={`text-caption-bold ${s.active ? 'text-ink' : 'text-graphite'}`}>{s.title}</p>
                                            <p className="text-[11px] text-charcoal mt-xxs">{s.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Specifications Section */}
                    <div className="lg:col-span-2 bg-paper p-xl rounded-xl shadow-floating border border-fog flex flex-col justify-between">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
                            <div className="space-y-xs">
                                <label className="text-caption-bold uppercase text-ink flex items-center gap-xs">{t('devices.classification')} <span className="text-primary">*</span></label>
                                <select
                                    name="device_type"
                                    value={formData.device_type}
                                    onChange={handleInputChange}
                                    className="w-full px-md py-sm bg-cloud border border-fog rounded-md focus:border-primary outline-none transition text-ink font-bold appearance-none cursor-pointer"
                                >
                                    <option value="Laptop">{t('devices.mobile_workstation')}</option>
                                    <option value="Phone">{t('devices.telecommunications')}</option>
                                    <option value="Tablet">{t('devices.slate_computer')}</option>
                                    <option value="Desktop">{t('devices.static_terminal')}</option>
                                    <option value="Other">{t('devices.custom_hardware')}</option>
                                </select>
                            </div>

                            <div className="space-y-xs">
                                <label className="text-caption-bold uppercase text-ink">{t('devices.manufacturer')} <span className="text-primary">*</span></label>
                                <input
                                    type="text" name="brand" value={formData.brand} onChange={handleInputChange}
                                    placeholder="e.g., Dell, Lenovo, Apple" required
                                    className="w-full px-md py-sm bg-cloud border border-fog rounded-md focus:border-primary outline-none transition text-ink font-bold"
                                />
                            </div>

                            <div className="md:col-span-2 space-y-xs">
                                <label className="text-caption-bold uppercase text-ink">{t('devices.model_name')} <span className="text-primary">*</span></label>
                                <input
                                    type="text" name="model_name" value={formData.model_name} onChange={handleInputChange}
                                    placeholder="e.g., Latitude 7440 / ThinkPad X1" required
                                    className="w-full px-md py-sm bg-cloud border border-fog rounded-md focus:border-primary outline-none transition text-ink font-bold"
                                />
                            </div>

                            <div className="space-y-xs">
                                <label className="text-caption-bold uppercase text-ink">{t('devices.serial_number')} <span className="text-primary">*</span></label>
                                <input
                                    type="text" name="serial_number" value={formData.serial_number} onChange={handleInputChange}
                                    placeholder="Located on asset chassis" required
                                    className="w-full px-md py-sm bg-cloud border border-fog rounded-md focus:border-primary outline-none font-mono text-ink font-bold uppercase"
                                />
                            </div>

                            <div className="space-y-xs">
                                <label className="text-caption-bold uppercase text-ink">{t('devices.mac_address')} ({t('common.optional')})</label>
                                <input
                                    type="text" name="mac_address" value={formData.mac_address} onChange={handleInputChange}
                                    placeholder="00:00:00:00:00:00"
                                    className="w-full px-md py-sm bg-cloud border border-fog rounded-md focus:border-primary outline-none font-mono text-ink font-bold uppercase"
                                />
                            </div>

                            <div className="md:col-span-2 space-y-xs">
                                <label className="text-caption-bold uppercase text-ink">{t('devices.notes')}</label>
                                <textarea
                                    name="description" value={formData.description} onChange={handleInputChange}
                                    placeholder="Physical identification markers, modifications, etc."
                                    rows="2"
                                    className="w-full px-md py-sm bg-cloud border border-fog rounded-md focus:border-primary outline-none resize-none text-ink font-bold"
                                ></textarea>
                            </div>
                            
                            <div className="md:col-span-2 p-xl bg-primary/5 rounded-md border border-primary/10 flex gap-md">
                                <input
                                    type="checkbox" id="commitment" checked={committed}
                                    onChange={(e) => setCommitted(e.target.checked)}
                                    className="mt-xs w-5 h-5 accent-primary cursor-pointer shrink-0"
                                    required
                                />
                                <label htmlFor="commitment" className="text-caption-md text-charcoal leading-relaxed cursor-pointer select-none">
                                    <span className="text-ink font-bold block mb-xxs flex items-center gap-xs"><AlertTriangle size={14} className="text-primary" /> {t('devices.commitment')}</span> 
                                    {t('devices.commitment_text')}
                                </label>
                            </div>
                        </div>

                        <div className="mt-xxl flex justify-end gap-md">
                            <button
                                type="button" onClick={() => navigate('/devices')}
                                className="px-xl py-sm font-bold text-caption-bold text-charcoal hover:bg-cloud rounded-md transition"
                            >
                                {t('devices.abandon_enrollment')}
                            </button>
                            <button
                                type="submit" disabled={isLoading || !committed}
                                className="bg-primary hover:bg-primary-deep text-on-ink px-xxl py-sm rounded-md font-bold transition shadow-soft-lift disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-xs"
                            >
                                {isLoading ? (
                                    <><div className="animate-spin w-4 h-4 border-2 border-on-ink/30 border-t-on-ink rounded-full"></div> {t('synchronizing')}</>
                                ) : (
                                    <>{t('devices.commit_provisioning')} <ChevronRight size={16} /></>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            )}
        </div>
    );
};

export default RegisterDevicePage;
