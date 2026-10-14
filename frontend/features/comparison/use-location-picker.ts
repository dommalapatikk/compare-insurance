"use client";

import { useEffect, useState } from "react";

import { searchLocations } from "./comparison-api";
import type { LocationSuggestion } from "./types";

export function normalizePostcode(value: string) {
  return value.replace(/\D/g, "").slice(0, 4);
}

export function useLocationPicker() {
  const [locationQuery, setLocationQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<LocationSuggestion | null>(null);
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [locationNotice, setLocationNotice] = useState("");
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [activeLocationIndex, setActiveLocationIndex] = useState(-1);

  useEffect(() => {
    const query = locationQuery.trim();
    if (!/^\d{4}$/.test(query) || selectedLocation?.postal_code === query) {
      setLocationSuggestions([]);
      setActiveLocationIndex(-1);
      setLocationNotice("");
      setIsLoadingLocations(false);
      return;
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsLoadingLocations(true);
      setLocationNotice("");
      try {
        const payload = await searchLocations(query, controller.signal);
        setLocationSuggestions(payload.locations);
        setActiveLocationIndex(payload.locations.length ? 0 : -1);
        setLocationNotice(payload.locations.length ? "" : "No Swiss postcode found.");
        setShowLocationSuggestions(true);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setLocationSuggestions([]);
        setActiveLocationIndex(-1);
        setLocationNotice("Location search is unavailable. Please try again.");
      } finally {
        if (!controller.signal.aborted) setIsLoadingLocations(false);
      }
    }, 180);
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, [locationQuery, selectedLocation]);

  function updateLocationQuery(value: string) {
    const postcode = normalizePostcode(value);
    setLocationQuery(postcode);
    if (postcode !== selectedLocation?.postal_code) setSelectedLocation(null);
    setShowLocationSuggestions(true);
    setActiveLocationIndex(-1);
  }

  function chooseLocation(value: LocationSuggestion) {
    setSelectedLocation(value);
    setLocationQuery(value.postal_code);
    setLocationSuggestions([]);
    setActiveLocationIndex(-1);
    setLocationNotice("");
    setShowLocationSuggestions(false);
  }

  function moveLocationSelection(direction: 1 | -1) {
    if (!locationSuggestions.length) return;
    setShowLocationSuggestions(true);
    setActiveLocationIndex((current) => current < 0
      ? (direction === 1 ? 0 : locationSuggestions.length - 1)
      : (current + direction + locationSuggestions.length) % locationSuggestions.length);
  }

  function chooseActiveLocation() {
    const value = locationSuggestions[activeLocationIndex];
    if (showLocationSuggestions && value) chooseLocation(value);
  }

  return {
    activeLocationIndex, chooseActiveLocation, chooseLocation, isLoadingLocations,
    locationNotice, locationQuery, locationSuggestions, moveLocationSelection,
    selectedLocation, setActiveLocationIndex, setShowLocationSuggestions,
    showLocationSuggestions, updateLocationQuery,
  };
}
