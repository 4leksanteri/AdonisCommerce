import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'auth.registered_user.store': { paramsTuple?: []; params?: {} }
    'auth.access_tokens.store': { paramsTuple?: []; params?: {} }
    'auth.access_tokens.show': { paramsTuple?: []; params?: {} }
    'auth.access_tokens.destroy': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'auth.access_tokens.show': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'auth.access_tokens.show': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'auth.registered_user.store': { paramsTuple?: []; params?: {} }
    'auth.access_tokens.store': { paramsTuple?: []; params?: {} }
    'auth.access_tokens.destroy': { paramsTuple?: []; params?: {} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}