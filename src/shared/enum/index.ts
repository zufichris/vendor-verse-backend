import { z } from "zod";
enum statusCodes {
    // 1xx: Informational
    continue = 100,
    switchingProtocols = 101,

    // 2xx: Successful
    ok = 200,
    created = 201,
    accepted = 202,
    nonAuthoritativeInfo = 203,
    noContent = 204,
    resetContent = 205,
    partialContent = 206,

    // 3xx: Redirection
    multipleChoices = 300,
    movedPermanently = 301,
    found = 302,
    seeOther = 303,
    notModified = 304,
    useProxy = 305,
    temporaryRedirect = 307,
    permanentRedirect = 308,

    // 4xx: Client Errors
    badRequest = 400,
    unauthorized = 401,
    paymentRequired = 402,
    forbidden = 403,
    notFound = 404,
    methodNotAllowed = 405,
    notAcceptable = 406,
    proxyAuthRequired = 407,
    requestTimeout = 408,
    conflict = 409,
    gone = 410,
    lengthRequired = 411,
    preconditionFailed = 412,
    payloadTooLarge = 413,
    uriTooLong = 414,
    unsupportedMediaType = 415,
    rangeNotSatisfiable = 416,
    expectationFailed = 417,

    // 5xx: Server Errors
    internalServerError = 500,
    notImplemented = 501,
    badGateway = 502,
    serviceUnavailable = 503,
    gatewayTimeout = 504,
    httpVersionNotSupported = 505,
}

export const EStatusCodes = z.nativeEnum(statusCodes)

export const ECurrency = z.enum(["USD", "EUR", "GBP", "JPY", "CFA"])

export const ELanguageCode = z.enum(["en", "es", "fr", "de", "ja"]);
