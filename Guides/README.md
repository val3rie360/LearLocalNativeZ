# LearnLocal Native - Documentation Guides

This folder contains all setup and implementation guides for the LearnLocal Native application.

## 📚 Guide Index

### 🚀 Quick Start
- **[POCKETBASE_QUICKSTART.md](./POCKETBASE_QUICKSTART.md)** - 5-minute PocketBase setup
  - Install PocketBase
  - Create collections
  - Test connection

### 🔧 Setup Guides

#### Firebase Setup
- **[FIRESTORE_SECURITY_SETUP.md](./FIRESTORE_SECURITY_SETUP.md)** - Deploy Firestore security rules
  - Security rules explanation
  - Deployment instructions
  - Troubleshooting

- **[FIRESTORE_INDEX_FIX.md](./FIRESTORE_INDEX_FIX.md)** - Fix index errors
  - Create composite indexes
  - Performance optimization
  - Common index patterns

#### PocketBase Setup
- **[POCKETBASE_INTEGRATION.md](./POCKETBASE_INTEGRATION.md)** - Integration overview
  - Hybrid architecture
  - Design decisions
  - Authentication strategy

- **[POCKETBASE_SETUP_GUIDE.md](./POCKETBASE_SETUP_GUIDE.md)** - Detailed setup
  - Collection schema
  - API rules configuration
  - Production deployment

#### Social Authentication
- **[SOCIAL_AUTH_SETUP.md](./SOCIAL_AUTH_SETUP.md)** - Google & Facebook login
  - OAuth configuration
  - Firebase setup
  - Testing

### 🏗️ Architecture & Systems

- **[OPPORTUNITIES_SYSTEM.md](./OPPORTUNITIES_SYSTEM.md)** - Hybrid opportunities model
  - Two-collection strategy
  - CRUD operations
  - Best practices

- **[DEADLINE_TRACKING_SYSTEM.md](./DEADLINE_TRACKING_SYSTEM.md)** - Student deadline tracking ⭐ NEW
  - Opportunity registration
  - Calendar integration
  - Urgency-based sorting
  - API reference

- **[LIBRARY_SYSTEM.md](./LIBRARY_SYSTEM.md)** - Educational resources library
  - Bookmark management
  - Resource organization
  - Student access

- **[ORG_UPLOADS_PLAN.md](./ORG_UPLOADS_PLAN.md)** - Upload system plan
  - Complete implementation plan
  - Phase breakdown
  - Timeline estimates

### 🐛 Troubleshooting

- **[WEB_COMPATIBILITY_GUIDE.md](./WEB_COMPATIBILITY_GUIDE.md)** - Fix web errors
  - react-native-maps web issue
  - Platform-specific components
  - Testing

- **[PHASE1_DEPLOYMENT.md](./PHASE1_DEPLOYMENT.md)** - Backend deployment
  - Deploy rules and indexes
  - Verification steps
  - Common issues

## 🎯 Getting Started Path

### For New Developers

1. **Start Here:** [POCKETBASE_QUICKSTART.md](./POCKETBASE_QUICKSTART.md)
2. **Then:** [FIRESTORE_SECURITY_SETUP.md](./FIRESTORE_SECURITY_SETUP.md)
3. **If errors:** [FIRESTORE_INDEX_FIX.md](./FIRESTORE_INDEX_FIX.md)
4. **Web issues?** [WEB_COMPATIBILITY_GUIDE.md](./WEB_COMPATIBILITY_GUIDE.md)

### For Understanding Architecture

1. [OPPORTUNITIES_SYSTEM.md](./OPPORTUNITIES_SYSTEM.md) - How data is structured
2. [DEADLINE_TRACKING_SYSTEM.md](./DEADLINE_TRACKING_SYSTEM.md) - How students track deadlines
3. [LIBRARY_SYSTEM.md](./LIBRARY_SYSTEM.md) - Resource management system
4. [POCKETBASE_INTEGRATION.md](./POCKETBASE_INTEGRATION.md) - File storage architecture
5. [ORG_UPLOADS_PLAN.md](./ORG_UPLOADS_PLAN.md) - Upload feature plan

