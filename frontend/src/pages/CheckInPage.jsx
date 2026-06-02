import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeviceStore } from '../store/deviceStore';
import { useAuthStore } from '../store/authStore';
import { accessService } from '../services/accessService';
import Alert from '../components/Alert';
import QRScanner from '../components/QRScanner';
import CameraCapture from '../components/CameraCapture';
import { User, ShieldCheck, LogOut, ArrowRight, Laptop, Smartphone, AlertTriangle, MonitorSmartphone, QrCode, ScanFace, Camera, Trash2, Plus, X, Zap, Shield, Globe, CheckCircle, ChevronRight, HardDrive } from 'lucide-react';

import { useLanguageStore } from '../store/languageStore';
import LanguageSwitcher from '../components/LanguageSwitcher';

export const CheckInPage = () => {
  const { t } = useLanguageStore();
  const { approvedDevices, fetchApprovedDevices, addApprovedDevice, isLoading: loadingDevices } = useDeviceStore();
  const { user, logout, qrLogin, socket, connectSocket } = useAuthStore();
  const navigate = useNavigate();

  const [selectedDevices, setSelectedDevices] = useState([]);
  const [verifiedDevices, setVerifiedDevices] = useState([]);
  const [checkedIn, setCheckedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [showScanner, setShowScanner] = useState(true);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [fallbackId, setFallbackId] = useState('');
  const [entryPhoto, setEntryPhoto] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [agreedToPledge, setAgreedToPledge] = useState(false);
  const [showQuickReg, setShowQuickReg] = useState(false);
  const [quickRegData, setQuickRegData] = useState({
    device_type: 'Laptop',
    brand: '',
    model_name: '',
    serial_number: '',
    mac_address: '',
    description: '',
  });
  const [quickRegPhoto, setQuickRegPhoto] = useState(null);
  const [quickRegStatus, setQuickRegStatus] = useState('idle');
  const [showForgottenSessionModal, setShowForgottenSessionModal] = useState(false);
  const [forgottenSessionMessage, setForgottenSessionMessage] = useState('');

  const quickRegDataRef = useRef(quickRegData);
  useEffect(() => {
    quickRegDataRef.current = quickRegData;
  }, [quickRegData]);

  useEffect(() => {
    connectSocket();
    if (socket) {
      socket.on('quick_register_confirm_update', (payload) => {
        if (payload.serial_number === quickRegDataRef.current.serial_number) {
          setQuickRegStatus('approved');
          if (payload.device && payload.device.device_id) {
            addApprovedDevice(payload.device);
            setSelectedDevices(prev => [...prev, payload.device.device_id]);
            setVerifiedDevices(prev => [...prev, payload.device.device_id]);
          }
          setShowQuickReg(false);
          setMessage('Device registered successfully! It has been added to your session.');
          setMessageType('success');
        }
      });
      socket.on('quick_register_reject_update', (payload) => {
        if (payload.serial_number === quickRegDataRef.current.serial_number) {
          setQuickRegStatus('rejected');
          let baseMsg = t('kiosk.registration_declined');
          if (baseMsg.endsWith('.')) {
            baseMsg = baseMsg.slice(0, -1);
          }
          const reasonText = payload.reason ? `: ${payload.reason}` : '';
          setMessage(`${baseMsg}${reasonText}`);
          setMessageType('error');
        }
      });
    }
    if (user && user.role === 'engineer') {
      fetchApprovedDevices();
      checkCurrentStatus();
    }
    return () => {
      if (socket) {
        socket.off('quick_register_confirm_update');
        socket.off('quick_register_reject_update');
      }
    };
  }, [user, fetchApprovedDevices, connectSocket]);

  const broadcastKioskScan = (data) => {
    socket?.emit('kiosk_scan', data);
  };

  const handleQuickRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!quickRegPhoto) {
      setMessage(t('profile.invalid_image'));
      setMessageType('error');
      return;
    }
    setQuickRegStatus('pending');
    setMessage(t('kiosk.sending_security_request'));
    setMessageType('info');
    socket?.emit('quick_register_request', {
      user_id: user?.id,
      full_name: user?.full_name,
      ...quickRegData,
      image_url: quickRegPhoto
    });
  };

  const checkCurrentStatus = async () => {
    try {
      const response = await accessService.getCurrentStatus();
      const status = response.status;
      if (status === 'checked_in') {
        setCheckedIn(true);
      } else if (status === 'overdue_session') {
        setCheckedIn(false);
        setForgottenSessionMessage(response.message);
        setShowForgottenSessionModal(true);
      }
    } catch (err) {
      console.error('Failed to check status:', err);
    }
  };

  const handleDeviceQRSuccess = async (decodedText) => {
    try {
      const data = JSON.parse(decodedText);
      if (data && data.deviceId) {
        const scannedId = String(data.deviceId);
        const matchedDevice = approvedDevices.find(d => String(d.device_id) === scannedId);
        if (matchedDevice) {
          setSelectedDevices((prev) => !prev.includes(matchedDevice.device_id) ? [...prev, matchedDevice.device_id] : prev);
          setVerifiedDevices((prev) => {
            if (!prev.includes(matchedDevice.device_id)) {
              setMessage(`Verified: ${matchedDevice.brand} ${matchedDevice.model_name}`);
              setMessageType('success');
              broadcastKioskScan({
                user: user?.full_name || 'Unknown',
                avatar_url: user?.avatar_url,
                device: `${matchedDevice.brand} ${matchedDevice.model_name}`,
                image_url: matchedDevice.image_url,
                status: 'valid'
              });
              return [...prev, matchedDevice.device_id];
            } else {
              setMessage(t('kiosk.device_already_verified'));
              setMessageType('info');
              return prev;
            }
          });
        } else {
          setMessage(t('kiosk.device_not_registered'));
          setMessageType('error');
          broadcastKioskScan({
            user: user?.full_name || 'Unknown',
            avatar_url: user?.avatar_url,
            device: t('kiosk.unauthorized_device_warning') || 'WARNING: UNAUTHORIZED DEVICE',
            status: 'mismatch'
          });
        }
      }
    } catch (e) {
      setMessage(t('kiosk.invalid_qr'));
      setMessageType('error');
    }
  };

  const handleEndSession = () => {
    logout();
    setAgreedToPledge(false);
    setSelectedDevices([]);
    setVerifiedDevices([]);
    setCheckedIn(false);
    setMessage('');
    setEntryPhoto(null);
  };

  const handleCheckIn = async (forceCloseOld = false) => {
    if (!agreedToPledge || !entryPhoto) return;
    setLoading(true);
    try {
      await accessService.checkIn(selectedDevices, entryPhoto, forceCloseOld === true);
      setShowForgottenSessionModal(false);
      setActionSuccess('checkin');
      setCheckedIn(true);
      setSelectedDevices([]);
      setVerifiedDevices([]);
      setTimeout(() => {
        setActionSuccess(null);
        handleEndSession();
      }, 15000);
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.requires_force_close) {
        setForgottenSessionMessage(err.response.data.message);
        setShowForgottenSessionModal(true);
      } else {
        setMessage(err.response?.data?.message || 'Check-in failed.');
        setMessageType('error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      await accessService.checkOut(entryPhoto);
      setActionSuccess('checkout');
      setCheckedIn(false);
      setTimeout(() => {
        setActionSuccess(null);
        handleEndSession();
      }, 15000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Check-out failed.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeQRSuccess = async (decodedText) => {
    setLoading(true);
    setMessage('');
    try {
      await qrLogin(decodedText);
    } catch (err) {
      setMessage(t('kiosk.invalid_badge'));
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleManualLogin = async (e) => {
    e.preventDefault();
    if (!fallbackId.trim()) return;
    setLoading(true);
    try {
      const mockQrData = JSON.stringify({ userId: null, username: fallbackId });
      await qrLogin(mockQrData);
    } catch (err) {
      setMessage('Invalid credentials.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  // --- IDLE SCREEN (HCL-ANZ KIOSK STYLE) ---
  if (!user || user.role !== 'engineer') {
    return (
      <div className="min-h-screen bg-canvas text-ink flex flex-col items-center justify-center p-md font-sans relative overflow-hidden">
        {/* Signature Multi-tonal Chevrons */}
        <div className="absolute top-0 right-0 w-1/2 h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] right-[-5%] w-[80%] h-[120%] bg-primary/5 transform -skew-x-[25deg]"></div>
          <div className="absolute top-[20%] right-[15%] w-12 h-[60%] bg-secondary opacity-10 transform -skew-x-[25deg]"></div>
        </div>

        <div className="max-w-[800px] w-full bg-paper rounded-xl shadow-floating border border-fog p-xxl z-10 relative text-center">
          <div className="absolute top-6 right-6">
            <LanguageSwitcher />
          </div>
          <div className="mb-xl flex flex-col items-center">
            {/* <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-soft-lift mb-md">
              HCL
            </div> */}
            <h1 className="text-display-md tracking-tight mb-xs">{t('welcome')}</h1>
            <p className="text-body-md text-graphite uppercase tracking-[0.2em] font-medium">{t('facility_kiosk')}</p>
          </div>

          <div className="max-w-md mx-auto mb-xl">
            <div className="bg-cloud rounded-xl border border-fog p-md relative overflow-hidden shadow-inner">
              {fallbackMode ? (
                <form onSubmit={handleManualLogin} className="space-y-md animate-in fade-in duration-300">
                  <p className="text-caption-bold uppercase tracking-wider text-charcoal">{t('kiosk.manual_identification')}</p>
                  <input
                    type="text"
                    value={fallbackId}
                    onChange={(e) => setFallbackId(e.target.value)}
                    placeholder={t('kiosk.enterEmployeeId')}
                    className="w-full bg-paper border border-fog px-md py-sm rounded-md text-center text-xl font-medium outline-none focus:border-primary shadow-sm"
                    autoFocus
                  />
                  <div className="flex gap-sm">
                    <button type="submit" disabled={loading} className="flex-1 bg-primary text-on-ink py-sm rounded-md font-bold hover:bg-primary-deep transition shadow-soft-lift">
                      {loading ? t('kiosk.verifying') : t('kiosk.identify')}
                    </button>
                    <button type="button" onClick={() => setFallbackMode(false)} className="px-md py-sm bg-fog rounded-md font-bold text-graphite hover:bg-cloud transition">{t('cancel')}</button>
                  </div>
                </form>
              ) : (
                <div className="relative">
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-primary shadow-[0_0_10px_rgba(2,74,216,0.5)] animate-scan-line z-20"></div>
                  <div className="flex items-center justify-center bg-paper rounded-xl relative border border-fog p-6 shadow-sm overflow-hidden">
                    <QRScanner onScanSuccess={handleEmployeeQRSuccess} actionText={t('kiosk.badge_qr_position')} />
                    
                    {loading && (
                      <div className="absolute inset-0 bg-paper/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center space-y-md">
                        <div className="w-12 h-12 border-4 border-fog border-t-primary rounded-full animate-spin"></div>
                        <p className="text-caption-bold text-primary animate-pulse">{t('authenticating')}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-md">
            <h2 className="text-display-xs text-primary">{t('scan_id_badge')}</h2>
            <p className="text-body-md text-charcoal max-w-sm mx-auto">{t('corporate_account')}</p>
          </div>

          {!fallbackMode && (
            <button onClick={() => setFallbackMode(true)} className="mt-xl text-caption-bold text-graphite hover:text-primary underline uppercase tracking-widest transition-colors">
              {t('manual_id')}
            </button>
          )}

          <div className="mt-xxl pt-xl border-t border-fog flex justify-around">
            <div className="flex flex-col items-center space-y-xs">
              <ShieldCheck className="text-primary" size={24} />
              <span className="text-[10px] font-bold text-graphite uppercase tracking-wider">{t('kiosk.secure_access')}</span>
            </div>
            <div className="flex flex-col items-center space-y-xs">
              <ScanFace className="text-primary" size={24} />
              <span className="text-[10px] font-bold text-graphite uppercase tracking-wider">{t('kiosk.face_verify')}</span>
            </div>
            <div className="flex flex-col items-center space-y-xs">
              <HardDrive className="text-primary" size={24} />
              <span className="text-[10px] font-bold text-graphite uppercase tracking-wider">{t('kiosk.asset_track')}</span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-md text-caption-md text-graphite opacity-50">
          © 2026 HCL x ANZ Collaboration | R&D Division | Terminal Node-04
        </div>

        <style>{`
          @keyframes scan {
            0% { top: 0%; }
            100% { top: 100%; }
          }
          .animate-scan-line {
            animation: scan 3s infinite linear;
          }
        `}</style>
      </div>
    );
  }

  // --- ACTIVE FORM (ENGINEER LOGGED IN) ---
  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col font-sans">

      {/* Kiosk Header */}
      <header className="bg-ink text-on-ink px-xl py-md flex justify-between items-center shadow-floating z-20">
        <div className="flex items-center space-x-md">
          <div className="w-12 h-12 bg-paper rounded-full flex items-center justify-center shadow-soft-lift">
            <User size={32} className="text-primary" />
          </div>
          <div>
            <h1 className="text-display-xs font-medium text-white">{user?.full_name || 'Engineer'}</h1>
            <div className="flex items-center space-x-xs">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-caption-bold text-fog uppercase tracking-widest">{t('kiosk.active_session')}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <button onClick={handleEndSession} className="flex items-center space-x-xs bg-charcoal hover:bg-graphite px-md py-sm rounded-md transition-colors font-bold text-sm">
            <LogOut size={18} />
            <span>{t('kiosk.next_user')}</span>
          </button>
        </div>
      </header>

      {/* Content Canvas */}
      <main className="flex-1 p-xl max-w-[1440px] mx-auto w-full relative z-10">

        {message && (
          <div className="mb-xl animate-in fade-in slide-in-from-top-4">
            <Alert message={message} type={messageType} onClose={() => setMessage('')} />
          </div>
        )}

        {/* Success Overlay */}
        {actionSuccess && (
          <div className="fixed inset-0 z-50 bg-paper/95 backdrop-blur-md flex flex-col items-center justify-center text-center p-xxl animate-in zoom-in-95 duration-500">
            <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mb-xl relative">
              <div className="absolute inset-0 border-4 border-primary rounded-full animate-ping opacity-20"></div>
              <ShieldCheck size={64} className="text-primary" />
            </div>
            <h2 className="text-display-md mb-md text-ink uppercase tracking-tight">
              {actionSuccess === 'checkin' ? t('access_granted') : t('session_ended')}
            </h2>
            <p className="text-body-lg text-charcoal max-w-md">
              {actionSuccess === 'checkin'
                ? t('kiosk.access_granted_desc')
                : t('kiosk.checkout_desc')}
            </p>
            <div className="mt-xxl text-caption-bold text-graphite uppercase tracking-[0.2em] animate-pulse">
              {t('kiosk.returning_idle')}
            </div>
          </div>
        )}

        {!checkedIn ? (
          <>
            <div className="flex flex-col gap-xl max-w-4xl mx-auto w-full">
              {/* Step 1: Device Verification */}
              <div className="bg-paper rounded-xl shadow-floating border border-fog p-xl flex flex-col items-center">
                <div className="w-full flex justify-between items-center mb-xl">
                  <div className="flex items-center space-x-sm">
                    <div className="p-xs bg-primary/10 rounded-md text-primary">
                      <QrCode size={24} />
                    </div>
                    <h2 className="text-display-xs">1. {t('kiosk.asset_verification')}</h2>
                  </div>
                  <span className="bg-cloud border border-fog px-md py-xs rounded-full text-caption-bold text-primary">
                    {verifiedDevices.length} {t('kiosk.verified')}
                  </span>
                </div>

                <div className="w-full flex flex-col items-center space-y-xl">
                  <div className="w-full max-w-[450px] bg-cloud border border-fog p-md rounded-xl shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-primary opacity-50 animate-scan-line"></div>
                    <div className="w-[400px] h-[400px] mx-auto bg-paper rounded-md overflow-hidden border border-fog relative">
                      <QRScanner onScanSuccess={handleDeviceQRSuccess} actionText={t('kiosk.scan_device_tag')} />
                    </div>
                  </div>

                  <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-md">
                    {verifiedDevices.map(id => {
                      const device = approvedDevices.find(d => String(d.device_id) === String(id));
                      if (!device) return null;
                      return (
                        <div key={id} className="p-md bg-paper border border-primary rounded-md shadow-soft-lift flex items-center justify-between animate-in zoom-in duration-300">
                          <div className="flex items-center space-x-md">
                            <div className="p-sm bg-primary text-on-ink rounded-md">
                              {device.device_type === 'Laptop' ? <Laptop size={20} /> : <Smartphone size={20} />}
                            </div>
                            <div>
                              <p className="text-body-emphasis">{device.brand} {device.model_name}</p>
                              <p className="text-[10px] font-mono text-graphite">SN: {device.serial_number}</p>
                            </div>
                          </div>
                          <button onClick={() => {
                            setSelectedDevices(prev => prev.filter(v => v !== device.device_id));
                            setVerifiedDevices(prev => prev.filter(v => v !== device.device_id));
                          }} className="text-steel hover:text-red-500 transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      );
                    })}
                    <button onClick={() => {
                      setQuickRegStatus('idle');
                      setQuickRegPhoto(null);
                      setQuickRegData({ device_type: 'Laptop', brand: '', model_name: '', serial_number: '', mac_address: '', description: '' });
                      setShowQuickReg(true);
                    }} className="p-md border border-dashed border-fog rounded-md flex flex-col items-center justify-center space-y-xs hover:border-primary hover:bg-cloud transition-all group">
                      <Plus size={24} className="text-graphite group-hover:text-primary" />
                      <span className="text-caption-bold text-graphite group-hover:text-primary">{t('kiosk.quick_register_asset')}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: Face Verify & Actions */}
              <div className={`bg-paper rounded-xl shadow-floating border border-fog p-xl flex flex-col items-center transition-opacity duration-300 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="w-full flex items-center space-x-sm mb-xl">
                  <Camera size={24} className="text-primary" />
                  <h2 className="text-display-xs">2. {t('kiosk.identity')}</h2>
                </div>
                <div className="w-full flex flex-col items-center space-y-md">
                  <CameraCapture onCapture={(img) => setEntryPhoto(img)} />
                  <p className="text-caption-md text-charcoal text-center">{t('kiosk.identity_capture_desc')}</p>
                </div>
              </div>
            </div>

            {/* Full-width Bottom Section */}
            <div className="mt-xxl space-y-xl max-w-4xl mx-auto">
              {/* Security Pledge Card */}
              <div className="bg-paper rounded-xl shadow-floating border border-fog p-xl transition-opacity duration-300">
                <div className="flex items-center space-x-sm mb-md">
                  <ShieldCheck size={24} className="text-primary" />
                  <h2 className="text-display-xs">3. {t('kiosk.security_pledge')}</h2>
                </div>
                <label className="flex items-start space-x-md p-md bg-cloud rounded-md border border-fog cursor-pointer hover:bg-paper transition-colors">
                  <input
                    type="checkbox"
                    className="mt-xs w-5 h-5 rounded border-fog text-primary focus:ring-primary"
                    checked={agreedToPledge}
                    onChange={(e) => setAgreedToPledge(e.target.checked)}
                  />
                  <div className="text-body-md text-charcoal leading-relaxed">
                    {t('kiosk.pledge_text')}
                  </div>
                </label>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center max-w-2xl mx-auto space-y-xl mt-xl">
            <div className="text-center space-y-md">
              <h2 className="text-display-md text-primary">Bạn đã hoàn thành công việc và muốn check-out?</h2>
              <p className="text-body-md text-charcoal">Vui lòng chụp ảnh xác thực danh tính để hoàn tất quá trình ra khỏi phòng lab.</p>
            </div>
            <div className={`w-full bg-paper rounded-xl shadow-floating border border-fog p-xl flex flex-col items-center transition-opacity duration-300 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="w-full flex flex-col items-center space-y-md">
                <CameraCapture onCapture={(img) => setEntryPhoto(img)} />
              </div>
            </div>
          </div>
        )}

        <div className="mt-xxl space-y-xl max-w-4xl mx-auto">

          <div className="space-y-md">
            {!checkedIn ? (
              <button
                onClick={handleCheckIn}
                disabled={loading || !agreedToPledge || !entryPhoto}
                className={`w-full py-xl rounded-xl text-display-sm transition-all shadow-floating flex items-center justify-center space-x-md ${agreedToPledge && entryPhoto && !loading
                  ? 'bg-primary text-on-ink hover:bg-primary-deep'
                  : 'bg-fog text-graphite cursor-not-allowed'}`}
              >
                {loading ? t('common.loading') : (
                  <>
                    <span>{t('kiosk.confirm_check_in')}</span>
                    <ArrowRight size={32} />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleCheckOut}
                disabled={loading || !entryPhoto}
                className={`w-full py-xl rounded-xl text-display-sm transition-all shadow-floating flex items-center justify-center space-x-md ${entryPhoto && !loading
                  ? 'bg-ink text-on-ink hover:bg-charcoal'
                  : 'bg-fog text-graphite cursor-not-allowed'}`}
              >
                {loading ? t('common.loading') : (
                  <>
                    <LogOut size={32} />
                    <span>{t('kiosk.verify_check_out')}</span>
                  </>
                )}
              </button>
            )}

            <div className="flex items-center justify-center space-x-xs text-caption-md text-graphite py-md">
              <AlertTriangle size={18} />
              <span>{t('kiosk.bag_inspection_notice')}</span>
            </div>
          </div>
        </div>
      </main>

      {/* Quick Reg Modal */}
      {showQuickReg && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-md">
          <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={() => setShowQuickReg(false)}></div>
          <div className="bg-paper w-full max-w-2xl rounded-xl shadow-floating z-10 border border-fog overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="px-xl py-md border-b border-fog flex justify-between items-center bg-cloud">
              <div className="flex items-center space-x-sm text-primary">
                <Plus size={24} />
                <h3 className="text-display-xs text-ink">{t('kiosk.asset_registration')}</h3>
              </div>
              <button onClick={() => {
                setShowQuickReg(false);
                setQuickRegStatus('idle');
              }} className="text-steel hover:text-ink transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-xl overflow-y-auto max-h-[70vh]">
              {quickRegStatus === 'pending' ? (
                <div className="py-xxl text-center space-y-md">
                  <div className="w-16 h-16 border-4 border-fog border-t-primary rounded-full animate-spin mx-auto"></div>
                  <h4 className="text-display-xs">{t('kiosk.awaiting_approval')}</h4>
                  <p className="text-body-md text-charcoal">{t('kiosk.quick_reg_wait')}</p>

                  <button
                    onClick={() => {
                      setShowQuickReg(false);
                      setQuickRegStatus('idle');
                    }}
                    className="mt-xl px-xl py-sm bg-cloud border border-fog rounded-md text-caption-bold text-graphite hover:text-ink hover:bg-fog transition-all uppercase tracking-widest"
                  >
                    {t('cancel')}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleQuickRegisterSubmit} className="space-y-xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
                    <div className="space-y-xl">
                      <div className="space-y-xs">
                        <label className="text-caption-bold uppercase text-ink">{t('kiosk.asset_type')}</label>
                        <select
                          className="w-full bg-cloud border border-fog px-md py-sm rounded-md outline-none focus:border-primary transition-colors text-body-md"
                          value={quickRegData.device_type}
                          onChange={e => setQuickRegData({ ...quickRegData, device_type: e.target.value })}
                        >
                          <option>Laptop</option>
                          <option>Phone</option>
                          <option>Tablet</option>
                          <option>Other</option>
                        </select>
                      </div>
                      <div className="space-y-xs">
                        <label className="text-caption-bold uppercase text-ink">{t('kiosk.brand')}</label>
                        <input
                          className="w-full bg-cloud border border-fog px-md py-sm rounded-md outline-none focus:border-primary transition-colors text-body-md"
                          placeholder="e.g. Dell"
                          value={quickRegData.brand}
                          onChange={e => setQuickRegData({ ...quickRegData, brand: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-xs">
                        <label className="text-caption-bold uppercase text-ink">{t('serial_number')}</label>
                        <input
                          className="w-full bg-cloud border border-fog px-md py-sm rounded-md outline-none focus:border-primary transition-colors text-body-md"
                          placeholder="e.g. 5CD1234XYZ"
                          value={quickRegData.serial_number}
                          onChange={e => setQuickRegData({ ...quickRegData, serial_number: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-md">
                      <label className="text-caption-bold uppercase text-ink">{t('kiosk.asset_image')}</label>
                      <div className="border border-fog rounded-md overflow-hidden bg-cloud">
                        <CameraCapture onCapture={(img) => setQuickRegPhoto(img)} />
                      </div>
                      <p className="text-[10px] text-graphite uppercase font-bold tracking-wider">{t('kiosk.required_security_verification')}</p>
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-primary text-on-ink py-md rounded-md text-body-emphasis hover:bg-primary-deep shadow-soft-lift transition-all">
                    {t('kiosk.request_security_approval')}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Forgotten Session Modal */}
      {showForgottenSessionModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-md">
          <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={() => setShowForgottenSessionModal(false)}></div>
          <div className="bg-paper w-full max-w-lg rounded-xl shadow-floating z-10 border border-fog overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="px-xl py-md border-b border-fog flex justify-between items-center bg-cloud">
              <div className="flex items-center space-x-sm text-primary">
                <AlertTriangle size={24} />
                <h3 className="text-display-xs text-ink">Quên Check-out</h3>
              </div>
              <button onClick={() => setShowForgottenSessionModal(false)} className="text-steel hover:text-ink transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-xl text-center space-y-md">
              <p className="text-body-lg text-charcoal">{forgottenSessionMessage}</p>
              <div className="flex gap-sm mt-xl pt-xl">
                <button
                  onClick={() => setShowForgottenSessionModal(false)}
                  className="flex-1 px-xl py-md bg-fog rounded-md font-bold text-graphite hover:bg-cloud transition shadow-sm"
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleCheckIn(true)}
                  className="flex-1 px-xl py-md bg-primary text-on-ink rounded-md font-bold hover:bg-primary-deep transition shadow-soft-lift"
                >
                  Đồng ý
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckInPage;
