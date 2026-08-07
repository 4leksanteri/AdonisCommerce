/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  translations: {
    show: typeof routes['translations.show']
  }
  uploads: {
    show: typeof routes['uploads.show']
  }
  stripeWebhook: typeof routes['stripe_webhook']
  storefront: {
    exchangeRates: {
      index: typeof routes['storefront.exchange_rates.index']
    }
    cart: {
      hydrate: typeof routes['storefront.cart.hydrate']
    }
    orders: {
      store: typeof routes['storefront.orders.store']
      show: typeof routes['storefront.orders.show']
    }
    storefrontProducts: {
      index: typeof routes['storefront.storefront_products.index']
      show: typeof routes['storefront.storefront_products.show']
    }
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
    stripeConnect: {
      show: typeof routes['sellers.stripe_connect.show']
      onboarding: typeof routes['sellers.stripe_connect.onboarding']
      dashboard: typeof routes['sellers.stripe_connect.dashboard']
    }
  }
  shippingProfiles: {
    shippingProfiles: {
      index: typeof routes['shippingProfiles.shipping_profiles.index']
      store: typeof routes['shippingProfiles.shipping_profiles.store']
      update: typeof routes['shippingProfiles.shipping_profiles.update']
      destroy: typeof routes['shippingProfiles.shipping_profiles.destroy']
    }
  }
  products: {
    products: {
      index: typeof routes['products.products.index']
      store: typeof routes['products.products.store']
      storeDraft: typeof routes['products.products.store_draft']
      show: typeof routes['products.products.show']
      update: typeof routes['products.products.update']
    }
    productImages: {
      store: typeof routes['products.product_images.store']
      destroy: typeof routes['products.product_images.destroy']
    }
  }
}
