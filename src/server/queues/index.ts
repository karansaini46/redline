import 'dotenv/config';
import './extractText.worker';
import './reminders.worker';
import './scoreClause.worker';

console.log('Worker process started. extractText, reminders, and scoreClause workers are listening.');

// Note: In production this must run as a separate long-lived process (e.g. a Railway/Render worker service), 
// since Vercel serverless functions can't host a persistent BullMQ worker — the reminders job should 
// instead be triggered via a Vercel Cron Job hitting an API route if deploying to Vercel.
