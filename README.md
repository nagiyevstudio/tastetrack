# Taste Track - Food Tracker App (PHP + MySQL)

## Architecture
- **Frontend**: React + Vite (Port 5173)
- **Backend**: PHP (Port 80/8080)
- **Database**: MySQL

## Setup Instructions

### 1. Backend Setup
1. Make sure you have a LAMP/WAMP stack installed (e.g., XAMPP, MAMP, OpenServer).
2. Create a new MySQL database named `tastetrack`.
3. Import the file `backend/database.sql` into this database using phpMyAdmin or CLI.
4. Move the files from the `backend/` folder (`api.php` and `config.php`) to your server's web root (e.g., `htdocs/tastetrack/`).
5. Edit `config.php` to match your database credentials (user, password).
6. Configure auth in `backend/config.php`:
   - Set `$auth_password_pepper` to a long random string.
   - Add your frontend origin to `$auth_allowed_origins`.
7. In phpMyAdmin, set the app password hash (single-password login):
   - Run:
     ```sql
     UPDATE app_auth
     SET password_hash = SHA2(CONCAT('YourStrongPasswordHere', 'your-pepper-from-config.php'), 256)
     WHERE id = 1;
     ```

### 2. Frontend Setup
1. Set `VITE_API_URL` to point to your PHP `api.php`.
   - Dev example: `VITE_API_URL=http://localhost:8000/api.php`
   - Prod example (your setup): `VITE_API_URL=https://api.tt.nagiyev.com/api.php`
3. Run `npm install`.
4. Run `npm run dev`.

If the PHP server is unreachable, the app will automatically switch to **Local Mode**, saving data to the browser.

### 3. Auth Notes
- App uses cookie-based PHP sessions (`HttpOnly`, `SameSite=Strict`).
- API actions are protected except: `check`, `auth_status`, `login`, `logout`.
- Failed logins are rate-limited per IP.

### 3. PWA Icons
Put icon files into `public/pwa/` with exact names:
- `pwa-192x192.png`
- `pwa-512x512.png`
- `maskable-512x512.png`
- `apple-touch-icon.png`
