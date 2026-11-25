/** The visitor's translator, for code outside React (kept current by <I18nBridge>). No imports from lib/amplify. */
import { defaultT, translateError, type Tr } from "@mgl/core";

let current: Tr = defaultT;
export const currentTr = (): Tr => current;
export const setCurrentTr = (t: Tr) => {
  current = t;
};

/** A server or draw error message in the visitor's language. */
export const localizeError = (message: string) => translateError(message, current);
