import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function ensureDatabaseSeeded() {
  console.log('Seeding Video Editing Agency Management database...');

  const userCount = await prisma.user.count();
  if (userCount > 0) {
    console.log(`Database already has ${userCount} users. Preserving existing production data (skipping re-seed).`);
    return;
  }

  // Clean existing data only on initial fresh seed
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.internalNote.deleteMany({});
  await prisma.projectMessage.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.projectSubmission.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.editorProfile.deleteMany({});
  await prisma.clientProfile.deleteMany({});
  await prisma.user.deleteMany({});

  const saltRounds = 10;
  const adminPassword = await bcrypt.hash('AdminPassword123!', saltRounds);
  const editorPassword = await bcrypt.hash('EditorPass123!', saltRounds);
  const clientPassword = await bcrypt.hash('ClientPass123!', saltRounds);

  // 1. Create Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@videoagency.com',
      passwordHash: adminPassword,
      name: 'Alex Mercer (Agency Owner)',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  // 2. Create Editors
  const editor1 = await prisma.user.create({
    data: {
      email: 'editor1@videoagency.com',
      passwordHash: editorPassword,
      name: 'Liam Vance',
      role: 'EDITOR',
      status: 'ACTIVE',
      editorProfile: {
        create: {
          phone: '+1-555-010-4411',
          skills: 'Premiere Pro, After Effects, DaVinci Resolve, Color Grading, Sound Design',
          experience: '6 years of experience editing high-converting YouTube and commercial videos',
          portfolioLink: 'https://vimeo.com/liamvance-demo',
          paymentRate: 350.0,
          internalNotes: 'Top-tier editor for long-form narrative & corporate explainers. Highly reliable.',
        },
      },
    },
  });

  const editor2 = await prisma.user.create({
    data: {
      email: 'editor2@videoagency.com',
      passwordHash: editorPassword,
      name: 'Maya Chen',
      role: 'EDITOR',
      status: 'ACTIVE',
      editorProfile: {
        create: {
          phone: '+1-555-010-8833',
          skills: 'CapCut Pro, Premiere Pro, Motion Graphics, Retention Hooks, Sound FX',
          experience: '4 years specializing in high-energy Reels, TikToks and YouTube Shorts',
          portfolioLink: 'https://behance.net/mayachen-edits',
          paymentRate: 250.0,
          internalNotes: 'Fast turnaround specialist. Ideal for short-form packages and viral edits.',
        },
      },
    },
  });

  const editor3 = await prisma.user.create({
    data: {
      email: 'editor3@videoagency.com',
      passwordHash: editorPassword,
      name: 'David Ross',
      role: 'EDITOR',
      status: 'INACTIVE',
      editorProfile: {
        create: {
          phone: '+1-555-010-9922',
          skills: 'Final Cut Pro, Audio Restoration',
          experience: '3 years',
          portfolioLink: 'https://youtube.com/@davidrossedits',
          paymentRate: 200.0,
          internalNotes: 'On leave until next quarter.',
        },
      },
    },
  });

  // 3. Create Clients
  const client1 = await prisma.user.create({
    data: {
      email: 'client1@techflow.io',
      passwordHash: clientPassword,
      name: 'Sarah Jenkins',
      role: 'CLIENT',
      status: 'ACTIVE',
      clientProfile: {
        create: {
          companyName: 'TechFlow SaaS Solutions',
          phone: '+1-555-019-2834',
          notes: 'Enterprise account. Expects weekly product walkthroughs and clean Apple-style typography.',
        },
      },
    },
  });

  const client2 = await prisma.user.create({
    data: {
      email: 'client2@apexfitness.com',
      passwordHash: clientPassword,
      name: 'Marcus Brody',
      role: 'CLIENT',
      status: 'ACTIVE',
      clientProfile: {
        create: {
          companyName: 'Apex Fitness Media',
          phone: '+1-555-014-9981',
          notes: 'High-volume fitness creator. Fast-paced, punchy edits with caption animations.',
        },
      },
    },
  });

  // 4. Create Projects
  const now = new Date();
  const threeDaysAhead = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const oneWeekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

  // Project 1: In Progress
  const p1 = await prisma.project.create({
    data: {
      projectCode: 'PRJ-1001',
      title: 'AI SaaS Product Walkthrough 2026',
      description: 'Comprehensive 8-minute showcase demonstrating our new AI workflow automation features.',
      videoType: 'YouTube Explainer',
      editingRequirements: 'Clean modern cuts, zoom-ins on UI elements, custom animated callouts, sound design for clicks.',
      referenceLink: 'https://drive.google.com/drive/folders/demo-techflow-raw-assets',
      specDocUrl: 'https://docs.google.com/document/d/demo-spec-sheet-1',
      status: 'IN_PROGRESS',
      clientId: client1.id,
      editorId: editor1.id,
      clientPrice: 950.0,
      editorPayment: 380.0,
      startDate: twoDaysAgo,
      deadline: threeDaysAhead,
    },
  });

  // Payments for P1
  await prisma.payment.create({
    data: {
      projectId: p1.id,
      type: 'CLIENT_PAYMENT',
      amount: 475.0,
      paymentMethod: 'Stripe',
      paymentDate: twoDaysAgo,
      notes: '50% upfront deposit received.',
      referenceId: 'ch_stripe_987123',
    },
  });

  // Project 2: Submitted for Review
  const p2 = await prisma.project.create({
    data: {
      projectCode: 'PRJ-1002',
      title: '10 High-Retention Workout Reels Pack',
      description: 'Pack of 10 vertical short-form reels showcasing HIIT drills and high-protein meal prep.',
      videoType: 'Instagram Reels / TikTok',
      editingRequirements: 'Fast-paced, bold dynamic captions, trending audio sync, visual emojis and zooms every 2-3s.',
      referenceLink: 'https://drive.google.com/drive/folders/demo-apex-fitness-raw',
      status: 'SUBMITTED_FOR_REVIEW',
      clientId: client2.id,
      editorId: editor2.id,
      clientPrice: 650.0,
      editorPayment: 260.0,
      startDate: fiveDaysAgo,
      deadline: threeDaysAhead,
    },
  });

  // Submission for P2
  await prisma.projectSubmission.create({
    data: {
      projectId: p2.id,
      editorId: editor2.id,
      deliveryLink: 'https://drive.google.com/drive/folders/demo-reels-v1-render-maya',
      submissionMessage: 'All 10 reels edited with custom animated subtitles, sound design, and color pop. Ready for admin review!',
      version: 1,
      status: 'PENDING_REVIEW',
      submittedAt: now,
    },
  });

  // Payments for P2
  await prisma.payment.create({
    data: {
      projectId: p2.id,
      type: 'CLIENT_PAYMENT',
      amount: 650.0,
      paymentMethod: 'Bank Transfer',
      paymentDate: fiveDaysAgo,
      notes: 'Paid in full upon project booking.',
      referenceId: 'WIRE-20261028-44',
    },
  });

  // Project 3: Completed Project
  const p3 = await prisma.project.create({
    data: {
      projectCode: 'PRJ-1003',
      title: 'YouTube Documentary: The Future of Quantum Chips',
      description: '15-minute documentary covering next-gen quantum computing hardware advancements.',
      videoType: 'YouTube Documentary',
      editingRequirements: 'Cinematic color grade, custom timeline infographics, 3D title sequences, ambient orchestral mix.',
      referenceLink: 'https://drive.google.com/drive/folders/demo-quantum-footage',
      status: 'COMPLETED',
      clientId: client1.id,
      editorId: editor1.id,
      clientPrice: 1400.0,
      editorPayment: 550.0,
      startDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      deadline: twoDaysAgo,
      completedDate: twoDaysAgo,
      finalDeliveryLink: 'https://drive.google.com/drive/folders/final-approved-quantum-delivery-4k',
    },
  });

  // Submissions for P3
  await prisma.projectSubmission.create({
    data: {
      projectId: p3.id,
      editorId: editor1.id,
      deliveryLink: 'https://drive.google.com/drive/folders/final-approved-quantum-delivery-4k',
      submissionMessage: 'Final ProRes & MP4 master render uploaded with metadata tags.',
      version: 2,
      status: 'APPROVED',
      adminFeedback: 'Exceptional work Liam! Client loved the soundtrack pacing.',
      submittedAt: twoDaysAgo,
      reviewedAt: twoDaysAgo,
    },
  });

  // Payments for P3: fully paid client and editor
  await prisma.payment.create({
    data: {
      projectId: p3.id,
      type: 'CLIENT_PAYMENT',
      amount: 1400.0,
      paymentMethod: 'Stripe',
      paymentDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      notes: 'Client paid in full.',
      referenceId: 'ch_stripe_full_quantum',
    },
  });

  await prisma.payment.create({
    data: {
      projectId: p3.id,
      type: 'EDITOR_PAYMENT',
      amount: 550.0,
      paymentMethod: 'PayPal',
      paymentDate: twoDaysAgo,
      notes: 'Editor milestone payout completed upon delivery approval.',
      referenceId: 'PP-PAY-550-LIAM',
    },
  });

  // Project 4: Pending Approval (New request submitted by client)
  const p4 = await prisma.project.create({
    data: {
      projectCode: 'PRJ-1004',
      title: 'Customer Success Story: 10x ROI Case Study',
      description: 'Interview footage with client CEO + b-roll of their office operations.',
      videoType: 'Corporate Case Study',
      editingRequirements: 'Polished corporate tone, clean lower thirds, subtle royalty-free background music.',
      referenceLink: 'https://drive.google.com/drive/folders/demo-case-study-raw',
      status: 'PENDING_APPROVAL',
      clientId: client1.id,
      clientPrice: 850.0,
      editorPayment: 0.0,
      deadline: oneWeekAhead,
    },
  });

  // Project 5: Revision Required
  const p5 = await prisma.project.create({
    data: {
      projectCode: 'PRJ-1005',
      title: 'Vlog Ep. 88: High-Stakes Fitness Bootcamp Behind The Scenes',
      description: '20-minute gym event vlog covering full attendee experience.',
      videoType: 'Vlog / Lifestyle',
      editingRequirements: 'Upbeat pacing, comedic zoom cutaways, audio enhancement for outdoor wind noise.',
      referenceLink: 'https://drive.google.com/drive/folders/demo-bootcamp-vlog',
      status: 'REVISION_REQUIRED',
      clientId: client2.id,
      editorId: editor2.id,
      clientPrice: 700.0,
      editorPayment: 280.0,
      startDate: fiveDaysAgo,
      deadline: threeDaysAhead,
    },
  });

  await prisma.projectSubmission.create({
    data: {
      projectId: p5.id,
      editorId: editor2.id,
      deliveryLink: 'https://drive.google.com/drive/folders/demo-bootcamp-v1-draft',
      submissionMessage: 'Initial draft v1 ready for review.',
      version: 1,
      status: 'REVISION_REQUESTED',
      adminFeedback: 'Please fix audio levels at 04:30 - speech is muffled. Also tighten intro by 15 seconds.',
      submittedAt: twoDaysAgo,
      reviewedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    },
  });

  // Internal Notes (Admin only)
  await prisma.internalNote.create({
    data: {
      projectId: p1.id,
      authorId: admin.id,
      content: 'Client requested rush delivery if possible. Offered +$100 bonus if delivered 1 day early.',
    },
  });

  // Project Messages (Admin-mediated communication)
  // Admin <-> Client
  await prisma.projectMessage.create({
    data: {
      projectId: p1.id,
      senderId: client1.id,
      senderRole: 'CLIENT',
      audience: 'ADMIN_CLIENT',
      message: 'Hi Alex! We just uploaded an updated brand asset folder with our 2026 vector logos.',
    },
  });

  await prisma.projectMessage.create({
    data: {
      projectId: p1.id,
      senderId: admin.id,
      senderRole: 'ADMIN',
      audience: 'ADMIN_CLIENT',
      message: 'Received Sarah! Our editing team is incorporating the 2026 vector logos now.',
    },
  });

  // Admin <-> Editor (Notice: no client email or direct info is in here)
  await prisma.projectMessage.create({
    data: {
      projectId: p1.id,
      senderId: admin.id,
      senderRole: 'ADMIN',
      audience: 'ADMIN_EDITOR',
      message: 'Liam, note that the logo in the raw assets has been updated to the 2026 vector pack. Please use that for all lower-thirds.',
    },
  });

  await prisma.projectMessage.create({
    data: {
      projectId: p1.id,
      senderId: editor1.id,
      senderRole: 'EDITOR',
      audience: 'ADMIN_EDITOR',
      message: 'Understood Alex. I have imported the vector assets and timeline is 60% complete.',
    },
  });

  // Notifications
  await prisma.notification.create({
    data: {
      userId: admin.id,
      title: 'New Project Submission',
      message: 'Maya Chen submitted work for PRJ-1002 (10 High-Retention Workout Reels Pack).',
      link: '/admin/projects',
      type: 'WORK_SUBMITTED',
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: admin.id,
      title: 'New Client Project Request',
      message: 'Sarah Jenkins requested approval for PRJ-1004 (Customer Success Story: 10x ROI Case Study).',
      link: '/admin/projects',
      type: 'PROJECT_REQUEST',
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: editor2.id,
      title: 'Revision Requested',
      message: 'Admin requested revisions for PRJ-1005 (Vlog Ep. 88). Check feedback.',
      link: '/editor/projects',
      type: 'REVISION_REQUESTED',
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: client1.id,
      title: 'Project Completed & Delivered',
      message: 'Your project PRJ-1003 (Quantum Chips Documentary) is ready for download!',
      link: '/client/projects',
      type: 'PROJECT_COMPLETED',
      isRead: false,
    },
  });

  // Audit Logs
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'PROJECT_ASSIGNED',
      entity: 'PROJECT',
      entityId: p1.id,
      details: 'Assigned project PRJ-1001 to editor Liam Vance with agreed payout $380.',
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'PAYMENT_RECORDED',
      entity: 'PAYMENT',
      entityId: p1.id,
      details: 'Recorded client deposit of $475 via Stripe.',
    },
  });

  console.log('Seed completed successfully!');
  console.log('--------------------------------------------------');
  console.log('Default Accounts:');
  console.log('Admin:  admin@videoagency.com  / AdminPassword123!');
  console.log('Editor: editor1@videoagency.com / EditorPass123!');
  console.log('Editor: editor2@videoagency.com / EditorPass123!');
  console.log('Client: client1@techflow.io    / ClientPass123!');
  console.log('Client: client2@apexfitness.com / ClientPass123!');
  console.log('--------------------------------------------------');
}

if (require.main === module) {
  ensureDatabaseSeeded()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

