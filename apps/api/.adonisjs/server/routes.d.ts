import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'translations.show': { paramsTuple: [ParamValue]; params: {'locale': ParamValue} }
    'auth.registered_user.store': { paramsTuple?: []; params?: {} }
    'auth.access_tokens.store': { paramsTuple?: []; params?: {} }
    'auth.password_reset_link.store': { paramsTuple?: []; params?: {} }
    'auth.new_password.store': { paramsTuple?: []; params?: {} }
    'auth.access_tokens.show': { paramsTuple?: []; params?: {} }
    'auth.access_tokens.destroy': { paramsTuple?: []; params?: {} }
    'sellers.sellers.store': { paramsTuple?: []; params?: {} }
    'sellers.sellers.show': { paramsTuple?: []; params?: {} }
    'sellers.sellers.update': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'translations.show': { paramsTuple: [ParamValue]; params: {'locale': ParamValue} }
    'auth.access_tokens.show': { paramsTuple?: []; params?: {} }
    'sellers.sellers.show': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'translations.show': { paramsTuple: [ParamValue]; params: {'locale': ParamValue} }
    'auth.access_tokens.show': { paramsTuple?: []; params?: {} }
    'sellers.sellers.show': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'auth.registered_user.store': { paramsTuple?: []; params?: {} }
    'auth.access_tokens.store': { paramsTuple?: []; params?: {} }
    'auth.password_reset_link.store': { paramsTuple?: []; params?: {} }
    'auth.new_password.store': { paramsTuple?: []; params?: {} }
    'auth.access_tokens.destroy': { paramsTuple?: []; params?: {} }
    'sellers.sellers.store': { paramsTuple?: []; params?: {} }
  }
  PATCH: {
    'sellers.sellers.update': { paramsTuple?: []; params?: {} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}