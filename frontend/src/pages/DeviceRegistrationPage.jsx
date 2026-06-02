import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDeviceStore } from '../store/deviceStore';
import { deviceService } from '../services/deviceService';
import Alert from '../components/Alert';
import LoadingSpinner from '../components/LoadingSpinner';
import { useLanguageStore } from '../store/languageStore';
import { Laptop, Smartphone, MonitorSmartphone, Plus, X, QrCode, Shield, Clock, XCircle, CheckCircle2, Trash2, ChevronRight, HardDrive, Download } from 'lucide-react';

export const DeviceRegistrationPage = () => {
  const { t } = useLanguageStore();
  const { devices, createDevice, fetchMyDevices, deleteDevice, isLoading, error } = useDeviceStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    device_type: 'Laptop',
    brand: '',
    model_name: '',
    serial_number: '',
    mac_address: '',
    description: '',
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [activeQRUrl, setActiveQRUrl] = useState('');
  const [activeDeviceName, setActiveDeviceName] = useState('');
  const [saving, setSaving] = useState(false);
  const [committed, setCommitted] = useState(false);

  useEffect(() => {
    fetchMyDevices();
    if (location.pathname === '/register-device') {
      setShowForm(true);
    }
  }, [fetchMyDevices, location.pathname]);

  const handleShowQR = async (device) => {
    try {
      if (device.status !== 'approved') return;
      const data = await deviceService.getDeviceQR(device.device_id);
      setActiveQRUrl(data.qrImage);
      setActiveDeviceName(`${device.brand} ${device.model_name}`);
      setShowQR(true);
    } catch (error) {
      console.error("Failed to load device QR", error);
    }
  };
  
  const handleDownloadActiveQR = () => {
    if (!activeQRUrl) return;
    const link = document.createElement('a');
    link.download = `QR_${activeDeviceName.replace(/\s+/g, '_')}.png`;
    link.href = activeQRUrl;
    link.click();
  };

  const handleDeleteDevice = async (id, brand, model_name) => {
    if (window.confirm(`Are you sure you want to remove ${brand} ${model_name}? This action cannot be undone.`)) {
      try {
        await deleteDevice(id);
        setSuccessMessage(`Device ${brand} ${model_name} removed successfully.`);
      } catch (err) {
        console.error('Failed to delete device:', err);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createDevice(formData);
      setSuccessMessage(t('devices.device_created'));
      setFormData({
        device_type: 'Laptop',
        brand: '',
        model_name: '',
        serial_number: '',
        mac_address: '',
        description: '',
      });
      setShowForm(false);
      await fetchMyDevices();
    } catch (err) {
      console.error('Failed to create device:', err);
    } finally {
      setSaving(false);
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'approved':
        return { color: 'text-green-600 bg-green-50 border-green-100', icon: <CheckCircle2 size={14} className="mr-1" />, label: t('devices.approved') };
      case 'pending':
        return { color: 'text-amber-600 bg-amber-50 border-amber-100', icon: <Clock size={14} className="mr-1" />, label: t('devices.pending') };
      case 'rejected':
        return { color: 'text-red-600 bg-red-50 border-red-100', icon: <XCircle size={14} className="mr-1" />, label: t('devices.rejected') };
      default:
        return { color: 'text-graphite bg-cloud border-fog', icon: null, label: 'Unknown' };
    }
  };

  const getDeviceIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'laptop': return <Laptop size={24} className="text-primary" />;
      case 'phone': return <Smartphone size={24} className="text-primary" />;
      default: return <HardDrive size={24} className="text-primary" />;
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-ink font-sans p-xl relative overflow-hidden transition-colors duration-300">
      
      {/* Decorative Gradient Background */}
      <div className="absolute top-0 right-0 w-1/3 h-1/2 bg-primary/5 blur-[120px] pointer-events-none z-0"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-xl mb-xxl">
          <div>
            <h1 className="text-display-md tracking-tight mb-xs">{t('dashboard.asset_inventory')}</h1>
            <p className="text-body-md text-charcoal">{t('dashboard.manage_assets_desc')}</p>
          </div>
          <button
            onClick={() => navigate('/register-device')}
            className="bg-primary text-on-ink px-xl py-sm rounded-md button-label-md hover:bg-primary-deep transition shadow-soft-lift flex items-center gap-xs"
          >
            <Plus size={20} /> {t('dashboard.register_new_asset')}
          </button>
        </div>

        {/* Global Notifications */}
        {(successMessage || error) && (
          <div className="mb-xl animate-in fade-in slide-in-from-top-4">
            {successMessage && <Alert message={successMessage} type="success" onClose={() => setSuccessMessage('')} />}
            {error && <Alert message={error} type="error" onClose={() => {}} />}
          </div>
        )}

        {/* Inventory Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-xl mb-xxl">
          <div className="bg-paper border border-fog p-xl rounded-xl shadow-floating flex flex-col justify-between">
             <div className="flex justify-between items-start">
                <p className="text-caption-bold text-graphite uppercase tracking-widest">{t('dashboard.total_assets')}</p>
                <div className="p-xs bg-cloud rounded-md text-graphite">
                   <HardDrive size={20} />
                </div>
             </div>
             <p className="text-display-md mt-md">{devices?.length || 0}</p>
          </div>
          
          <div className="bg-paper border border-fog p-xl rounded-xl shadow-floating flex flex-col justify-between">
             <div className="flex justify-between items-start">
                <p className="text-caption-bold text-graphite uppercase tracking-widest">{t('devices.approved')}</p>
                <div className="p-xs bg-green-50 rounded-md text-green-600">
                   <Shield size={20} />
                </div>
             </div>
             <p className="text-display-md mt-md text-green-600">{devices?.filter(d => d.status === 'approved').length || 0}</p>
          </div>

          <div className="bg-primary p-xl rounded-xl shadow-floating flex flex-col justify-between text-white">
             <div className="flex justify-between items-start">
                <p className="text-caption-bold text-fog uppercase tracking-widest">{t('dashboard.active_verification')}</p>
                <div className="p-xs bg-white/20 rounded-md text-white">
                   <Clock size={20} />
                </div>
             </div>
             <p className="text-display-md mt-md">{devices?.filter(d => d.status === 'pending').length || 0}</p>
          </div>
        </div>

        {/* Asset Grid */}
        <div className="space-y-xl">
           <h2 className="text-display-xs">{t('dashboard.your_devices')}</h2>
           
           {isLoading && devices.length === 0 ? (
             <div className="py-xxl flex justify-center">
                <LoadingSpinner />
             </div>
           ) : devices && devices.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-xl">
                {devices.map((device) => {
                  const status = getStatusConfig(device.status);
                  return (
                    <div key={device.device_id} className="bg-paper rounded-xl shadow-floating border border-fog overflow-hidden group hover:border-primary transition-all duration-300 flex flex-col">
                       {device.image_url && (
                          <div className="w-full h-40 bg-cloud relative border-b border-fog shrink-0">
                             <img src={device.image_url} alt="device" className="w-full h-full object-cover" />
                             <div className="absolute top-md right-md">
                                <span className={`px-sm py-xs rounded-full text-[10px] font-bold uppercase tracking-wider border bg-white/90 backdrop-blur-sm ${status.color.replace('bg-', 'text-')}`}>
                                   {status.label}
                                </span>
                             </div>
                          </div>
                       )}

                       <div className="p-xl flex-1 flex flex-col justify-between">
                          <div className="space-y-xl">
                             {!device.image_url && (
                               <div className="flex justify-between items-start">
                                  <div className="p-md bg-cloud rounded-xl text-primary group-hover:bg-primary/10 transition-colors">
                                     {getDeviceIcon(device.device_type)}
                                  </div>
                                  <span className={`px-sm py-xs rounded-full text-[10px] font-bold uppercase tracking-wider border ${status.color}`}>
                                     {status.label}
                                  </span>
                               </div>
                             )}

                          <div className="space-y-xxs">
                             <h3 className="text-body-emphasis text-ink truncate">{device.brand} {device.model_name}</h3>
                             <p className="text-caption-md text-graphite">{device.device_type}</p>
                          </div>

                          <div className="p-md bg-cloud rounded-md space-y-xs">
                             <div className="flex justify-between text-[11px]">
                                <span className="text-graphite">{t('devices.serial_number')}:</span>
                                <span className="font-mono text-ink font-bold">{device.serial_number}</span>
                             </div>
                             <div className="flex justify-between text-[11px]">
                                <span className="text-graphite">{t('devices.mac_address')}:</span>
                                <span className="font-mono text-ink">{device.mac_address || 'N/A'}</span>
                             </div>
                          </div>
                           </div>
                        </div>
                       <div className="px-xl py-md bg-cloud border-t border-fog flex justify-between items-center">
                          <span className="text-[10px] text-graphite uppercase font-bold tracking-wider">
                             {t('devices.registration_date')} {new Date(device.created_at).toLocaleDateString()}
                          </span>
                          <div className="flex items-center gap-md">
                             {device.status === 'approved' && (
                               <button 
                                 onClick={() => handleShowQR(device)}
                                 className="text-primary hover:text-primary-deep text-caption-bold flex items-center gap-xxs"
                               >
                                  <QrCode size={14} /> {t('devices.qr_code')}
                               </button>
                             )}
                             <button 
                               onClick={() => handleDeleteDevice(device.device_id, device.brand, device.model_name)}
                               className="text-steel hover:text-red-500 transition-colors"
                             >
                                <Trash2 size={16} />
                             </button>
                          </div>
                       </div>
                    </div>
                  );
                })}
             </div>
           ) : (
             <div className="bg-cloud rounded-xl border border-dashed border-fog p-xxl text-center">
                <div className="w-16 h-16 bg-paper rounded-full flex items-center justify-center mx-auto mb-xl shadow-soft-lift">
                   <HardDrive size={32} className="text-steel" />
                </div>
                <h3 className="text-display-xs mb-xs">{t('no_assets_registered')}</h3>
                <p className="text-body-md text-charcoal max-w-md mx-auto mb-xl">{t('no_assets_desc')}</p>
                <button 
                  onClick={() => navigate('/register-device')}
                  className="bg-primary text-on-ink px-xl py-sm rounded-md font-bold hover:bg-primary-deep transition"
                >
                   {t('get_started')}
                </button>
             </div>
           )}
        </div>

        {/* Registration Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-md">
             <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={() => setShowForm(false)}></div>
             <div className="bg-paper w-full max-w-2xl rounded-xl shadow-floating z-10 border border-fog overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                <div className="px-xl py-md border-b border-fog flex justify-between items-center bg-cloud">
                   <div className="flex items-center space-x-sm text-primary">
                      <Plus size={24} />
                      <h3 className="text-display-xs text-ink">{t('asset_registration')}</h3>
                   </div>
                   <button onClick={() => setShowForm(false)} className="text-steel hover:text-ink transition-colors">
                      <X size={24} />
                   </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-xl space-y-xl overflow-y-auto max-h-[80vh]">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
                      <div className="space-y-xs">
                         <label className="text-caption-bold uppercase text-ink">{t('classification')}</label>
                         <select 
                           name="device_type"
                           className="w-full bg-cloud border border-fog px-md py-sm rounded-md outline-none focus:border-primary transition-colors text-body-md"
                           value={formData.device_type}
                           onChange={handleInputChange}
                         >
                            <option value="Laptop">{t('mobile_workstation')}</option>
                            <option value="Phone">{t('telecommunications')}</option>
                            <option value="Tablet">{t('slate_computer')}</option>
                            <option value="Other">{t('custom_hardware')}</option>
                         </select>
                      </div>
                      <div className="space-y-xs">
                         <label className="text-caption-bold uppercase text-ink">{t('manufacturer')}</label>
                         <input 
                           name="brand"
                           className="w-full bg-cloud border border-fog px-md py-sm rounded-md outline-none focus:border-primary transition-colors text-body-md"
                           placeholder="e.g. Dell, Lenovo, Apple"
                           value={formData.brand}
                           onChange={handleInputChange}
                           required
                         />
                      </div>
                      <div className="md:col-span-2 space-y-xs">
                         <label className="text-caption-bold uppercase text-ink">{t('model_name')}</label>
                         <input 
                           name="model_name"
                           className="w-full bg-cloud border border-fog px-md py-sm rounded-md outline-none focus:border-primary transition-colors text-body-md"
                           placeholder="e.g. Latitude 7440 / ThinkPad X1"
                           value={formData.model_name}
                           onChange={handleInputChange}
                           required
                         />
                      </div>
                      <div className="space-y-xs">
                         <label className="text-caption-bold uppercase text-ink">{t('serial_number')}</label>
                         <input 
                           name="serial_number"
                           className="w-full bg-cloud border border-fog px-md py-sm rounded-md outline-none font-mono text-ink font-bold focus:border-primary transition-colors text-body-md"
                           placeholder="Located on product base"
                           value={formData.serial_number}
                           onChange={handleInputChange}
                           required
                         />
                      </div>
                      <div className="space-y-xs">
                         <label className="text-caption-bold uppercase text-ink">{t('mac_address')} ({t('optional')})</label>
                         <input 
                           name="mac_address"
                           className="w-full bg-cloud border border-fog px-md py-sm rounded-md outline-none font-mono focus:border-primary transition-colors text-body-md"
                           placeholder="00:00:00:00:00:00"
                           value={formData.mac_address}
                           onChange={handleInputChange}
                         />
                      </div>
                      <div className="md:col-span-2 space-y-xs">
                         <label className="text-caption-bold uppercase text-ink">{t('notes')}</label>
                         <textarea 
                           name="description"
                           className="w-full bg-cloud border border-fog px-md py-sm rounded-md outline-none focus:border-primary transition-colors text-body-md resize-none"
                           placeholder="Briefly describe the purpose of this device in the facility"
                           rows="3"
                           value={formData.description}
                           onChange={handleInputChange}
                         />
                      </div>
                   </div>

                   <div className="p-md bg-primary/5 rounded-md border border-primary/10 flex items-start gap-md">
                      <input 
                        type="checkbox" 
                        id="commitment" 
                        className="mt-xs w-5 h-5 rounded border-fog text-primary focus:ring-primary"
                        checked={committed}
                        onChange={e => setCommitted(e.target.checked)}
                        required
                      />
                      <label htmlFor="commitment" className="text-caption-md text-charcoal leading-relaxed cursor-pointer select-none">
                         {t('commitment_text')}
                      </label>
                   </div>

                   <div className="flex gap-md justify-end pt-md">
                      <button type="button" onClick={() => setShowForm(false)} className="px-xl py-sm text-caption-bold text-graphite hover:bg-cloud rounded-md transition">{t('cancel')}</button>
                      <button 
                        type="submit" 
                        disabled={saving || !committed}
                        className="bg-primary text-on-ink px-xl py-sm rounded-md font-bold hover:bg-primary-deep shadow-soft-lift disabled:opacity-50 flex items-center gap-xs"
                      >
                         {saving ? t('loading') : t('register_new_asset')}
                      </button>
                   </div>
                </form>
             </div>
          </div>
        )}

        {/* Tag Modal */}
        {showQR && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-md">
             <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" onClick={() => setShowQR(false)}></div>
             <div className="bg-paper w-full max-w-sm rounded-xl shadow-floating z-10 border border-fog p-xxl text-center animate-in zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-xl">
                   <QrCode size={32} className="text-primary" />
                </div>
                <h3 className="text-display-xs mb-xs">{t('asset_tag_qr')}</h3>
                <p className="text-caption-bold text-primary uppercase tracking-widest mb-xl">{activeDeviceName}</p>
                
                <div className="bg-white p-xl rounded-xl border border-fog inline-block shadow-sm mb-xl">
                   {activeQRUrl ? (
                     <img src={activeQRUrl} alt="Device QR" className="w-48 h-48 object-contain" />
                   ) : (
                     <div className="w-48 h-48 flex items-center justify-center">
                        <LoadingSpinner />
                     </div>
                   )}
                </div>
                
                <p className="text-caption-md text-charcoal leading-relaxed mb-xl">
                   {t('kiosk_instruction')}
                </p>
                 
                 {activeQRUrl && (
                   <button 
                     type="button"
                     onClick={handleDownloadActiveQR}
                     className="w-full py-sm bg-primary text-on-ink rounded-md font-bold hover:bg-primary-deep transition mb-md flex items-center justify-center gap-xs shadow-soft-lift text-caption-bold"
                   >
                      <Download size={16} /> Tải mã QR (.png)
                   </button>
                 )}
                 
                 <button 
                   onClick={() => setShowQR(false)}
                   className="w-full py-sm bg-cloud border border-fog rounded-md font-bold text-ink hover:bg-fog transition text-caption-bold"
                 >
                    {t('close')}
                 </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeviceRegistrationPage;
