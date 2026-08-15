# 🚀 i18n Quick Reference Card

## 🔧 Setup (Already Done)

```bash
# Installation (completed)
npm install i18next react-i18next i18next-browser-languagedetector

# Files created
src/i18n.js                  # Configuration
src/locales/en.json         # English
src/locales/vi.json         # Vietnamese
src/components/LanguageSwitcher.jsx  # Toggle button
```

---

## 💻 Usage in Components

### Step 1: Import
```jsx
import { useTranslation } from 'react-i18next';
```

### Step 2: Use Hook
```jsx
const { t, i18n } = useTranslation();
```

### Step 3: Replace Strings
```jsx
// Before
<h1>Dashboard</h1>

// After
<h1>{t('dashboard.live_security')}</h1>
```

---

## 🎯 Most Common Keys

| Use Case | Key |
|----------|-----|
| App Title | `t('common.appName')` |
| Save Button | `t('common.save')` |
| Cancel Button | `t('common.cancel')` |
| Delete Confirmation | `t('modal.are_you_sure')` |
| Loading Text | `t('common.loading')` |
| Error | `t('common.error')` |
| Success | `t('common.success')` |
| No Data | `t('empty_states.no_data')` |
| Edit Button | `t('common.edit')` |
| Delete Button | `t('common.delete')` |

---

## 📋 Page-Specific Keys

### Dashboard
```jsx
t('dashboard.live_security')
t('dashboard.current_occupancy')
t('dashboard.no_activity_detected')
t('common.export')
```

### Login
```jsx
t('login.sign_in')
t('login.username')
t('login.password')
t('login.invalidCredentials')
```

### Devices
```jsx
t('devices.register_device')
t('devices.approved_devices')
t('devices.pending_devices')
t('devices.approve')
t('devices.reject')
```

### Approvals
```jsx
t('approvals.approval_requests')
t('approvals.pending_requests')
t('approvals.requestApproved')
t('approvals.requestRejected')
```

---

## 🔄 Language Switching

### In LanguageSwitcher (Already Set Up)
```jsx
const { i18n } = useTranslation();
i18n.changeLanguage('en');  // English
i18n.changeLanguage('vi');  // Vietnamese
```

### Check Current Language
```jsx
const { i18n } = useTranslation();
console.log(i18n.language);  // 'en' or 'vi'
```

### localStorage
```javascript
// Automatically saved by i18next
localStorage.getItem('i18nextLng')  // 'en' or 'vi'
```

---

## 🧪 Testing Template

```jsx
import { useTranslation } from 'react-i18next';

export const TestComponent = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('common.appName')}</h1>
      <button>{t('common.save')}</button>
      <button>{t('common.cancel')}</button>
    </div>
  );
};
```

---

## ✅ Update Checklist for Each File

- [ ] Add import: `import { useTranslation } from 'react-i18next';`
- [ ] Add hook: `const { t } = useTranslation();`
- [ ] Replace hardcoded strings with `t('key')`
- [ ] Test in English
- [ ] Test in Vietnamese
- [ ] Verify no console errors
- [ ] Verify localStorage works (optional check)

---

## 🚨 Common Mistakes

❌ **Don't:**
```jsx
// Wrong - hardcoded string
<button>Save</button>

// Wrong - missing namespace
t('save')  // Key doesn't exist

// Wrong - forgets to import
const { t } = useTranslation();  // Not imported!
```

✅ **Do:**
```jsx
// Right - using translation key
<button>{t('common.save')}</button>

// Right - proper namespace
t('common.save')
t('dashboard.title')
t('devices.register_device')

// Right - proper import
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();
```

---

## 🔍 Finding Translation Keys

### Browse All Keys
1. Open `/src/locales/en.json`
2. Find your text in English
3. Note the full key path (e.g., `dashboard.live_security`)
4. Use `t('dashboard.live_security')` in code

### Key Structure
```json
{
  "dashboard": {
    "live_security": "Live Security System",
    "current_occupancy": "Current Occupancy"
  }
}
```

### Corresponding Usage
```jsx
t('dashboard.live_security')      // "Live Security System"
t('dashboard.current_occupancy')  // "Current Occupancy"
```

---

## 🎯 Quick Fill-in Template

Copy & paste into your page/component:

```jsx
import { useTranslation } from 'react-i18next';

export const [PageName] = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('namespace.title')}</h1>
      <p>{t('namespace.description')}</p>
      
      <button>{t('common.save')}</button>
      <button>{t('common.cancel')}</button>
      
      {error && <p>{t('errors.error')}</p>}
      {loading && <p>{t('common.loading')}</p>}
      {isEmpty && <p>{t('empty_states.no_data')}</p>}
    </div>
  );
};
```

---

## 📞 File Locations

| What | Where |
|------|-------|
| Configuration | `/src/i18n.js` |
| English Text | `/src/locales/en.json` |
| Vietnamese Text | `/src/locales/vi.json` |
| Language Button | `/src/components/LanguageSwitcher.jsx` |
| Working Example (Header) | `/src/components/Header.jsx` |
| Working Example (Page) | `/src/pages/LoginPage.jsx` |
| Full Guide | `I18N_IMPLEMENTATION_GUIDE.md` |
| Page Examples | `PAGE_UPDATE_EXAMPLES.md` |

---

## 🎓 Sample File Updates

### Simple Component
```jsx
// BEFORE
export function Alert({ message, type }) {
  return <div className={`alert-${type}`}>{message}</div>;
}

// AFTER
import { useTranslation } from 'react-i18next';

export function Alert({ message, type }) {
  const { t } = useTranslation();
  return <div className={`alert-${type}`}>{message}</div>;
}
```

### Page with Form
```jsx
// BEFORE
<form onSubmit={handleSubmit}>
  <input placeholder="Enter device type" />
  <button type="submit">Register Device</button>
</form>

// AFTER
import { useTranslation } from 'react-i18next';

export const DeviceForm = () => {
  const { t } = useTranslation();
  
  return (
    <form onSubmit={handleSubmit}>
      <input placeholder={t('placeholders.enter_text')} />
      <button type="submit">{t('devices.register_device')}</button>
    </form>
  );
};
```

### Page with Loading
```jsx
// BEFORE
{isLoading && <p>Loading...</p>}
{error && <p>Error: {error.message}</p>}
{data.length === 0 && <p>No data</p>}

// AFTER
import { useTranslation } from 'react-i18next';

export const DataPage = () => {
  const { t } = useTranslation();
  
  return (
    <>
      {isLoading && <p>{t('common.loading')}</p>}
      {error && <p>{t('common.error')}: {error.message}</p>}
      {data.length === 0 && <p>{t('empty_states.no_data')}</p>}
    </>
  );
};
```

---

## 🚀 Ready to Start?

1. Pick a page from `PAGE_UPDATE_EXAMPLES.md`
2. Copy the template above
3. Find hardcoded English strings
4. Replace with `t('key')` using this reference
5. Test both English and Vietnamese
6. Move to next page

**Start with Priority 1 pages for maximum impact!**

---

## 📊 Key Statistics

- **Total Translation Keys:** 500+
- **Languages Supported:** 2 (EN, VI)
- **Components Updated:** 3 (Header, Sidebar, LoginPage)
- **Pages Updated:** 1 (LoginPage)
- **Pages Remaining:** 16
- **Components Remaining:** 5

---

*Print or bookmark this for quick reference while updating pages!*
