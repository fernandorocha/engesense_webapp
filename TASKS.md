# Engensense Webapp — Tasks & Improvements

This document tracks bugs, enhancements, and new features for the Engensense Webapp.  
**Update this file as you work!**

---

## 🐞 Known Issues

- **Chart:** Previous measurements remain on the chart after being deselected in the dropdown.
- **Chart UI:** Chart behaves erratically when zooming or toggling sensors.
- **Chart Style:** Needs smoother lines (line chart, not area), improved legend.
- **Loading State:** No loading indicator while fetching data.
- **Dropdowns:** Missing "Select All" option.
- **Visual Design:** UI looks too childish.
- **Mobile:** Dashboard is not mobile responsive.

---

## ✨ Improvements

- **User Database:**
  - Add audit information (created/updated timestamps, etc).
  - Implement password recovery.
  - Allow users to manage their profile, notification preferences, and view activity history.

- **Security:**
  - Ensure sessions expire after inactivity.
  - Use secure cookies and add CSRF protection for forms.

- **Chart & UI:**
  - Add spinners or skeleton loaders during data fetch.
  - Improve chart interaction (better zoom, pan).
  - Refactor chart for better appearance and usability.
  - Use a CSS framework (Bootstrap/Tailwind) for responsive design.

---

## 🚀 New Features

- **Alerts:**
  - Custom alerts: Users set thresholds and get notified (email, SMS, push).
  - Alert history: Show triggered alerts for auditing.

- **Geolocation:**
  - Visualize sensor/device locations on a map.

- **Real-Time Data:**
  - Live updating charts for sensor data.
  - Historical data playback ("play" sensor trends over time).

- **User Management & Permissions:**
  - Role-based access (admin, user, guest).
  - User profiles and notification preferences.

- **Device Management:**
  - Device registration (UI, QR code pairing).
  - Device health/status (online/offline, battery, last seen).

- **Reporting & Exports:**
  - Export sensor data (CSV, Excel, PDF).
  - Schedule periodic reports via email.

- **Integration & API:**
  - RESTful API for third-party integrations.
  - Webhook support for sensor events.

- **Advanced Analytics:**
  - Anomaly detection (ML/statistics).
  - Comparative analytics (across devices, locations, time).

- **Dashboard Customization:**
  - Custom widgets (add/remove/rearrange).
  - Themes/dark mode.

- **Mobile Experience:**
  - Responsive design.
  - Progressive Web App (PWA) support.

- **Map Integration:**
  - Geolocation for devices/sensors.

---

## 🗄️ Database Roadmap

**Phase 2: Security & Management (Next)**
- User session tracking
- Password policies
- User status management
- Audit logging

**Phase 3: Advanced Features (Future)**
- Multi-organization membership
- Advanced permissions
- API key management
- Notification preferences

---

**Notes:**  
- After DB changes, run: `node scripts/db.js`
- For UI changes, test in browser and check for errors.
- Always run `npm run check-syntax` before committing.
