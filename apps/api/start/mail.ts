/*
|--------------------------------------------------------------------------
| Mail
|--------------------------------------------------------------------------
|
| Sends `mail.sendLater()` through Redis rather than Adonis's default
| in-memory queue, so pending notifications survive a restart.
|
*/

import { useRedisMailMessenger } from '#services/mail_queue'

useRedisMailMessenger()
