/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as booths from "../booths.js";
import type * as geolocation from "../geolocation.js";
import type * as interactions from "../interactions.js";
import type * as llm from "../llm.js";
import type * as myFunctions from "../myFunctions.js";
import type * as processInteraction from "../processInteraction.js";
import type * as reccomendations from "../reccomendations.js";
import type * as resumeParser from "../resumeParser.js";
import type * as speechToText from "../speechToText.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  booths: typeof booths;
  geolocation: typeof geolocation;
  interactions: typeof interactions;
  llm: typeof llm;
  myFunctions: typeof myFunctions;
  processInteraction: typeof processInteraction;
  reccomendations: typeof reccomendations;
  resumeParser: typeof resumeParser;
  speechToText: typeof speechToText;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
