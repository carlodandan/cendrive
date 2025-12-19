import { useCallback } from 'react'

export const useRegions = () => {
  // Function to get JSON file name from region slug
  const getRegionFileName = useCallback((regionSlug) => {
    // Ensure proper JSON file name format
    return `${regionSlug}.json`
  }, [])

  // Function to get display name from region slug
  const getRegionDisplayName = useCallback((regionSlug) => {
    const regionMap = {
      'national-capital-region': 'NATIONAL CAPITAL REGION (NCR)',
      'cordillera-administrative-region': 'CORDILLERA ADMINISTRATIVE REGION (CAR)',
      'region-i-ilocos-region': 'REGION I (ILOCOS REGION)',
      'region-ii-cagayan-valley': 'REGION II (CAGAYAN VALLEY)',
      'region-iii-central-luzon': 'REGION III (CENTRAL LUZON)',
      'region-iva-calabarzon': 'REGION IV-A (CALABARZON)',
      'region-ivb-mimaropa': 'REGION IV-B (MIMAROPA)',
      'region-v-bicol-region': 'REGION V (BICOL REGION)',
      'region-vi-western-visayas': 'REGION VI (WESTERN VISAYAS)',
      'negros-island-region': 'NEGROS ISLAND REGION (NIR)',
      'region-vii-central-visayas': 'REGION VII (CENTRAL VISAYAS)',
      'region-viii-eastern-visayas': 'REGION VIII (EASTERN VISAYAS)',
      'region-ix-zamboanga-peninsula': 'REGION IX (ZAMBOANGA PENINSULA)',
      'region-x-northern-mindanao': 'REGION X (NORTHERN MINDANAO)',
      'region-xi-davao-region': 'REGION XI (DAVAO REGION)',
      'region-xii-soccsksargen': 'REGION XII (SOCCSKSARGEN)',
      'region-xiiicaraga': 'REGION XIII (CARAGA)',
      'bangsamoro-autonomous-region-in-muslim-mindanao': 'BARMM',
      'special-geographic-area': 'Special Geographic Area'
    }
    
    return regionMap[regionSlug] || regionSlug.replace(/-/g, ' ').toUpperCase()
  }, [])

  // Function to check if region has JSON data file
  const regionHasData = useCallback(async (regionSlug) => {
    try {
      // Try to dynamically import to check if file exists
      await import(`../data/lgu/${regionSlug}.json`)
      return true
    } catch {
      return false
    }
  }, [])

  return {
    getRegionFileName,
    getRegionDisplayName,
    regionHasData
  }
}