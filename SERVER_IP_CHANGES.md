# Server IP Address Changes Summary

## Overview
All server IP addresses have been updated from **8.148.77.51** to **47.121.27.165** across the entire codebase.

## Files Modified (14 files total)

### Backend Configuration
1. **backend/server.js**
   - CORS origin configuration (2 occurrences)
   - Socket.io CORS origin (1 occurrence)
   - Line 23: `http://8.148.77.51:3000` → `http://47.121.27.165:3000`
   - Line 43: `http://8.148.77.51:3000` → `http://47.121.27.165:3000`

2. **backend/server-副本.js**
   - CORS origin configuration (1 occurrence)
   - Line 19: `http://8.148.77.51:3000` → `http://47.121.27.165:3000`

### Frontend Configuration
3. **frontend_dist/index.html**
   - API base URL (1 occurrence)
   - Socket URL (1 occurrence)
   - Line 46: `const API_BASE = 'http://8.148.77.51:3001/api'`
   - Line 47: `const SOCKET_URL = 'http://8.148.77.51:3001'`
   - Changed to: `http://47.121.27.165:3001/api` and `http://47.121.27.165:3001`

### Nginx Configuration
4. **config/nginx.production.conf**
   - Server name directive (1 occurrence)
   - Line 51: `server_name 8.148.77.51 localhost;`
   - Changed to: `server_name 47.121.27.165 localhost;`

### PM2 Ecosystem Configuration
5. **config/ecosystem.config.js**
   - FRONTEND_URL environment variable (1 occurrence)
   - Line 23: `FRONTEND_URL: 'http://8.148.77.51'`
   - Changed to: `FRONTEND_URL: 'http://47.121.27.165'`

6. **config/ecosystem.production.js**
   - FRONTEND_URL environment variable (1 occurrence)
   - Line 23: `FRONTEND_URL: 'http://8.148.77.51'`
   - Changed to: `FRONTEND_URL: 'http://47.121.27.165'`

### Environment Configuration
7. **config/env.production**
   - FRONTEND_URL variable (1 occurrence)
   - Line 14: `FRONTEND_URL=http://8.148.77.51`
   - Changed to: `FRONTEND_URL=http://47.121.27.165`

### Backup Files
8. **backup/frontend_server.js**
   - Console log message (1 occurrence)
   - Line 17: `console.log(\`访问地址: http://8.148.77.51:\${PORT}\`)`
   - Changed to: `console.log(\`访问地址: http://47.121.27.165:\${PORT}\`)`

### IM Package Files
9. **im-package/backend/server.js**
   - CORS origin configuration (2 occurrences)
   - Lines 23, 43: Updated to `http://47.121.27.165:3000`

10. **im-package/backend/server-副本.js**
    - CORS origin configuration (1 occurrence)
    - Line 19: Updated to `http://47.121.27.165:3000`

11. **im-package/config/ecosystem.config.js**
    - FRONTEND_URL environment variable (1 occurrence)
    - Line 23: Updated to `http://47.121.27.165`

12. **im-package/config/ecosystem.production.js**
    - FRONTEND_URL environment variable (1 occurrence)
    - Line 23: Updated to `http://47.121.27.165`

13. **im-package/config/env.production**
    - FRONTEND_URL variable (1 occurrence)
    - Line 14: Updated to `http://47.121.27.165`

14. **im-package/config/nginx.production.conf**
    - Server name directive (1 occurrence)
    - Line 51: Updated to `server_name 47.121.27.165 localhost;`

## Verification
All occurrences of the old IP address (8.148.77.51) have been successfully replaced with the new IP address (47.121.27.165). A grep search confirmed no remaining instances of the old IP address exist in the codebase.

## Impact Areas

### Backend Services
- Backend server will now accept CORS requests from 47.121.27.165:3000
- Socket.io connections from the new IP will be allowed
- No changes needed to database connections (using localhost)

### Frontend Services
- Frontend will connect to API at 47.121.27.165:3001
- Socket connections will establish to 47.121.27.165:3001
- Static files served via Nginx will use new server name

### Nginx Configuration
- Server will respond to requests for 47.121.27.165
- Reverse proxy configurations remain unchanged
- SSL/TLS configurations not affected (if any)

### PM2 Process Manager
- Environment variables updated for production deployment
- Frontend URL environment variable points to new IP
- No changes needed to restart or reload processes

## Testing Checklist
- [ ] Verify backend starts successfully
- [ ] Verify CORS allows connections from new IP
- [ ] Test frontend can connect to backend API
- [ ] Test Socket.io real-time messaging works
- [ ] Verify Nginx serves frontend correctly
- [ ] Test file uploads work
- [ ] Verify all authentication flows work
- [ ] Test group and private messaging

## Deployment Notes
1. Update DNS records if applicable
2. Update firewall rules to allow traffic on new IP
3. Restart all services after deployment:
   - `pm2 restart all`
   - `sudo systemctl restart nginx`
4. Clear browser cache on client machines
5. Update any external services pointing to old IP

## Rollback Plan
If issues arise, all files can be reverted by:
```bash
git revert <commit-hash>
```
Or manually change all instances of 47.121.27.165 back to 8.148.77.51 using:
```bash
find . -type f -name "*.js" -o -name "*.conf" -o -name "*.yml" | xargs sed -i 's/47.121.27.165/8.148.77.51/g'
```
