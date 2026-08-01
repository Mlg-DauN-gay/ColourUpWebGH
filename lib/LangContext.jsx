"use client";
import { createContext, useContext } from "react";
import { DICT } from "./i18n";

export const Lang = createContext({ L: DICT.en, lang: "en", M: (n, c) => c + n });
export const useL = () => useContext(Lang);
