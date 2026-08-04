/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  auth: {
    registeredUser: {
      store: typeof routes['auth.registered_user.store']
    }
    accessTokens: {
      store: typeof routes['auth.access_tokens.store']
      show: typeof routes['auth.access_tokens.show']
      destroy: typeof routes['auth.access_tokens.destroy']
    }
  }
}
