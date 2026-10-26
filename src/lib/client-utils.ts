"use client";

const KEY = "roktobondhu_phone";

export function getSavedPhone(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(KEY) ?? "";
}

export function savePhone(phone: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, phone);
}
