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
}
