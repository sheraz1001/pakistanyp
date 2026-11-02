import * as R from "react/jsx-runtime";
import { translateProps } from "./translate-props";
export const Fragment = R.Fragment;
export function jsx(type: any, props: any, key?: any) { return (R as any).jsx(type, translateProps(type, props), key); }
export function jsxs(type: any, props: any, key?: any) { return (R as any).jsxs(type, translateProps(type, props), key); }
