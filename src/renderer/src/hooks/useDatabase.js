import { useState, useCallback } from 'react'

export const useDatabase = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const saveCensusRecord = useCallback(async (record) => {
    try {
      setLoading(true)
      const result = await window.databaseAPI.saveRecord(record)
      
      if (result.success) {
        return { success: true, householdId: result.householdId }
      } else {
        setError(result.error)
        return { success: false, error: result.error }
      }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  const getAllHouseholds = useCallback(async () => {
    try {
      setLoading(true)
      const result = await window.databaseAPI.getAllHouseholds()
      
      if (result.success) {
        return { success: true, data: result.data }
      } else {
        setError(result.error)
        return { success: false, error: result.error }
      }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  const getHouseholdById = useCallback(async (id) => {
    try {
      setLoading(true)
      const result = await window.databaseAPI.getHouseholdById(id)
      
      if (result.success) {
        return { success: true, data: result.data }
      } else {
        setError(result.error)
        return { success: false, error: result.error }
      }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  const searchHouseholds = useCallback(async (searchTerm) => {
    try {
      setLoading(true)
      const result = await window.databaseAPI.searchHouseholds(searchTerm)
      
      if (result.success) {
        return { success: true, data: result.data }
      } else {
        setError(result.error)
        return { success: false, error: result.error }
      }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  const getStatistics = useCallback(async () => {
    try {
      setLoading(true)
      const result = await window.databaseAPI.getStatistics()
      
      if (result.success) {
        return { success: true, data: result.data }
      } else {
        setError(result.error)
        return { success: false, error: result.error }
      }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteHousehold = useCallback(async (id) => {
    try {
      setLoading(true)
      const result = await window.databaseAPI.deleteHousehold(id)
      
      if (result.success) {
        return { success: true, affectedRows: result.affectedRows }
      } else {
        setError(result.error)
        return { success: false, error: result.error }
      }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  const backupDatabase = useCallback(async (backupPath) => {
    try {
      setLoading(true)
      const result = await window.databaseAPI.backupDatabase(backupPath)
      
      if (result.success) {
        return { success: true }
      } else {
        setError(result.error)
        return { success: false, error: result.error }
      }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    saveCensusRecord,
    getAllHouseholds,
    getHouseholdById,
    searchHouseholds,
    getStatistics,
    deleteHousehold,
    backupDatabase
  }
}