# HelpNet 🤝

HelpNet is a community-powered peer-to-peer assistance platform. Residents can post local help requests, which are matched with skilled helpers in their neighborhood. Once a helper accepts, a secure real-time chat room opens up to coordinate details, and the seeker can review the assistance once complete.

## Key Features

- **Progressive Signup Flow**: Multi-step register forms to set up account details, select matching skills, locate neighborhoods, and upload profile pictures.
- **Dynamic Helper Matching**: Scans user profiles matching requested categories, excluding seekers, sorted by average rating, and alerts them in real-time.
- **Supabase Real-time Event Streaming**: Immediate browser alerts (toasters) and active chat message updates using Supabase's high-speed WebSocket broadcast channels.
- **Mongoose / MongoDB Atlas Data Hub**: Full database consistency with indexes for performance optimization.
- **NextAuth.js v5 Credentials Authentication**: Fast, secure login utilizing the Credentials provider and JWT session management.
- **Unsigned Cloudinary Avatar Uploader**: Handles avatar image file uploads via a secure server-side REST API proxy, with a generated-initials fallback if Cloudinary is not configured.
- **Request Expiration sweeps**: Automatic cron job that expires pending requests older than 24 hours.

---

## Tech Stack

- **Framework**: [Next.js 14 (App Router)](https://nextjs.org)
- **Database**: [MongoDB Atlas](https://www.mongodb.com/atlas/database) via [Mongoose](https://mongoosejs.com)
- **Auth**: [NextAuth.js v5 (Auth.js)](https://authjs.dev)
- **Real-time WebSockets**: [Supabase Realtime (Broadcast)](https://supabase.com/docs/guides/realtime)
- **File Storage**: [Cloudinary](https://cloudinary.com) (Server-side REST uploader)
- **Styling**: Tailwind CSS & Vanilla CSS

---

## Getting Started

### 1. Prerequisite Installations

Ensure you have [Node.js](https://nodejs.org) and `npm` installed.

```bash
npm install
```

### 2. Environment Configurations

Create a `.env.local` file in the root of your project and configure the keys based on `.env.example`:

```env
# MongoDB Connection URI (Atlas cluster)
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/helpnet

# NextAuth Configurations
# Generate a secret: `openssl rand -base64 32`
NEXTAUTH_SECRET=your_32_character_secret_key
NEXTAUTH_URL=http://localhost:3000

# Supabase Configurations (Realtime WebSockets)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_public_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Cloudinary (Unsigned Preset Uploader)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_UPLOAD_PRESET=helpnet_avatars

# Cron Sweeper Secret
CRON_SECRET=your_cron_endpoint_secret
```

### 3. Setting Up Supabase Realtime Broadcast

HelpNet uses Supabase Realtime Broadcast channels. No database tables are required in Supabase.
1. Create a free project at [Supabase](https://supabase.com).
2. Go to **Project Settings &gt; API** to copy the URL, Anon key, and Service Role key.
3. Verify that Realtime is enabled in your Supabase dashboard settings.

### 4. Setting Up Cloudinary Unsigned Uploads

1. Create a free account at [Cloudinary](https://cloudinary.com).
2. Go to **Settings &gt; Upload** and scroll down to **Upload presets**.
3. Create a new upload preset:
   - Name it exactly: `helpnet_avatars` (as configured in `.env.local`).
   - Set the Mode to **Unsigned**.
   - Set the Folder name or upload format settings as desired.
   - Save the configuration.

---

## Running Locally

To run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## Request Expiration Cron Job

Pending requests expire automatically after 24 hours. The sweep cron job is configured at `/api/cron/expire-requests` and is protected with an `Authorization: Bearer <CRON_SECRET>` header.

To trigger the sweep manually, send a GET request:

```bash
curl -X GET http://localhost:3000/api/cron/expire-requests \
  -H "Authorization: Bearer your_cron_endpoint_secret"
```

When deploying to Vercel, the cron schedule will automatically run hourly as defined in `vercel.json`.

---

## Code Quality Check (Production build)

Verify the build process compiled correctly:

```bash
npm run build
```
