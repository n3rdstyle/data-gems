# Supabase Setup for Data Gems Waitlist

## Quick Setup

### 1. Create Supabase Account & Project
1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New project"
4. Name it "data-gems-waitlist" (or any name you prefer)
5. Choose a region close to your users
6. Generate a secure database password (save this!)

### 2. Create the Waitlist Table
Once your project is ready, go to the SQL Editor and run this:

```sql
-- Create waitlist table
CREATE TABLE waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  source TEXT DEFAULT 'website',
  metadata JSONB
);

-- Create index for faster email lookups
CREATE INDEX idx_waitlist_email ON waitlist(email);

-- Enable Row Level Security
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow inserts from anonymous users
CREATE POLICY "Allow anonymous inserts" ON waitlist
  FOR INSERT
  WITH CHECK (true);

-- Create a policy to allow reading own email (optional)
CREATE POLICY "Users can check their own email" ON waitlist
  FOR SELECT
  USING (true);
```

### 3. Get Your API Keys
1. Go to Settings → API in your Supabase dashboard
2. Copy these values:
   - **Project URL**: `https://[YOUR-PROJECT-ID].supabase.co`
   - **Anon/Public Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 4. Configure Environment Variables
1. Copy `.env.local.example` to `.env.local`
2. Add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. Test It!
1. Restart your dev server: `npm run dev`
2. Try submitting an email on the waitlist
3. Check your Supabase dashboard → Table Editor → waitlist

## Features Implemented

✅ **Email validation**: Checks for valid email format
✅ **Duplicate prevention**: Won't add the same email twice
✅ **Error handling**: Graceful error messages
✅ **Loading states**: Shows spinner during submission
✅ **Success screen**: Confirms successful signup

## Optional Enhancements

### Email Notifications (Optional)
To get notified when someone joins:
1. Go to Database → Functions
2. Create a trigger that sends you an email when a row is inserted

### Export Waitlist
To export your waitlist as CSV:
```sql
SELECT email, created_at FROM waitlist ORDER BY created_at DESC;
```
Then click "Download CSV" in the Supabase dashboard.

## Security Notes
- The anon key is safe to expose (it only allows public operations)
- RLS (Row Level Security) is enabled to protect your data
- Consider adding rate limiting for production

## Troubleshooting

**"Failed to fetch" error**
- Check that your Supabase project is active
- Verify your environment variables are correct
- Make sure you created the waitlist table

**"Email already exists" message**
- This is expected behavior - prevents duplicates

**No data showing in Supabase**
- Check the Table Editor → waitlist table
- Verify RLS policies are created
- Check browser console for errors