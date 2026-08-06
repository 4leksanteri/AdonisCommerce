import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'translations.show': { paramsTuple: [ParamValue]; params: {'locale': ParamValue} }
    'uploads.show': { paramsTuple: [ParamValue]; params: {'filename': ParamValue} }
    'storefront.exchange_rates.index': { paramsTuple?: []; params?: {} }
    'storefront.storefront_products.index': { paramsTuple?: []; params?: {} }
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
    'storefront.storefront_products.index': { paramsTuple?: []; params?: {} }
    'storefront.storefront_products.show': { paramsTuple: [ParamValue,ParamValue]; params: {'shopSlug': ParamValue,'productSlug': ParamValue} }
    'auth.access_tokens.show': { paramsTuple?: []; params?: {} }
    'sellers.sellers.show': { paramsTuple?: []; params?: {} }
    'products.products.index': { paramsTuple?: []; params?: {} }
    'products.products.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  HEAD: {
    'translations.show': { paramsTuple: [ParamValue]; params: {'locale': ParamValue} }
    'uploads.show': { paramsTuple: [ParamValue]; params: {'filename': ParamValue} }
    'storefront.exchange_rates.index': { paramsTuple?: []; params?: {} }
    'storefront.storefront_products.index': { paramsTuple?: []; params?: {} }
    'storefront.storefront_products.show': { paramsTuple: [ParamValue,ParamValue]; params: {'shopSlug': ParamValue,'productSlug': ParamValue} }
    'auth.access_tokens.show': { paramsTuple?: []; params?: {} }
    'sellers.sellers.show': { paramsTuple?: []; params?: {} }
    'products.products.index': { paramsTuple?: []; params?: {} }
    'products.products.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  POST: {
    'auth.registered_user.store': { paramsTuple?: []; params?: {} }
    'auth.access_tokens.store': { paramsTuple?: []; params?: {} }
    'auth.password_reset_link.store': { paramsTuple?: []; params?: {} }
    'auth.new_password.store': { paramsTuple?: []; params?: {} }
    'auth.access_tokens.destroy': { paramsTuple?: []; params?: {} }
    'sellers.sellers.store': { paramsTuple?: []; params?: {} }
    'products.products.store': { paramsTuple?: []; params?: {} }
    'products.products.store_draft': { paramsTuple?: []; params?: {} }
    'products.product_images.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PATCH: {
    'sellers.sellers.update': { paramsTuple?: []; params?: {} }
    'products.products.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'products.product_images.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'imageId': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}