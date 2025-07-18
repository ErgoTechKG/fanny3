# HUST Research Management Platform

A comprehensive research management platform for Huazhong University of Science and Technology (HUST), built with Next.js 14, tRPC, Prisma, and NextAuth.

## 🚀 Quick Start

```bash
# 1. Clone the repository
git clone [repository-url]
cd fanny3

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# 4. Set up the database
npx prisma generate
npx prisma db push

# 5. Seed the database with test data
npm run prisma:seed

# 6. Start the development server
npm run dev
```

## 🔐 Login Credentials

The seed script creates the following test accounts. **All accounts use the password: `password123`**

### Admin Accounts (System Administrators)
- `admin1@hust.edu.cn` - password: `password123`
- `admin2@hust.edu.cn` - password: `password123`

### Secretary Accounts (Research Secretaries)
- `secretary1@hust.edu.cn` - password: `password123`
- `secretary2@hust.edu.cn` - password: `password123`
- `secretary3@hust.edu.cn` - password: `password123`
- `secretary4@hust.edu.cn` - password: `password123`
- `secretary5@hust.edu.cn` - password: `password123`

### Professor Accounts (Research Advisors)
- `professor1@hust.edu.cn` through `professor20@hust.edu.cn`
- All use password: `password123`

### Student Accounts
- `student1@hust.edu.cn` through `student100@hust.edu.cn`
- All use password: `password123`

**Note:** These are development credentials only. Never use these in production!

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI
- **Backend**: tRPC, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **Form Handling**: React Hook Form, Zod
- **Data Tables**: @tanstack/react-table
- **Charts**: Recharts
- **Rich Text**: Tiptap
- **File Uploads**: UploadThing

## 📋 Features

- **Multi-role Authentication**: Student, Professor, Secretary, and Admin roles
- **Topic Management**: Create, browse, and apply for research topics
- **Application System**: Smart matching algorithm for topic recommendations
- **Project Tracking**: Milestone management and progress reporting
- **Achievement Recording**: Track publications, patents, and awards
- **Evaluation System**: Comprehensive project evaluation workflow
- **Dashboard Analytics**: Role-specific dashboards with key metrics
- **Notification System**: Real-time updates for important events
- **File Management**: Document uploads and attachments
- **Internationalization**: Chinese/English bilingual support

## 🚦 Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run prisma:generate  # Generate Prisma client
npm run prisma:push      # Push schema changes to database
npm run prisma:seed      # Seed database with test data
npm run prisma:studio    # Open Prisma Studio

# Code Quality
npm run lint             # Run ESLint
npm run typecheck        # Run TypeScript compiler check
```

## 📁 Project Structure

```
fanny3/
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── dashboard/    # Dashboard page
│   │   ├── topics/       # Topic management pages
│   │   ├── login/        # Authentication pages
│   │   └── api/          # API routes
│   ├── components/       # React components
│   │   ├── ui/           # shadcn/ui components
│   │   └── layouts/      # Layout components
│   ├── server/           # Server-side code
│   │   └── api/          # tRPC routers
│   ├── lib/              # Utility functions
│   └── types/            # TypeScript type definitions
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Database seeding script
├── public/               # Static assets
└── .env                  # Environment variables
```

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Optional: Email (for notifications)
EMAIL_SERVER=""
EMAIL_FROM=""
```

## 🚀 Deployment

This application can be deployed on any platform that supports Next.js:

1. **Vercel** (Recommended)
   - Connect your GitHub repository
   - Configure environment variables
   - Deploy with one click

2. **Railway/Render**
   - Add PostgreSQL database
   - Configure environment variables
   - Deploy from GitHub

3. **Docker**
   - Build image: `docker build -t hust-research .`
   - Run container with environment variables

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with the Context Engineering approach
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Authentication powered by [NextAuth.js](https://next-auth.js.org/)
- Database ORM by [Prisma](https://www.prisma.io/)

---

**Note**: This is a demonstration project for educational purposes. For production use, please ensure proper security measures, data validation, and compliance with your institution's policies.