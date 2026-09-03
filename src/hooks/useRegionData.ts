import { useCallback, useMemo, useRef, useState } from "react";

import { errorMessage } from "../lib/api";
import {
  REGIONS,
  findLocality,
  findProvince,
  hasRegionData,
  loadRegion,
} from "../utils/regionsData";
import type { Locality, Province, RegionData } from "../utils/regionsData";

/**
 * Region list ships in the bundle; the per-region LGU file is fetched on demand
 * and cached. Everything downstream (provinces, localities, zip code) is derived
 * from the loaded region instead of being mirrored into separate state, which is
 * what made the old three-effect chain fire in the wrong order.
 */
export function useRegionData() {
  const [data, setData] = useState<RegionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Guards against an earlier region resolving after a later one.
  const requestRef = useRef(0);

  const selectRegion = useCallback(async (slug: string): Promise<RegionData | null> => {
    const request = ++requestRef.current;

    if (!slug) {
      setData(null);
      setError(null);
      setLoading(false);
      return null;
    }

    if (!hasRegionData(slug)) {
      setData(null);
      setError("No local government data is bundled for that region.");
      return null;
    }

    setLoading(true);
    setError(null);
    try {
      const region = await loadRegion(slug);
      if (request !== requestRef.current) return null;
      setData(region);
      setError(null);
      return region;
    } catch (cause) {
      if (request !== requestRef.current) return null;
      setData(null);
      setError(errorMessage(cause));
      return null;
    } finally {
      if (request === requestRef.current) setLoading(false);
    }
  }, []);

  const provinces = useMemo<Province[]>(() => data?.provinces ?? [], [data]);

  /**
   * City-based regions (NCR, the Special Geographic Area) carry a single
   * stand-in province, so the form fills it in and locks the select.
   */
  const autoProvince = useMemo<string | null>(() => {
    if (!data || data.kind !== "city-municipality-based") return null;
    return data.provinces[0]?.name ?? null;
  }, [data]);

  const localitiesFor = useCallback(
    (provinceName: string): Locality[] => {
      if (!data || !provinceName) return [];
      return findProvince(data, provinceName)?.localities ?? [];
    },
    [data],
  );

  const zipCodeFor = useCallback(
    (provinceName: string, localityName: string): string => {
      if (!data || !provinceName || !localityName) return "";
      return findLocality(data, provinceName, localityName)?.zipCode ?? "";
    },
    [data],
  );

  return {
    regions: REGIONS,
    regionData: data,
    regionKind: data?.kind ?? null,
    provinces,
    autoProvince,
    loading,
    error,
    selectRegion,
    localitiesFor,
    zipCodeFor,
  };
}
