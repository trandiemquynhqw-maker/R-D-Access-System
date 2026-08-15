# 🌍 i18n Implementation Guide - React i18next Multilingual System

## Overview
This document explains how to implement multilingual support using react-i18next in the R&D Access Management application.

---

## Quick Setup (Already Completed ✅)

### ✅ Installed Packages
```bash
npm install i18next react-i18next i18next-browser-languagedetector
```

### ✅ Configuration Files Created
- `/src/i18n.js` - i18n configuration
- `/src/locales/en.json` - English translations
- `/src/locales/vi.json` - Vietnamese translations
- `/src/components/LanguageSwitcher.jsx` - Language toggle button

### ✅ Updated Files
- `/src/index.jsx` - Added i18n import
- `/src/components/Header.jsx` - Uses translations + LanguageSwitcher
- `/src/components/Sidebar.jsx` - Uses translations

---

## How to Use Translations in Components

### Basic Usage - Hook Method

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t, i18n } = useTranslation();
  
  return (
    <div>
      <h1>{t('common.appName')}</h1>
      <button onClick={() => i18n.changeLanguage('en')}>
        English
      </button>
      <button onClick={() => i18n.changeLanguage('vi')}>
        Tiếng Việt
      </button>
    </div>
  );
}
```

### Key Naming Convention
Keys are organized by namespace/category:
```
common.logout         // Common UI elements
login.invalidCredentials    // Login page
devices.approve       // Device management
approval.requestApproved   // Approval workflow
errors.unknown_error  // Error messages
validation.required_field  // Validation messages
```

---

## Translation File Structure

### Available Translation Keys

#### Common (in `common`)
- `appName` - Application name
- `welcome` - Welcome message
- `logout` / `sign_out` - Logout button
- `save` - Save button
- `cancel` - Cancel button
- `loading` - Loading text
- `error`, `success`, `warning` - Status messages
- `language`, `english`, `vietnamese` - Language selector

#### Sidebar (`sidebar.*`)
- `main_operations` - Main menu label
- `my_devices`, `register_new`, `qr_tags`
- `directory`, `personnel`, `access_logs`
- `compliance`, `tech_help`, `preferences`

#### Login (`login.*`)
- `sign_in` - Sign in button
- `username`, `password` - Form labels
- `invalidCredentials` - Error message
- `rememberMe` - Checkbox label

#### Devices (`devices.*`)
- `register_device` - Register button
- `my_devices`, `approved_devices`, `pending_devices`
- `device_details`, `device_status`, `device_type`
- `approve`, `reject` - Action buttons

#### Dashboard (`dashboard.*`)
- `live_security` - Dashboard title
- `current_occupancy` - Section title
- `live_feed` - Real-time monitoring
- `no_activity_detected` - Empty state

#### Approvals (`approvals.*`)
- `approval_requests` - Page title
- `pending_requests`, `approved_requests`
- `approve_device`, `reject_device`
- `requestApproved` - Success message

#### Other Namespaces
- `kiosk.*` - Kiosk terminal
- `stats.*` - Statistics page
- `user_management.*` - User admin
- `activity_logs.*` - Activity tracking
- `settings.*` - Settings page
- `profile.*` - User profile
- `errors.*` - Error messages
- `validation.*` - Form validation
- `success.*` - Success messages

---

## Step-by-Step: Convert a Component

### Example 1: Simple Component

**Before:**
```jsx
export function Alert({ message, type }) {
  return (
    <div className={`alert alert-${type}`}>
      {type === 'error' && <span>Error: {message}</span>}
      {type === 'success' && <span>Success! {message}</span>}
    </div>
  );
}
```

**After:**
```jsx
import { useTranslation } from 'react-i18next';

export function Alert({ message, type }) {
  const { t } = useTranslation();
  
  return (
    <div className={`alert alert-${type}`}>
      {type === 'error' && (
        <span>{t('errors.error')}: {message}</span>
      )}
      {type === 'success' && (
        <span>{t('success.operation_successful')}! {message}</span>
      )}
    </div>
  );
}
```

### Example 2: Form Component

**Before:**
```jsx
function DeviceForm() {
  return (
    <form>
      <label>Device Type</label>
      <input placeholder="Enter device type" />
      <label>Serial Number</label>
      <input placeholder="Enter serial number" />
      <button type="submit">Register Device</button>
    </form>
  );
}
```

**After:**
```jsx
import { useTranslation } from 'react-i18next';

function DeviceForm() {
  const { t } = useTranslation();
  
  return (
    <form>
      <label>{t('devices.device_type')}</label>
      <input placeholder={t('placeholders.enter_text')} />
      <label>{t('devices.serial_number')}</label>
      <input placeholder={t('placeholders.enter_text')} />
      <button type="submit">{t('devices.register_device')}</button>
    </form>
  );
}
```

---

## Comprehensive List: Pages to Update

### Priority 1: Core Pages (Update First)
1. ✅ `Header.jsx` - **DONE**
2. ✅ `Sidebar.jsx` - **DONE**
3. **LoginPage.jsx** - Login form
4. **DashboardPage.jsx** - Main security dashboard
5. **DeviceRegistrationPage.jsx** - Device registration form
6. **ApprovalPage.jsx** - Device approvals

### Priority 2: Important Pages
7. **CheckInPage.jsx** - Kiosk check-in interface
8. **PersonalStatsPage.jsx** - User statistics
9. **ActivityLogsPage.jsx** - Activity logging
10. **UserManagementPage.jsx** - User admin

### Priority 3: Admin/Config Pages
11. **SettingsPage.jsx** - User settings
12. **ProfilePage.jsx** - User profile
13. **RulesPage.jsx** - Facility rules
14. **SupportPage.jsx** - Technical support

### Priority 4: Utility Pages
15. **PlaceholderPage.jsx** - Placeholder template
16. **RegisterDevicePage.jsx** - Device registration
17. **DeviceQRTagsPage.jsx** - QR tag management
18. **SecurityVerifyPage.jsx** - Security verification
19. **AdminDashboard.jsx** - Admin dashboard

### Priority 5: Components
20. **Alert.jsx**
21. **LoadingSpinner.jsx**
22. **NotificationDropdown.jsx**
23. **GlobalLayout.jsx**
24. **QRScanner.jsx**
25. **CameraCapture.jsx**

---

## Template: Page Update Pattern

Use this template for updating pages:

```jsx
import { useTranslation } from 'react-i18next';

