/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractResponse } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'translations.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/translations/:locale'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { locale: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/translations_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/translations_controller').default['show']>>>
    }
  }
  'uploads.show': {
    methods: ["GET","HEAD"]
    pattern: '/uploads/:filename'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { filename: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/uploads_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/uploads_controller').default['show']>>>
    }
  }
  'stripe_webhook': {
    methods: ["POST"]
    pattern: '/api/stripe/webhook'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/stripe_webhook_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/stripe_webhook_controller').default['handle']>>>
    }
  }
  'storefront.exchange_rates.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/storefront/exchange-rates'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/exchange_rates_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/exchange_rates_controller').default['index']>>>
    }
  }
  'storefront.cart.hydrate': {
    methods: ["POST"]
    pattern: '/api/storefront/cart'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/cart').hydrateCartValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/cart').hydrateCartValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/cart_controller').default['hydrate']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/cart_controller').default['hydrate']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'storefront.storefront_orders.store': {
    methods: ["POST"]
    pattern: '/api/storefront/orders'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/order').createOrderValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/order').createOrderValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront_orders_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront_orders_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'storefront.storefront_orders.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/storefront/orders'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront_orders_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront_orders_controller').default['index']>>>
    }
  }
  'storefront.storefront_orders.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/storefront/orders/:reference'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { reference: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront_orders_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront_orders_controller').default['show']>>>
    }
  }
  'storefront.storefront_orders.confirm_receipt': {
    methods: ["POST"]
    pattern: '/api/storefront/orders/:reference/confirm'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { reference: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront_orders_controller').default['confirmReceipt']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront_orders_controller').default['confirmReceipt']>>>
    }
  }
  'storefront.storefront_orders.open_dispute': {
    methods: ["POST"]
    pattern: '/api/storefront/orders/:reference/problem'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/dispute').openDisputeValidator)>>
      paramsTuple: [ParamValue]
      params: { reference: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/dispute').openDisputeValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront_orders_controller').default['openDispute']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront_orders_controller').default['openDispute']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'storefront.storefront_orders.withdraw_dispute': {
    methods: ["DELETE"]
    pattern: '/api/storefront/orders/:reference/problem'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { reference: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront_orders_controller').default['withdrawDispute']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront_orders_controller').default['withdrawDispute']>>>
    }
  }
  'storefront.storefront_products.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/storefront/products'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront_products_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront_products_controller').default['index']>>>
    }
  }
  'storefront.storefront_products.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/storefront/shops/:shopSlug/products/:productSlug'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { shopSlug: ParamValue; productSlug: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/storefront_products_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/storefront_products_controller').default['show']>>>
    }
  }
  'auth.registered_user.store': {
    methods: ["POST"]
    pattern: '/api/auth/register'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').registerValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').registerValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/registered_user_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/registered_user_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth.access_tokens.store': {
    methods: ["POST"]
    pattern: '/api/auth/login'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').loginValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').loginValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/access_tokens_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/access_tokens_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth.password_reset_link.store': {
    methods: ["POST"]
    pattern: '/api/auth/forgot-password'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').forgotPasswordValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').forgotPasswordValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/password_reset_link_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/password_reset_link_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth.new_password.store': {
    methods: ["POST"]
    pattern: '/api/auth/reset-password'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').resetPasswordValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').resetPasswordValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/new_password_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/new_password_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'auth.access_tokens.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/auth/me'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/access_tokens_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/access_tokens_controller').default['show']>>>
    }
  }
  'auth.access_tokens.destroy': {
    methods: ["POST"]
    pattern: '/api/auth/logout'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/access_tokens_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/access_tokens_controller').default['destroy']>>>
    }
  }
  'sellers.sellers.store': {
    methods: ["POST"]
    pattern: '/api/sellers'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/seller').becomeSellerValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/seller').becomeSellerValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/sellers_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/sellers_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'sellers.sellers.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/sellers/me'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/sellers_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/sellers_controller').default['show']>>>
    }
  }
  'sellers.sellers.update': {
    methods: ["PATCH"]
    pattern: '/api/sellers/me'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/seller').becomeSellerValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/seller').becomeSellerValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/sellers_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/sellers_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'sellers.stripe_connect.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/sellers/me/payouts'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/stripe_connect_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/stripe_connect_controller').default['show']>>>
    }
  }
  'sellers.stripe_connect.onboarding': {
    methods: ["POST"]
    pattern: '/api/sellers/me/payouts/onboarding'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/stripe_connect_controller').default['onboarding']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/stripe_connect_controller').default['onboarding']>>>
    }
  }
  'sellers.stripe_connect.dashboard': {
    methods: ["POST"]
    pattern: '/api/sellers/me/payouts/dashboard'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/stripe_connect_controller').default['dashboard']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/stripe_connect_controller').default['dashboard']>>>
    }
  }
  'orders.orders.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/orders'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['index']>>>
    }
  }
  'orders.orders.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/orders/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['show']>>>
    }
  }
  'orders.orders.accept': {
    methods: ["POST"]
    pattern: '/api/orders/:id/accept'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['accept']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['accept']>>>
    }
  }
  'orders.orders.ship': {
    methods: ["POST"]
    pattern: '/api/orders/:id/ship'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/seller_order').shipOrderValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/seller_order').shipOrderValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['ship']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['ship']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'orders.orders.cancel': {
    methods: ["POST"]
    pattern: '/api/orders/:id/cancel'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/seller_order').cancelOrderValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/seller_order').cancelOrderValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['cancel']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/orders_controller').default['cancel']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'shippingProfiles.shipping_profiles.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/shipping-profiles'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/shipping_profiles_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/shipping_profiles_controller').default['index']>>>
    }
  }
  'shippingProfiles.shipping_profiles.store': {
    methods: ["POST"]
    pattern: '/api/shipping-profiles'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/shipping_profile').shippingProfileValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/shipping_profile').shippingProfileValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/shipping_profiles_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/shipping_profiles_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'shippingProfiles.shipping_profiles.update': {
    methods: ["PATCH"]
    pattern: '/api/shipping-profiles/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/shipping_profile').shippingProfileValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/shipping_profile').shippingProfileValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/shipping_profiles_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/shipping_profiles_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'shippingProfiles.shipping_profiles.destroy': {
    methods: ["DELETE"]
    pattern: '/api/shipping-profiles/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/shipping_profiles_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/shipping_profiles_controller').default['destroy']>>>
    }
  }
  'products.products.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/products'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products_controller').default['index']>>>
    }
  }
  'products.products.store': {
    methods: ["POST"]
    pattern: '/api/products'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/product').createProductValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/product').createProductValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'products.products.store_draft': {
    methods: ["POST"]
    pattern: '/api/products/draft'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products_controller').default['storeDraft']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products_controller').default['storeDraft']>>>
    }
  }
  'products.products.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/products/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products_controller').default['show']>>>
    }
  }
  'products.products.update': {
    methods: ["PATCH"]
    pattern: '/api/products/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/product').createProductValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/product').createProductValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/products_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/products_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'products.product_images.store': {
    methods: ["POST"]
    pattern: '/api/products/:id/images'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/product_images_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/product_images_controller').default['store']>>>
    }
  }
  'products.product_images.destroy': {
    methods: ["DELETE"]
    pattern: '/api/products/:id/images/:imageId'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { id: ParamValue; imageId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/product_images_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/product_images_controller').default['destroy']>>>
    }
  }
}
