# Connect LearnIQ to Local PostgreSQL (Windows)

You have **PostgreSQL 18** installed. The error `P1000: Authentication failed` means the user `learniq` does not exist yet (or the password is wrong).

## Method 1 — Automated script (recommended)

1. Open **PowerShell** in `backend\scripts`:
   ```powershell
   cd "c:\New folder (3)\backend\scripts"
   .\setup-local-db.ps1
   ```
2. When prompted, enter the password you chose for the **`postgres`** user during PostgreSQL installation.
3. Then run:
   ```powershell
   cd "c:\New folder (3)\backend"
   npx prisma db push
   npm run db:seed
   ```

## Method 2 — pgAdmin (GUI)

1. Open **pgAdmin 4** (installed with PostgreSQL).
2. Connect to your local server (password = your `postgres` user password).
3. Right-click **Login/Group Roles** → **Create** → **Login/Group Role**
   - Name: `learniq`
   - Definition tab → Password: `learniq_secret`
   - Privileges → Can login: Yes
4. Right-click **Databases** → **Create** → **Database**
   - Name: `learniq`
   - Owner: `learniq`
5. Run Prisma from terminal:
   ```powershell
   cd "c:\New folder (3)\backend"
   npx prisma db push
   npm run db:seed
   ```

## Method 3 — Use your existing `postgres` user

If you prefer not to create `learniq`, edit `backend\.env`:

```env
DATABASE_URL="postgresql://neondb_owner:npg_7lRWO6zocHPr@ep-polished-cell-aos3f4sn-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

Create only the database in pgAdmin or SQL Shell:

```sql
CREATE DATABASE learniq;
```

Then:

```powershell
npx prisma db push
npm run db:seed
```

## Verify connection

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U learniq -h localhost -d learniq -c "SELECT 1;"
```

Password when prompted: `learniq_secret`

## Run the app

**Terminal 1 — API:**
```powershell
cd "c:\New folder (3)\backend"
npm run dev
```

**Terminal 2 — Frontend:**
```powershell
cd "c:\New folder (3)\frontend"
npm run dev
```

Login: `student@learniq.com` / `password123`