export const YourPage = () => {
  const { t } = useTranslation();
  
  // Your existing logic here
  
  return (
    <div>
      {/* Replace hardcoded strings with t() calls */}
      <h1>{t('section.title')}</h1>
      <p>{t('section.description')}</p>
      <button>{t('common.save')}</button>
    </div>
  );
};
```

---

## Common Patterns

### Conditional Text
```jsx
<p>
  {device.status === 'approved' 
    ? t('devices.approved') 
    : t('devices.pending')}
</p>
```

### Dynamic Values with Interpolation
```jsx
// In translation file: "Welcome {{name}}"
<h1>{t('common.welcome', { name: user.full_name })}</h1>
```

### Pluralization (if needed)
```jsx
// In translation file: "You have {{count}} device"
<p>{t('devices.device_count', { count: devices.length })}</p>
```

### Lists and Enums
```jsx
const roles = [
  { key: 'engineer', label: t('user_management.engineer') },
  { key: 'manager', label: t('user_management.manager') },
  { key: 'security', label: t('user_management.security') },
  { key: 'admin', label: t('user_management.admin') }
];
```

---

## Changing Language Programmatically

### Method 1: Using LanguageSwitcher Component
```jsx
import LanguageSwitcher from './components/LanguageSwitcher';

// Place in Header or top-level component
<LanguageSwitcher />
```

### Method 2: Manual Toggle
```jsx
const { i18n } = useTranslation();

<button onClick={() => i18n.changeLanguage('en')}>
  English
</button>
<button onClick={() => i18n.changeLanguage('vi')}>
  Tiếng Việt
</button>
```

### Method 3: Get Current Language
```jsx
const { i18n } = useTranslation();

console.log(i18n.language); // 'en' or 'vi'
console.log(i18n.dir()); // 'ltr' for both EN and VI
```

---

## Adding a New Language (Vietnamese is already included)

If you need to add another language like Spanish (es):

1. Create `/src/locales/es.json` with all keys translated
2. Update `i18n.js`:
```jsx
import esTranslations from './locales/es.json';

const resources = {
  en: { translation: enTranslations },
  vi: { translation: viTranslations },
  es: { translation: esTranslations }  // Add this
};
```
3. Update LanguageSwitcher if needed

---

## Debugging i18n

### Check Current Language
```jsx
const { i18n } = useTranslation();
console.log('Current language:', i18n.language);
```

### Check Loaded Resources
```jsx
const { i18n } = useTranslation();
console.log('Resources:', i18n.services.resourceStore.data);
```

### Test Translation Key
```jsx
const { t } = useTranslation();
console.log(t('common.welcome')); // Should print translated text
```

### View in Browser DevTools
```javascript
// In browser console
// Check localStorage for language
localStorage.getItem('i18nextLng')
```

---

## Best Practices

✅ **DO:**
- Keep translation keys organized by feature/page
- Use consistent naming conventions (snake_case)
- Put translations in JSON files, not hard-coded
- Always use nested keys (e.g., `devices.register_device`)
- Test both languages before deployment
- Use `useTranslation()` hook in all components

❌ **DON'T:**
- Hardcode strings in components
- Use flat key structure (all keys at root level)
- Mix translation methods in same component
- Forget to add translations for new features
- Use `languageStore` after migration (deprecated)

---

## Performance Tips

- i18next caches translations in memory
- Language switching is instant (no page reload needed)
- localStorage detection is automatic
- No API calls needed for language data

---

## Files Summary

| File | Purpose |
|------|---------|
| `/src/i18n.js` | i18n configuration & setup |
| `/src/locales/en.json` | English translations |
| `/src/locales/vi.json` | Vietnamese translations |
| `/src/index.jsx` | Initialized i18n before app render |
| `/src/components/LanguageSwitcher.jsx` | Language toggle component |
| `/src/components/Header.jsx` | Updated with translations |
| `/src/components/Sidebar.jsx` | Updated with translations |

---

## Next Steps

1. ✅ Core setup complete
2. Update remaining pages (see Priority List above)
3. Test all pages in both EN and VI languages
4. Test localStorage persistence (language selection saved)
5. Deploy to production

---

## Quick Checklist for Each File Update

- [ ] Import `useTranslation` hook
- [ ] Call `const { t } = useTranslation()` at top
- [ ] Replace all hardcoded strings with `t('key')`
- [ ] Test in both English and Vietnamese
- [ ] Verify no console errors
- [ ] Check responsive design works in both languages (text length varies)

---

## Need Help?

Refer to:
- i18next docs: https://www.i18next.com/
- react-i18next: https://react.i18next.com/
- Translation keys: See list above or check `/src/locales/en.json`

