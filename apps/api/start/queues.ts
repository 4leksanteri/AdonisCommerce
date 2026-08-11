/*
|--------------------------------------------------------------------------
| Queues
|--------------------------------------------------------------------------
|
| Runs on every app boot, including every ace command.
|
| Two jobs: route `mail.sendLater()` through Redis rather than Adonis's
| default in-memory queue, and make sure the BullMQ connections are closed on
| shutdown. Without the second, a queue's open Redis connection keeps the
| event loop alive and a command like `node ace migration:run` finishes its
| work and then hangs forever instead of exiting.
|
*/

import app from '@adonisjs/core/services/app'
import { useRedisMailMessenger, mailQueue } from '#services/mail_queue'
import { payoutsQueue } from '#services/queue'

useRedisMailMessenger()

app.terminating(async () => {
  await Promise.all([mailQueue.close(), payoutsQueue.close()])
})
