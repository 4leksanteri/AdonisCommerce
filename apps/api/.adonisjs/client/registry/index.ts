/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'translations.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/translations/:locale',
    tokens: [{"old":"/api/translations/:locale","type":0,"val":"api","end":""},{"old":"/api/translations/:locale","type":0,"val":"translations","end":""},{"old":"/api/translations/:locale","type":1,"val":"locale","end":""}],
    types: placeholder as Registry['translations.show']['types'],
  },
  'uploads.show': {
    methods: ["GET","HEAD"],
    pattern: '/uploads/:filename',
    tokens: [{"old":"/uploads/:filename","type":0,"val":"uploads","end":""},{"old":"/uploads/:filename","type":1,"val":"filename","end":""}],
    types: placeholder as Registry['uploads.show']['types'],
  },
  'stripe_webhook': {
    methods: ["POST"],
    pattern: '/api/stripe/webhook',
    tokens: [{"old":"/api/stripe/webhook","type":0,"val":"api","end":""},{"old":"/api/stripe/webhook","type":0,"val":"stripe","end":""},{"old":"/api/stripe/webhook","type":0,"val":"webhook","end":""}],
    types: placeholder as Registry['stripe_webhook']['types'],
  },
  'storefront.exchange_rates.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/storefront/exchange-rates',
    tokens: [{"old":"/api/storefront/exchange-rates","type":0,"val":"api","end":""},{"old":"/api/storefront/exchange-rates","type":0,"val":"storefront","end":""},{"old":"/api/storefront/exchange-rates","type":0,"val":"exchange-rates","end":""}],
    types: placeholder as Registry['storefront.exchange_rates.index']['types'],
  },
  'storefront.cart.hydrate': {
    methods: ["POST"],
    pattern: '/api/storefront/cart',
    tokens: [{"old":"/api/storefront/cart","type":0,"val":"api","end":""},{"old":"/api/storefront/cart","type":0,"val":"storefront","end":""},{"old":"/api/storefront/cart","type":0,"val":"cart","end":""}],
    types: placeholder as Registry['storefront.cart.hydrate']['types'],
  },
  'storefront.storefront_orders.store': {
    methods: ["POST"],
    pattern: '/api/storefront/orders',
    tokens: [{"old":"/api/storefront/orders","type":0,"val":"api","end":""},{"old":"/api/storefront/orders","type":0,"val":"storefront","end":""},{"old":"/api/storefront/orders","type":0,"val":"orders","end":""}],
    types: placeholder as Registry['storefront.storefront_orders.store']['types'],
  },
  'storefront.storefront_orders.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/storefront/orders',
    tokens: [{"old":"/api/storefront/orders","type":0,"val":"api","end":""},{"old":"/api/storefront/orders","type":0,"val":"storefront","end":""},{"old":"/api/storefront/orders","type":0,"val":"orders","end":""}],
    types: placeholder as Registry['storefront.storefront_orders.index']['types'],
  },
  'storefront.storefront_orders.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/storefront/orders/:reference',
    tokens: [{"old":"/api/storefront/orders/:reference","type":0,"val":"api","end":""},{"old":"/api/storefront/orders/:reference","type":0,"val":"storefront","end":""},{"old":"/api/storefront/orders/:reference","type":0,"val":"orders","end":""},{"old":"/api/storefront/orders/:reference","type":1,"val":"reference","end":""}],
    types: placeholder as Registry['storefront.storefront_orders.show']['types'],
  },
  'storefront.storefront_orders.confirm_receipt': {
    methods: ["POST"],
    pattern: '/api/storefront/orders/:reference/confirm',
    tokens: [{"old":"/api/storefront/orders/:reference/confirm","type":0,"val":"api","end":""},{"old":"/api/storefront/orders/:reference/confirm","type":0,"val":"storefront","end":""},{"old":"/api/storefront/orders/:reference/confirm","type":0,"val":"orders","end":""},{"old":"/api/storefront/orders/:reference/confirm","type":1,"val":"reference","end":""},{"old":"/api/storefront/orders/:reference/confirm","type":0,"val":"confirm","end":""}],
    types: placeholder as Registry['storefront.storefront_orders.confirm_receipt']['types'],
  },
  'storefront.storefront_orders.open_dispute': {
    methods: ["POST"],
    pattern: '/api/storefront/orders/:reference/problem',
    tokens: [{"old":"/api/storefront/orders/:reference/problem","type":0,"val":"api","end":""},{"old":"/api/storefront/orders/:reference/problem","type":0,"val":"storefront","end":""},{"old":"/api/storefront/orders/:reference/problem","type":0,"val":"orders","end":""},{"old":"/api/storefront/orders/:reference/problem","type":1,"val":"reference","end":""},{"old":"/api/storefront/orders/:reference/problem","type":0,"val":"problem","end":""}],
    types: placeholder as Registry['storefront.storefront_orders.open_dispute']['types'],
  },
  'storefront.storefront_orders.withdraw_dispute': {
    methods: ["DELETE"],
    pattern: '/api/storefront/orders/:reference/problem',
    tokens: [{"old":"/api/storefront/orders/:reference/problem","type":0,"val":"api","end":""},{"old":"/api/storefront/orders/:reference/problem","type":0,"val":"storefront","end":""},{"old":"/api/storefront/orders/:reference/problem","type":0,"val":"orders","end":""},{"old":"/api/storefront/orders/:reference/problem","type":1,"val":"reference","end":""},{"old":"/api/storefront/orders/:reference/problem","type":0,"val":"problem","end":""}],
    types: placeholder as Registry['storefront.storefront_orders.withdraw_dispute']['types'],
  },
  'storefront.storefront_products.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/storefront/products',
    tokens: [{"old":"/api/storefront/products","type":0,"val":"api","end":""},{"old":"/api/storefront/products","type":0,"val":"storefront","end":""},{"old":"/api/storefront/products","type":0,"val":"products","end":""}],
    types: placeholder as Registry['storefront.storefront_products.index']['types'],
  },
  'storefront.storefront_products.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/storefront/shops/:shopSlug/products/:productSlug',
    tokens: [{"old":"/api/storefront/shops/:shopSlug/products/:productSlug","type":0,"val":"api","end":""},{"old":"/api/storefront/shops/:shopSlug/products/:productSlug","type":0,"val":"storefront","end":""},{"old":"/api/storefront/shops/:shopSlug/products/:productSlug","type":0,"val":"shops","end":""},{"old":"/api/storefront/shops/:shopSlug/products/:productSlug","type":1,"val":"shopSlug","end":""},{"old":"/api/storefront/shops/:shopSlug/products/:productSlug","type":0,"val":"products","end":""},{"old":"/api/storefront/shops/:shopSlug/products/:productSlug","type":1,"val":"productSlug","end":""}],
    types: placeholder as Registry['storefront.storefront_products.show']['types'],
  },
  'auth.registered_user.store': {
    methods: ["POST"],
    pattern: '/api/auth/register',
    tokens: [{"old":"/api/auth/register","type":0,"val":"api","end":""},{"old":"/api/auth/register","type":0,"val":"auth","end":""},{"old":"/api/auth/register","type":0,"val":"register","end":""}],
    types: placeholder as Registry['auth.registered_user.store']['types'],
  },
  'auth.access_tokens.store': {
    methods: ["POST"],
    pattern: '/api/auth/login',
    tokens: [{"old":"/api/auth/login","type":0,"val":"api","end":""},{"old":"/api/auth/login","type":0,"val":"auth","end":""},{"old":"/api/auth/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['auth.access_tokens.store']['types'],
  },
  'auth.password_reset_link.store': {
    methods: ["POST"],
    pattern: '/api/auth/forgot-password',
    tokens: [{"old":"/api/auth/forgot-password","type":0,"val":"api","end":""},{"old":"/api/auth/forgot-password","type":0,"val":"auth","end":""},{"old":"/api/auth/forgot-password","type":0,"val":"forgot-password","end":""}],
    types: placeholder as Registry['auth.password_reset_link.store']['types'],
  },
  'auth.new_password.store': {
    methods: ["POST"],
    pattern: '/api/auth/reset-password',
    tokens: [{"old":"/api/auth/reset-password","type":0,"val":"api","end":""},{"old":"/api/auth/reset-password","type":0,"val":"auth","end":""},{"old":"/api/auth/reset-password","type":0,"val":"reset-password","end":""}],
    types: placeholder as Registry['auth.new_password.store']['types'],
  },
  'auth.access_tokens.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/auth/me',
    tokens: [{"old":"/api/auth/me","type":0,"val":"api","end":""},{"old":"/api/auth/me","type":0,"val":"auth","end":""},{"old":"/api/auth/me","type":0,"val":"me","end":""}],
    types: placeholder as Registry['auth.access_tokens.show']['types'],
  },
  'auth.access_tokens.destroy': {
    methods: ["POST"],
    pattern: '/api/auth/logout',
    tokens: [{"old":"/api/auth/logout","type":0,"val":"api","end":""},{"old":"/api/auth/logout","type":0,"val":"auth","end":""},{"old":"/api/auth/logout","type":0,"val":"logout","end":""}],
    types: placeholder as Registry['auth.access_tokens.destroy']['types'],
  },
  'sellers.sellers.store': {
    methods: ["POST"],
    pattern: '/api/sellers',
    tokens: [{"old":"/api/sellers","type":0,"val":"api","end":""},{"old":"/api/sellers","type":0,"val":"sellers","end":""}],
    types: placeholder as Registry['sellers.sellers.store']['types'],
  },
  'sellers.sellers.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/sellers/me',
    tokens: [{"old":"/api/sellers/me","type":0,"val":"api","end":""},{"old":"/api/sellers/me","type":0,"val":"sellers","end":""},{"old":"/api/sellers/me","type":0,"val":"me","end":""}],
    types: placeholder as Registry['sellers.sellers.show']['types'],
  },
  'sellers.sellers.update': {
    methods: ["PATCH"],
    pattern: '/api/sellers/me',
    tokens: [{"old":"/api/sellers/me","type":0,"val":"api","end":""},{"old":"/api/sellers/me","type":0,"val":"sellers","end":""},{"old":"/api/sellers/me","type":0,"val":"me","end":""}],
    types: placeholder as Registry['sellers.sellers.update']['types'],
  },
  'sellers.stripe_connect.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/sellers/me/payouts',
    tokens: [{"old":"/api/sellers/me/payouts","type":0,"val":"api","end":""},{"old":"/api/sellers/me/payouts","type":0,"val":"sellers","end":""},{"old":"/api/sellers/me/payouts","type":0,"val":"me","end":""},{"old":"/api/sellers/me/payouts","type":0,"val":"payouts","end":""}],
    types: placeholder as Registry['sellers.stripe_connect.show']['types'],
  },
  'sellers.stripe_connect.onboarding': {
    methods: ["POST"],
    pattern: '/api/sellers/me/payouts/onboarding',
    tokens: [{"old":"/api/sellers/me/payouts/onboarding","type":0,"val":"api","end":""},{"old":"/api/sellers/me/payouts/onboarding","type":0,"val":"sellers","end":""},{"old":"/api/sellers/me/payouts/onboarding","type":0,"val":"me","end":""},{"old":"/api/sellers/me/payouts/onboarding","type":0,"val":"payouts","end":""},{"old":"/api/sellers/me/payouts/onboarding","type":0,"val":"onboarding","end":""}],
    types: placeholder as Registry['sellers.stripe_connect.onboarding']['types'],
  },
  'sellers.stripe_connect.dashboard': {
    methods: ["POST"],
    pattern: '/api/sellers/me/payouts/dashboard',
    tokens: [{"old":"/api/sellers/me/payouts/dashboard","type":0,"val":"api","end":""},{"old":"/api/sellers/me/payouts/dashboard","type":0,"val":"sellers","end":""},{"old":"/api/sellers/me/payouts/dashboard","type":0,"val":"me","end":""},{"old":"/api/sellers/me/payouts/dashboard","type":0,"val":"payouts","end":""},{"old":"/api/sellers/me/payouts/dashboard","type":0,"val":"dashboard","end":""}],
    types: placeholder as Registry['sellers.stripe_connect.dashboard']['types'],
  },
  'orders.orders.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/orders',
    tokens: [{"old":"/api/orders","type":0,"val":"api","end":""},{"old":"/api/orders","type":0,"val":"orders","end":""}],
    types: placeholder as Registry['orders.orders.index']['types'],
  },
  'orders.orders.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/orders/:id',
    tokens: [{"old":"/api/orders/:id","type":0,"val":"api","end":""},{"old":"/api/orders/:id","type":0,"val":"orders","end":""},{"old":"/api/orders/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['orders.orders.show']['types'],
  },
  'orders.orders.accept': {
    methods: ["POST"],
    pattern: '/api/orders/:id/accept',
    tokens: [{"old":"/api/orders/:id/accept","type":0,"val":"api","end":""},{"old":"/api/orders/:id/accept","type":0,"val":"orders","end":""},{"old":"/api/orders/:id/accept","type":1,"val":"id","end":""},{"old":"/api/orders/:id/accept","type":0,"val":"accept","end":""}],
    types: placeholder as Registry['orders.orders.accept']['types'],
  },
  'orders.orders.ship': {
    methods: ["POST"],
    pattern: '/api/orders/:id/ship',
    tokens: [{"old":"/api/orders/:id/ship","type":0,"val":"api","end":""},{"old":"/api/orders/:id/ship","type":0,"val":"orders","end":""},{"old":"/api/orders/:id/ship","type":1,"val":"id","end":""},{"old":"/api/orders/:id/ship","type":0,"val":"ship","end":""}],
    types: placeholder as Registry['orders.orders.ship']['types'],
  },
  'orders.orders.cancel': {
    methods: ["POST"],
    pattern: '/api/orders/:id/cancel',
    tokens: [{"old":"/api/orders/:id/cancel","type":0,"val":"api","end":""},{"old":"/api/orders/:id/cancel","type":0,"val":"orders","end":""},{"old":"/api/orders/:id/cancel","type":1,"val":"id","end":""},{"old":"/api/orders/:id/cancel","type":0,"val":"cancel","end":""}],
    types: placeholder as Registry['orders.orders.cancel']['types'],
  },
  'shippingProfiles.shipping_profiles.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/shipping-profiles',
    tokens: [{"old":"/api/shipping-profiles","type":0,"val":"api","end":""},{"old":"/api/shipping-profiles","type":0,"val":"shipping-profiles","end":""}],
    types: placeholder as Registry['shippingProfiles.shipping_profiles.index']['types'],
  },
  'shippingProfiles.shipping_profiles.store': {
    methods: ["POST"],
    pattern: '/api/shipping-profiles',
    tokens: [{"old":"/api/shipping-profiles","type":0,"val":"api","end":""},{"old":"/api/shipping-profiles","type":0,"val":"shipping-profiles","end":""}],
    types: placeholder as Registry['shippingProfiles.shipping_profiles.store']['types'],
  },
  'shippingProfiles.shipping_profiles.update': {
    methods: ["PATCH"],
    pattern: '/api/shipping-profiles/:id',
    tokens: [{"old":"/api/shipping-profiles/:id","type":0,"val":"api","end":""},{"old":"/api/shipping-profiles/:id","type":0,"val":"shipping-profiles","end":""},{"old":"/api/shipping-profiles/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['shippingProfiles.shipping_profiles.update']['types'],
  },
  'shippingProfiles.shipping_profiles.destroy': {
    methods: ["DELETE"],
    pattern: '/api/shipping-profiles/:id',
    tokens: [{"old":"/api/shipping-profiles/:id","type":0,"val":"api","end":""},{"old":"/api/shipping-profiles/:id","type":0,"val":"shipping-profiles","end":""},{"old":"/api/shipping-profiles/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['shippingProfiles.shipping_profiles.destroy']['types'],
  },
  'products.products.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/products',
    tokens: [{"old":"/api/products","type":0,"val":"api","end":""},{"old":"/api/products","type":0,"val":"products","end":""}],
    types: placeholder as Registry['products.products.index']['types'],
  },
  'products.products.store': {
    methods: ["POST"],
    pattern: '/api/products',
    tokens: [{"old":"/api/products","type":0,"val":"api","end":""},{"old":"/api/products","type":0,"val":"products","end":""}],
    types: placeholder as Registry['products.products.store']['types'],
  },
  'products.products.store_draft': {
    methods: ["POST"],
    pattern: '/api/products/draft',
    tokens: [{"old":"/api/products/draft","type":0,"val":"api","end":""},{"old":"/api/products/draft","type":0,"val":"products","end":""},{"old":"/api/products/draft","type":0,"val":"draft","end":""}],
    types: placeholder as Registry['products.products.store_draft']['types'],
  },
  'products.products.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/products/:id',
    tokens: [{"old":"/api/products/:id","type":0,"val":"api","end":""},{"old":"/api/products/:id","type":0,"val":"products","end":""},{"old":"/api/products/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['products.products.show']['types'],
  },
  'products.products.update': {
    methods: ["PATCH"],
    pattern: '/api/products/:id',
    tokens: [{"old":"/api/products/:id","type":0,"val":"api","end":""},{"old":"/api/products/:id","type":0,"val":"products","end":""},{"old":"/api/products/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['products.products.update']['types'],
  },
  'products.product_images.store': {
    methods: ["POST"],
    pattern: '/api/products/:id/images',
    tokens: [{"old":"/api/products/:id/images","type":0,"val":"api","end":""},{"old":"/api/products/:id/images","type":0,"val":"products","end":""},{"old":"/api/products/:id/images","type":1,"val":"id","end":""},{"old":"/api/products/:id/images","type":0,"val":"images","end":""}],
    types: placeholder as Registry['products.product_images.store']['types'],
  },
  'products.product_images.destroy': {
    methods: ["DELETE"],
    pattern: '/api/products/:id/images/:imageId',
    tokens: [{"old":"/api/products/:id/images/:imageId","type":0,"val":"api","end":""},{"old":"/api/products/:id/images/:imageId","type":0,"val":"products","end":""},{"old":"/api/products/:id/images/:imageId","type":1,"val":"id","end":""},{"old":"/api/products/:id/images/:imageId","type":0,"val":"images","end":""},{"old":"/api/products/:id/images/:imageId","type":1,"val":"imageId","end":""}],
    types: placeholder as Registry['products.product_images.destroy']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
