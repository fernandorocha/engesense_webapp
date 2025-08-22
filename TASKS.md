Tarefas:
- Problemas:
	- Gráfico mantém measurements anteriores após desselecionar no dropdown.

- Aparência:
	- gráfico ficando maluco quando mexe no zoom e sensores
	- arrumar formato do gráfico (smooth, line instead of area), legenda
	- melhorar interação com gráfico (Zoom)
	- tela de espera ao carregar os dados 
		-Add spinners or skeleton loaders while data is being fetched.
	- Adicionar "Selecionar todos" nos dropdowns
	- mudar aparência "infantil"
	- Versão mobile 
		- Your dashboard is functional but could benefit from mobile responsiveness.
		- Use a CSS framework like Bootstrap or Tailwind to make charts and controls adapt to smaller screens.

- Melhorias:
	- melhorar banco de dados de usuários
		- preencher informações de auditoria
		- permitir recuperação de senha
		- Allow users to manage their profile, set notification preferences, and view their activity history.
		
	- Segurança
		- Ensure sessions expire after inactivity.
		- Use secure cookies and CSRF protection for forms.


- Novas funcionalidades:
	- Alertas
		- Custom Alerts: Users can set thresholds on sensor values and get notified (email, SMS, push) when exceeded.
		- Alert History: Provide a history of triggered alerts for auditing.
		
	- Localização
		- Geolocation: Visualize sensor/device locations on a map, useful for distributed deployments.


 Observações:

Geral:


1. Real-Time Data Visualization
Live Charts: Display sensor data in real-time using live updating charts (e.g., temperature, humidity, air quality).
Historical Data Playback: Allow users to "play back" sensor data trends over a time window.
2. User Management & Permissions
Role-Based Access: Support different user roles (admin, user, guest) with varying levels of access and control.
User Profiles: Allow users to manage their profile, set notification preferences, and view their activity history.
3. Alerting & Notifications
Custom Alerts: Users can set thresholds on sensor values and get notified (email, SMS, push) when exceeded.
Alert History: Provide a history of triggered alerts for auditing.
4. Device Management
Device Registration: Allow users to easily add new devices via a UI, including QR code pairing.
Device Health Monitoring: Show device status (online/offline, battery, last communication).
5. Reporting & Exports
Download Data: Enable export of sensor data to CSV/Excel/PDF.
Automated Reports: Schedule periodic reports sent to users’ emails.
6. Integration & API
RESTful API: Provide an authenticated API for third-party integrations or custom apps.
Webhook Support: Allow users to configure webhooks for receiving sensor events in other systems.
7. Advanced Analytics
Anomaly Detection: Highlight unusual readings or trends using simple ML/statistical analysis.
Comparative Analytics: Compare sensor data across devices, locations, or time periods.
8. Dashboard Customization
Custom Widgets: Let users add, remove, or rearrange widgets (charts, tables) to suit their needs.
Themes/Dark Mode: Support light/dark mode and color customization for accessibility.
9. Mobile Experience
Responsive Design: Ensure dashboard works seamlessly on mobile devices.
Progressive Web App (PWA): Enable installable, offline-capable dashboard.
10. Map Integration
Geolocation: Visualize sensor/device locations on a map, useful for distributed deployments.


Banco de dados:

Phase 2: Security & Management (Next)

Add user sessions tracking
Implement password policies
Add user status management
Create audit logging

Phase 3: Advanced Features (Future)

Multi-organization membership
Advanced permissions
API key management
Notification preferences
