/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  translations: {
    show: typeof routes['translations.show']
  }
  auth: {
    registeredUser: {
      store: typeof routes['auth.registered_user.store']
    }
    accessTokens: {
      store: typeof routes['auth.access_tokens.store']
      show: typeof routes['auth.access_tokens.show']
      destroy: typeof routes['auth.access_tokens.destroy']
    }
    passwordResetLink: {
      store: typeof routes['auth.password_reset_link.store']
    }
    newPassword: {
      store: typeof routes['auth.new_password.store']
    }
  }
  sellers: {
    sellers: {
      store: typeof routes['sellers.sellers.store']
      show: typeof routes['sellers.sellers.show']
      update: typeof routes['sellers.sellers.update']
    }
  }
  products: {
    products: {
      index: typeof routes['products.products.index']
      store: typeof routes['products.products.store']
    }
  }
}
