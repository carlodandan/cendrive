import regionsData from '../data/regions.json'

class RegionDataLoader {
  constructor() {
    this.regions = null
    this.provinces = {}
    this.municipalities = {}
    this.zipCodes = {}
    this.loadedRegions = new Set()
    this.regionTypes = {}
  }

  async loadAllData() {
    try {
      this.regions = regionsData
      return true
    } catch (error) {
      console.error('Error loading region data:', error)
      return false
    }
  }

  async loadRegionData(regionSlug) {
    if (this.loadedRegions.has(regionSlug)) {
      return true
    }

    try {
      const module = await import(`../data/lgu/${regionSlug}.json`)
      const lguData = module.default || module
      
      let regionType = 'unknown'
      
      if (lguData.provinces && Array.isArray(lguData.provinces)) {
        regionType = 'province-based'
      } else if (lguData.cities || lguData.municipalities) {
        regionType = 'city-municipality-based'
      }
      
      this.regionTypes[regionSlug] = regionType
      
      if (regionType === 'province-based') {
        const provincesData = lguData.provinces
        
        this.provinces[regionSlug] = provincesData.map(province => ({
          name: province.province || province.name,
          slug: province.slug || (province.province || province.name).toLowerCase().replace(/\s+/g, '-'),
          hasData: !!(province.municipalities && province.municipalities.length > 0) ||
                   !!(province.cities && province.cities.length > 0),
          hasCities: !!(province.cities && province.cities.length > 0),
          hasMunicipalities: !!(province.municipalities && province.municipalities.length > 0)
        }))
        
        provincesData.forEach(province => {
          const provinceName = province.province || province.name
          const municipalityKey = `${regionSlug}_${provinceName}`
          const allLocalities = []
          
          // Add cities if they exist
          if (province.cities && Array.isArray(province.cities)) {
            province.cities.forEach(city => {
              allLocalities.push({
                name: city.city || city.name,
                slug: city.slug || (city.city || city.name).toLowerCase().replace(/\s+/g, '-'),
                hasZipCode: !!city.zip_code,
                type: 'city'
              })
              
              if (city.zip_code) {
                const zipKey = `${regionSlug}_${provinceName}_${city.city || city.name}`
                this.zipCodes[zipKey] = city.zip_code
              }
            })
          }
          
          // Add municipalities if they exist
          if (province.municipalities && Array.isArray(province.municipalities)) {
            province.municipalities.forEach(municipality => {
              allLocalities.push({
                name: municipality.municipality || municipality.name,
                slug: municipality.slug || (municipality.municipality || municipality.name).toLowerCase().replace(/\s+/g, '-'),
                hasZipCode: !!municipality.zip_code,
                type: 'municipality'
              })
              
              if (municipality.zip_code) {
                const zipKey = `${regionSlug}_${provinceName}_${municipality.municipality || municipality.name}`
                this.zipCodes[zipKey] = municipality.zip_code
              }
            })
          }
          
          this.municipalities[municipalityKey] = allLocalities
        })
      } else if (regionType === 'city-municipality-based') {
        const dummyProvinceName = regionSlug === 'national-capital-region' ? 'Metro Manila' : 
                                 regionSlug === 'special-geographic-area' ? 'Special Geographic Area' :
                                 regionSlug.replace(/-/g, ' ').toUpperCase()
        
        this.provinces[regionSlug] = [{
          name: dummyProvinceName,
          slug: regionSlug,
          hasData: true,
          isDummy: true
        }]
        
        const municipalitiesKey = `${regionSlug}_${dummyProvinceName}`
        const allLocalities = []
        
        if (lguData.cities && Array.isArray(lguData.cities)) {
          lguData.cities.forEach(city => {
            allLocalities.push({
              name: city.city || city.name,
              slug: city.slug || (city.city || city.name).toLowerCase().replace(/\s+/g, '-'),
              hasZipCode: !!city.zip_code,
              type: 'city'
            })
            
            if (city.zip_code) {
              const zipKey = `${regionSlug}_${dummyProvinceName}_${city.city || city.name}`
              this.zipCodes[zipKey] = city.zip_code
            }
          })
        }
        
        if (lguData.municipalities && Array.isArray(lguData.municipalities)) {
          lguData.municipalities.forEach(municipality => {
            allLocalities.push({
              name: municipality.municipality || municipality.name,
              slug: municipality.slug || (municipality.municipality || municipality.name).toLowerCase().replace(/\s+/g, '-'),
              hasZipCode: !!municipality.zip_code,
              type: 'municipality'
            })
            
            if (municipality.zip_code) {
              const zipKey = `${regionSlug}_${dummyProvinceName}_${municipality.municipality || municipality.name}`
              this.zipCodes[zipKey] = municipality.zip_code
            }
          })
        }
        
        this.municipalities[municipalitiesKey] = allLocalities
      }
      
      this.loadedRegions.add(regionSlug)
      return true
    } catch (error) {
      console.warn(`Failed to load data for region ${regionSlug}:`, error)
      this.provinces[regionSlug] = []
      return false
    }
  }

  getRegions() {
    return this.regions || []
  }

  getProvincesByRegion(regionSlug) {
    return this.provinces[regionSlug] || []
  }

  getMunicipalitiesByProvince(regionSlug, provinceName) {
    const key = `${regionSlug}_${provinceName}`
    return this.municipalities[key] || []
  }

  getZipCode(regionSlug, provinceName, municipalityName) {
    const key = `${regionSlug}_${provinceName}_${municipalityName}`
    return this.zipCodes[key] || null
  }

  getRegionType(regionSlug) {
    return this.regionTypes[regionSlug] || 'unknown'
  }
  
  isProvinceBased(regionSlug) {
    return this.regionTypes[regionSlug] === 'province-based'
  }
  
  isCityBased(regionSlug) {
    return this.regionTypes[regionSlug] === 'city-municipality-based'
  }
}

export const regionDataLoader = new RegionDataLoader()