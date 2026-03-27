# Campus Whisper - Setup Guide

## 1. Firebase Project Setup

### Create a Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Enter "Campus Whisper" as the project name
4. Accept terms and create the project

### Enable Authentication
1. Go to **Build > Authentication**
2. Click **Get started**
3. Enable these sign-in providers:
   - **Anonymous** (for anonymous users)
   - **Google** (for authenticated users)

For Google sign-in:
- Click on Google provider
- Set it to Enabled
- Add your domain to the authorized domains (e.g., localhost:3000 for local testing)

### Create Firestore Database
1. Go to **Build > Firestore Database**
2. Click **Create database**
3. Start in **Production mode**
4. Choose your region (closest to your location)

### Get Your Firebase Config
1. Go to **Project Settings** (⚙️ icon)
2. Scroll to "Your apps" section
3. Click the Web app (</> icon)
4. Copy the Firebase config object

## 2. Environment Variables Setup

Add these variables to your v0 project **Vars** section:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_ADMIN_UIDS=admin_uid_1,admin_uid_2
```

## 3. Firestore Security Rules

This is CRITICAL for the app to work!

1. Go to **Firestore Database > Rules**
2. Replace all existing rules with the content from `FIRESTORE_RULES.txt` in this project
3. Click **Publish**

The rules allow:
- Anyone to read posts and comments
- Authenticated users to create content and vote
- Users can only delete their own content
- Admins can manage reports

## 4. Getting Admin UIDs

To set up admin access:
1. Have a user create a post or comment
2. Go to **Authentication** in Firebase Console
3. Click on the user
4. Copy the **User UID**
5. Add it to `NEXT_PUBLIC_ADMIN_UIDS` in your environment variables
6. Separate multiple UIDs with commas: `uid1,uid2,uid3`

## 5. Test the App

1. Open the app at `http://localhost:3000`
2. Click "Sign In" → "Continue with Google" or "Continue Anonymously"
3. Try creating a post
4. Try creating comments and voting
5. Try reporting content

## Features

✅ Anonymous & Google authentication
✅ Create posts with categories
✅ Comment with nested replies
✅ Upvote/downvote posts and comments
✅ Report inappropriate content
✅ Admin dashboard for report management
✅ Search posts by content
✅ Filter by categories
✅ Light/Dark mode toggle

## Troubleshooting

### "Missing or insufficient permissions" errors
- Make sure you published the Firestore rules from `FIRESTORE_RULES.txt`
- Verify your Firebase credentials are correct in environment variables

### Comments not loading
- Ensure Firestore rules are published
- Check that you're signed in (anonymous or with Google)

### Voting not working
- Same as above - check Firestore rules

### Google sign-in not working
- Add your domain to authorized domains in Firebase console
- Ensure Google provider is enabled in Authentication settings

## Development Notes

- The app uses anonymous authentication as fallback
- All data is stored in Firestore with row-level security
- Admin status is checked via hardcoded UIDs in environment variables
- Votes are tracked in subcollections of posts
- Comments can have nested replies (2 levels deep)
