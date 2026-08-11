import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'translations.show': { paramsTuple: [ParamValue]; params: {'locale': ParamValue} }
    'uploads.show': { paramsTuple: [ParamValue]; params: {'filename': ParamValue} }
    'stripe_webhook': { paramsTuple?: []; params?: {} }
    'storefront.exchange_rates.index': { paramsTuple?: []; params?: {} }
    'storefront.cart.hydrate': { paramsTuple?: []; params?: {} }
    'storefront.storefront_orders.store': { paramsTuple?: []; params?: {} }
    'storefront.storefront_orders.index': { paramsTuple?: []; params?: {} }
    'storefront.storefront_orders.show': { paramsTuple: [ParamValue]; params: {'reference': ParamValue} }
    'storefront.storefront_orders.confirm_receipt': { paramsTuple: [ParamValue]; params: {'reference': ParamValue} }
    'storefront.storefront_orders.open_dispute': { paramsTuple: [ParamValue]; params: {'reference': ParamValue} }
    'storefront.storefront_orders.withdraw_dispute': { paramsTuple: [ParamValue]; params: {'reference': ParamValue} }
    'storefront.reviews.store': { paramsTuple?: []; params?: {} }
    'storefront.reviews.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'storefront.storefront_products.index': { paramsTuple?: []; params?: {} }
    'storefront.storefront_shops.show': { paramsTuple: [ParamValue]; params: {'shopSlug': ParamValue} }
    'storefront.storefront_products.show': { paramsTuple: [ParamValue,ParamValue]; params: {'shopSlug': ParamValue,'productSlug': ParamValue} }
    'auth.registered_user.store': { paramsTuple?: []; params?: {} }
    'auth.access_tokens.store': { paramsTuple?: []; params?: {} }
    'auth.password_reset_link.store': { paramsTuple?: []; params?: {} }
    'auth.new_password.store': { paramsTuple?: []; params?: {} }
    'auth.access_tokens.show': { paramsTuple?: []; params?: {} }
    'auth.access_tokens.destroy': { paramsTuple?: []; params?: {} }
    'sellers.sellers.store': { paramsTuple?: []; params?: {} }
    'sellers.sellers.show': { paramsTuple?: []; params?: {} }
    'sellers.sellers.update': { paramsTuple?: []; params?: {} }
    'sellers.sellers.upload_avatar': { paramsTuple?: []; params?: {} }
    'sellers.sellers.remove_avatar': { paramsTuple?: []; params?: {} }
    'sellers.stripe_connect.show': { paramsTuple?: []; params?: {} }
    'sellers.stripe_connect.onboarding': { paramsTuple?: []; params?: {} }
    'sellers.stripe_connect.dashboard': { paramsTuple?: []; params?: {} }
    'orders.orders.index': { paramsTuple?: []; params?: {} }
    'orders.orders.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orders.orders.accept': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orders.orders.ship': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orders.orders.cancel': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shippingProfiles.shipping_profiles.index': { paramsTuple?: []; params?: {} }
    'shippingProfiles.shipping_profiles.store': { paramsTuple?: []; params?: {} }
    'shippingProfiles.shipping_profiles.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shippingProfiles.shipping_profiles.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'products.products.index': { paramsTuple?: []; params?: {} }
    'products.products.store': { paramsTuple?: []; params?: {} }
    'products.products.store_draft': { paramsTuple?: []; params?: {} }
    'products.products.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'products.products.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'products.product_images.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'products.product_images.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'imageId': ParamValue} }
  }
  GET: {
    'translations.show': { paramsTuple: [ParamValue]; params: {'locale': ParamValue} }
    'uploads.show': { paramsTuple: [ParamValue]; params: {'filename': ParamValue} }
    'storefront.exchange_rates.index': { paramsTuple?: []; params?: {} }
    'storefront.storefront_orders.index': { paramsTuple?: []; params?: {} }
    'storefront.storefront_orders.show': { paramsTuple: [ParamValue]; params: {'reference': ParamValue} }
    'storefront.storefront_products.index': { paramsTuple?: []; params?: {} }
    'storefront.storefront_shops.show': { paramsTuple: [ParamValue]; params: {'shopSlug': ParamValue} }
    'storefront.storefront_products.show': { paramsTuple: [ParamValue,ParamValue]; params: {'shopSlug': ParamValue,'productSlug': ParamValue} }
    'auth.access_tokens.show': { paramsTuple?: []; params?: {} }
    'sellers.sellers.show': { paramsTuple?: []; params?: {} }
    'sellers.stripe_connect.show': { paramsTuple?: []; params?: {} }
    'orders.orders.index': { paramsTuple?: []; params?: {} }
    'orders.orders.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shippingProfiles.shipping_profiles.index': { paramsTuple?: []; params?: {} }
    'products.products.index': { paramsTuple?: []; params?: {} }
    'products.products.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  HEAD: {
    'translations.show': { paramsTuple: [ParamValue]; params: {'locale': ParamValue} }
    'uploads.show': { paramsTuple: [ParamValue]; params: {'filename': ParamValue} }
    'storefront.exchange_rates.index': { paramsTuple?: []; params?: {} }
    'storefront.storefront_orders.index': { paramsTuple?: []; params?: {} }
    'storefront.storefront_orders.show': { paramsTuple: [ParamValue]; params: {'reference': ParamValue} }
    'storefront.storefront_products.index': { paramsTuple?: []; params?: {} }
    'storefront.storefront_shops.show': { paramsTuple: [ParamValue]; params: {'shopSlug': ParamValue} }
    'storefront.storefront_products.show': { paramsTuple: [ParamValue,ParamValue]; params: {'shopSlug': ParamValue,'productSlug': ParamValue} }
    'auth.access_tokens.show': { paramsTuple?: []; params?: {} }
    'sellers.sellers.show': { paramsTuple?: []; params?: {} }
    'sellers.stripe_connect.show': { paramsTuple?: []; params?: {} }
    'orders.orders.index': { paramsTuple?: []; params?: {} }
    'orders.orders.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shippingProfiles.shipping_profiles.index': { paramsTuple?: []; params?: {} }
    'products.products.index': { paramsTuple?: []; params?: {} }
    'products.products.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  POST: {
    'stripe_webhook': { paramsTuple?: []; params?: {} }
    'storefront.cart.hydrate': { paramsTuple?: []; params?: {} }
    'storefront.storefront_orders.store': { paramsTuple?: []; params?: {} }
    'storefront.storefront_orders.confirm_receipt': { paramsTuple: [ParamValue]; params: {'reference': ParamValue} }
    'storefront.storefront_orders.open_dispute': { paramsTuple: [ParamValue]; params: {'reference': ParamValue} }
    'storefront.reviews.store': { paramsTuple?: []; params?: {} }
    'auth.registered_user.store': { paramsTuple?: []; params?: {} }
    'auth.access_tokens.store': { paramsTuple?: []; params?: {} }
    'auth.password_reset_link.store': { paramsTuple?: []; params?: {} }
    'auth.new_password.store': { paramsTuple?: []; params?: {} }
    'auth.access_tokens.destroy': { paramsTuple?: []; params?: {} }
    'sellers.sellers.store': { paramsTuple?: []; params?: {} }
    'sellers.sellers.upload_avatar': { paramsTuple?: []; params?: {} }
    'sellers.stripe_connect.onboarding': { paramsTuple?: []; params?: {} }
    'sellers.stripe_connect.dashboard': { paramsTuple?: []; params?: {} }
    'orders.orders.accept': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orders.orders.ship': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'orders.orders.cancel': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'shippingProfiles.shipping_profiles.store': { paramsTuple?: []; params?: {} }
    'products.products.store': { paramsTuple?: []; params?: {} }
    'products.products.store_draft': { paramsTuple?: []; params?: {} }
    'products.product_images.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'storefront.storefront_orders.withdraw_dispute': { paramsTuple: [ParamValue]; params: {'reference': ParamValue} }
    'sellers.sellers.remove_avatar': { paramsTuple?: []; params?: {} }
    'shippingProfiles.shipping_profiles.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'products.product_images.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'imageId': ParamValue} }
  }
  PATCH: {
    'storefront.reviews.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'sellers.sellers.update': { paramsTuple?: []; params?: {} }
    'shippingProfiles.shipping_profiles.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'products.products.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}