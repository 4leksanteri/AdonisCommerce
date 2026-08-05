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
