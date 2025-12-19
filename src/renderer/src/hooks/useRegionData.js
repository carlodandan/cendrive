import { useState, useEffect, useCallback } from 'react'
import { regionDataLoader } from '../utils/regionsData'

export const useRegionData = () => {
  const [regions, setRegions] = useState([])
  const [provinces, setProvinces] = useState([])
  const [municipalities, setMunicipalities] = useState([])
  const [selectedZipCode, setSelectedZipCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [loadingRegion, setLoadingRegion] = useState(false)
  const [regionType, setRegionType] = useState('')
  const [autoSelectedProvince, setAutoSelectedProvince] = useState(null)

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true)
        const success = await regionDataLoader.loadAllData()
        if (success) {
          setRegions(regionDataLoader.getRegions())
        } else {
          setError('Failed to load region data')
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    initializeData()
  }, [])

  const loadProvinces = useCallback(async (regionSlug) => {
    if (!regionSlug) {
      setProvinces([])
      setMunicipalities([])
      setSelectedZipCode('')
      setRegionType('')
      setAutoSelectedProvince(null)
      return
    }
    
    try {
      setLoadingRegion(true)
      
      await regionDataLoader.loadRegionData(regionSlug)
      
      const regionProvinces = regionDataLoader.getProvincesByRegion(regionSlug)
      const type = regionDataLoader.getRegionType(regionSlug)
      
      setProvinces(regionProvinces)
      setMunicipalities([])
      setSelectedZipCode('')
      setRegionType(type)
      
      // Auto-select the province if it's a city-based region with only one province
      if (type === 'city-municipality-based' && regionProvinces.length === 1) {
        const autoProvince = regionProvinces[0].name
        setAutoSelectedProvince(autoProvince)
        // Return the province name to be used by the calling component
        return autoProvince
      } else {
        setAutoSelectedProvince(null)
      }
    } catch (err) {
      console.error('Error loading provinces:', err)
      setProvinces([])
      setRegionType('')
      setAutoSelectedProvince(null)
    } finally {
      setLoadingRegion(false)
    }
  }, [])

  const loadMunicipalities = useCallback((regionSlug, provinceName) => {
    if (!regionSlug || !provinceName) {
      setMunicipalities([])
      setSelectedZipCode('')
      return
    }
    
    const provinceMunicipalities = regionDataLoader.getMunicipalitiesByProvince(regionSlug, provinceName)
    setMunicipalities(provinceMunicipalities)
    setSelectedZipCode('')
  }, [])

  const loadZipCode = useCallback((regionSlug, provinceName, municipalityName) => {
    if (!regionSlug || !provinceName || !municipalityName) {
      setSelectedZipCode('')
      return
    }
    
    const zipCode = regionDataLoader.getZipCode(regionSlug, provinceName, municipalityName)
    setSelectedZipCode(zipCode || '')
  }, [])

  return {
    regions,
    provinces,
    municipalities,
    selectedZipCode,
    loading: loading || loadingRegion,
    error,
    regionType,
    autoSelectedProvince,
    loadProvinces,
    loadMunicipalities,
    loadZipCode,
    isProvinceBased: (slug) => regionDataLoader.isProvinceBased(slug),
    isCityBased: (slug) => regionDataLoader.isCityBased(slug)
  }
}