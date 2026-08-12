/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  translations: {
    show: typeof routes['translations.show']
  }
  categories: {
    index: typeof routes['categories.index']
    show: typeof routes['categories.show']
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
    storefrontOrders: {
      store: typeof routes['storefront.storefront_orders.store']
      index: typeof routes['storefront.storefront_orders.index']
      show: typeof routes['storefront.storefront_orders.show']
      confirmReceipt: typeof routes['storefront.storefront_orders.confirm_receipt']
      openDispute: typeof routes['storefront.storefront_orders.open_dispute']
      withdrawDispute: typeof routes['storefront.storefront_orders.withdraw_dispute']
    }
    reviews: {
      store: typeof routes['storefront.reviews.store']
      update: typeof routes['storefront.reviews.update']
    }
    storefrontProducts: {
      index: typeof routes['storefront.storefront_products.index']
      show: typeof routes['storefront.storefront_products.show']
    }
    storefrontShops: {
      show: typeof routes['storefront.storefront_shops.show']
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
  account: {
    account: {
      updateProfile: typeof routes['account.account.update_profile']
      updateEmail: typeof routes['account.account.update_email']
      updatePassword: typeof routes['account.account.update_password']
      destroy: typeof routes['account.account.destroy']
    }
  }
  sellers: {
    sellers: {
      store: typeof routes['sellers.sellers.store']
      show: typeof routes['sellers.sellers.show']
      update: typeof routes['sellers.sellers.update']
      uploadAvatar: typeof routes['sellers.sellers.upload_avatar']
      removeAvatar: typeof routes['sellers.sellers.remove_avatar']
    }
    stripeConnect: {
      show: typeof routes['sellers.stripe_connect.show']
      onboarding: typeof routes['sellers.stripe_connect.onboarding']
      dashboard: typeof routes['sellers.stripe_connect.dashboard']
    }
  }
  orders: {
    orders: {
      index: typeof routes['orders.orders.index']
      stats: typeof routes['orders.orders.stats']
      show: typeof routes['orders.orders.show']
      accept: typeof routes['orders.orders.accept']
      ship: typeof routes['orders.orders.ship']
      cancel: typeof routes['orders.orders.cancel']
    }
  }
  conversations: {
    conversations: {
      index: typeof routes['conversations.conversations.index']
      store: typeof routes['conversations.conversations.store']
      unread: typeof routes['conversations.conversations.unread']
      show: typeof routes['conversations.conversations.show']
      storeMessage: typeof routes['conversations.conversations.store_message']
    }
  }
  orderMessages: {
    orderMessages: {
      index: typeof routes['orderMessages.order_messages.index']
      store: typeof routes['orderMessages.order_messages.store']
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
  staff: {
    staffOverview: {
      show: typeof routes['staff.staff_overview.show']
    }
    staffDisputes: {
      index: typeof routes['staff.staff_disputes.index']
      show: typeof routes['staff.staff_disputes.show']
      refund: typeof routes['staff.staff_disputes.refund']
      release: typeof routes['staff.staff_disputes.release']
    }
  }
  admin: {
    adminOverview: {
      show: typeof routes['admin.admin_overview.show']
    }
    adminUsers: {
      index: typeof routes['admin.admin_users.index']
      setRole: typeof routes['admin.admin_users.set_role']
    }
    adminCategories: {
      index: typeof routes['admin.admin_categories.index']
      store: typeof routes['admin.admin_categories.store']
      update: typeof routes['admin.admin_categories.update']
    }
  }
}
