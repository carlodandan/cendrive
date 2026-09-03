import { useCallback, useState } from "react";

import * as api from "../lib/api";
import type {
  ApiResult,
  FileResult,
  Household,
  HouseholdDetail,
  RecordInput,
  Statistics,
} from "../lib/types";

/**
 * Same surface as the Electron-era hook: every call resolves to
 * `{ success, data }` / `{ success, error }` instead of throwing, so screens keep
 * branching rather than wrapping each call in try/catch. `loading` counts
 * in-flight calls so two overlapping requests cannot clear it early.
 */
export function useDatabase() {
  const [pending, setPending] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async <T>(operation: () => Promise<T>): Promise<ApiResult<T>> => {
      setPending((count) => count + 1);
      const result = await api.attempt(operation);
      setPending((count) => count - 1);
      setError(result.success ? null : result.error);
      return result;
    },
    [],
  );

  const saveCensusRecord = useCallback(
    (record: RecordInput): Promise<ApiResult<number>> =>
      run(() => api.saveRecord(record)),
    [run],
  );

  const updateHousehold = useCallback(
    (id: number, record: RecordInput): Promise<ApiResult<void>> =>
      run(() => api.updateHousehold(id, record)),
    [run],
  );

  const getAllHouseholds = useCallback(
    (): Promise<ApiResult<Household[]>> => run(api.getAllHouseholds),
    [run],
  );

  const getHouseholdById = useCallback(
    (id: number): Promise<ApiResult<HouseholdDetail>> =>
      run(() => api.getHouseholdById(id)),
    [run],
  );

  const searchHouseholds = useCallback(
    (term: string): Promise<ApiResult<Household[]>> =>
      run(() => api.searchHouseholds(term)),
    [run],
  );

  const getStatistics = useCallback(
    (): Promise<ApiResult<Statistics>> => run(api.getStatistics),
    [run],
  );

  const deleteHousehold = useCallback(
    (id: number): Promise<ApiResult<void>> => run(() => api.deleteHousehold(id)),
    [run],
  );

  const backupDatabase = useCallback(
    (path?: string | null): Promise<ApiResult<FileResult>> =>
      run(() => api.backupDatabase(path ?? null)),
    [run],
  );

  return {
    loading: pending > 0,
    error,
    clearError: useCallback(() => setError(null), []),
    saveCensusRecord,
    updateHousehold,
    getAllHouseholds,
    getHouseholdById,
    searchHouseholds,
    getStatistics,
    deleteHousehold,
    backupDatabase,
  };
}
