import { app } from './app';
import { prisma } from './prisma';

const PORT = process.env.PORT || 5000;

// Catch unhandled promise rejections so the process never dies unexpectedly
process.on('unhandledRejection', (reason: any) => {
  console.error('CRITICAL: Unhandled Promise Rejection detected:', reason?.stack || reason);
});

// Catch uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('CRITICAL: Uncaught Exception detected:', err?.stack || err?.message);
});

const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`Video Editing Agency Backend Server is running!`);
  console.log(`Local URL: http://localhost:${PORT}`);
  console.log(`Health Check: http://localhost:${PORT}/api/health`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`====================================================`);
});

// Graceful shutdown handling
const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    try {
      await prisma.$disconnect();
      console.log('Database disconnected.');
    } catch (e) {
      console.error('Error disconnecting database:', e);
    }
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Forced shutdown due to timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