### For Production Deployment

1. [FIRESTORE_SECURITY_SETUP.md](./FIRESTORE_SECURITY_SETUP.md) - Deploy Firestore rules
2. [FIRESTORE_INDEX_FIX.md](./FIRESTORE_INDEX_FIX.md) - Create indexes
3. [POCKETBASE_SETUP_GUIDE.md](./POCKETBASE_SETUP_GUIDE.md) - Deploy PocketBase
4. [PHASE1_DEPLOYMENT.md](./PHASE1_DEPLOYMENT.md) - Backend checklist

## 📋 Setup Checklist

### Initial Setup
- [ ] Install dependencies: `npm install`
- [ ] Install PocketBase SDK: `npm install pocketbase`
- [ ] Download PocketBase server
- [ ] Create `.env` file with PocketBase URL
- [ ] Run PocketBase: `pocketbase serve`
- [ ] Create admin account
- [ ] Import collections schema

### Firebase Setup
- [ ] Deploy Firestore rules
- [ ] Deploy Storage rules (optional - if not using PocketBase)
- [ ] Create Firestore indexes
- [ ] Test authentication

### PocketBase Setup
- [ ] Create `uploads` collection
- [ ] Configure API rules
- [ ] Test file upload
- [ ] Test file download

### Social Auth Setup (Optional)
- [ ] Configure Google OAuth
- [ ] Configure Facebook OAuth
- [ ] Test social logins

### Testing
- [ ] Create opportunity (Firebase)
- [ ] Upload PDF (PocketBase)
- [ ] Edit opportunity
- [ ] Delete opportunity
- [ ] Download PDF
- [ ] Test on web
- [ ] Test on iOS
- [ ] Test on Android

## 🛠️ Technologies

### Frontend
- React Native (Expo)
- NativeWind (Tailwind CSS)
- Expo Router (Navigation)

### Backend
- Firebase (Auth, Firestore)
- PocketBase (File Storage)
- Hybrid architecture

### Key Libraries
- `firebase` - Authentication & database
- `pocketbase` - File storage
- `expo-document-picker` - File selection
- `react-native-maps` - Location features

## 📞 Support

### Documentation Links
- [Firebase Docs](https://firebase.google.com/docs)
- [PocketBase Docs](https://pocketbase.io/docs/)
- [Expo Docs](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)

### Common Issues
- **Permission errors** → Check Firestore/Storage rules
- **Index errors** → Create composite indexes
- **Connection errors** → Verify PocketBase is running
- **Upload errors** → Check file type and size

## 🔄 Update Log

### Latest Updates
- ✅ **Deadline Tracking System** - Students can register to track opportunity deadlines
- ✅ **Calendar Integration** - Visual calendar with urgency-based sorting
- ✅ **Library System** - Bookmark and manage educational resources
- ✅ PocketBase integration for file storage
- ✅ Hybrid opportunities system
- ✅ Edit functionality for all fields
- ✅ Web compatibility fixes
- ✅ Auto-refresh on tab focus

### Upcoming Features
- 📋 Push notifications for deadline reminders
- 📋 Calendar export (Google Calendar, iCal)
- 📋 Phase 2: Upload UI implementation
- 📋 Student resource browser enhancements
- 📋 Analytics dashboard
- 📋 Progress tracking for milestones

## 📖 Contributing

When adding new features:
1. Create implementation plan
2. Document in appropriate guide
3. Update this README
4. Test thoroughly
5. Update checklist

---

**All guides are in the `/Guides` folder for easy reference!** 📚

**Questions?** Check the specific guide or create an issue.

**Ready to build?** Start with [POCKETBASE_QUICKSTART.md](./POCKETBASE_QUICKSTART.md)! 🚀




