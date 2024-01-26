
// Imports
import * as _0_0 from "//home/user/Imagen-API/src/api/generate-image.js";
import * as configure from "@api/configure";

export const routeBase = "/api";

const internal  = [
  _0_0.default && {
        source     : "src/api/generate-image.js?fn=default",
        method     : "use",
        route      : "/generate-image",
        path       : "/api/generate-image",
        url        : "/api/generate-image",
        cb         : _0_0.default,
      },
  _0_0.GET && {
        source     : "src/api/generate-image.js?fn=GET",
        method     : "get",
        route      : "/generate-image",
        path       : "/api/generate-image",
        url        : "/api/generate-image",
        cb         : _0_0.GET,
      },
  _0_0.PUT && {
        source     : "src/api/generate-image.js?fn=PUT",
        method     : "put",
        route      : "/generate-image",
        path       : "/api/generate-image",
        url        : "/api/generate-image",
        cb         : _0_0.PUT,
      },
  _0_0.POST && {
        source     : "src/api/generate-image.js?fn=POST",
        method     : "post",
        route      : "/generate-image",
        path       : "/api/generate-image",
        url        : "/api/generate-image",
        cb         : _0_0.POST,
      },
  _0_0.PATCH && {
        source     : "src/api/generate-image.js?fn=PATCH",
        method     : "patch",
        route      : "/generate-image",
        path       : "/api/generate-image",
        url        : "/api/generate-image",
        cb         : _0_0.PATCH,
      },
  _0_0.DELETE && {
        source     : "src/api/generate-image.js?fn=DELETE",
        method     : "delete",
        route      : "/generate-image",
        path       : "/api/generate-image",
        url        : "/api/generate-image",
        cb         : _0_0.DELETE,
      }
].filter(it => it);

export const routers = internal.map((it) => {
  const { method, path, route, url, source } = it;
  return { method, url, path, route, source };
});

export const endpoints = internal.map(
  (it) => it.method?.toUpperCase() + "\t" + it.url
);

export const applyRouters = (applyRouter) => {
  internal.forEach((it) => {
    it.cb = configure.callbackBefore?.(it.cb, it) || it.cb;
    applyRouter(it);
  });
};

