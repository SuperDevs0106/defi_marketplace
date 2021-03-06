import React, { ReactNode, useContext, useState, useEffect, useCallback } from 'react'
import { DDO } from '@nevermined-io/nevermined-sdk-js'
import { SearchQuery } from '@nevermined-io/nevermined-sdk-js/dist/node/metadata/Metadata'

import { BEM } from 'ui'
import { User } from '../../context'
import styles from './assets-query.module.scss'
import { Loader } from 'ui/Loader/loader'
import { networkPrefix, subcategoryPrefix } from '../../shared'
import { XuiPagination } from './pagination'
import { XuiSearchBar } from './search-bar'

interface AssetsQueryProps {
  search?: 'onsite' | 'search-page'
  query?: SearchQuery['query']
  pageSize?: number
  content: (assets: DDO[]) => ReactNode | undefined;
}

const b = BEM('assets-query', styles)
// loads all the asset then filters them looking at the variables defined in the user context
export function XuiAssetsQuery({ search, content, pageSize = 12 }: AssetsQueryProps) {
  const categoryFilter = 'defi-datasets' // Must be defined on config
  const { assets, sdk, searchInputText, fromDate, toDate, selectedCategories, selectedNetworks, selectedPrice, setSelectedPriceRange, setSelectedNetworks, setAssets, setSelectedCategories, setToDate, setFromDate, setSearchInputText } = useContext(User)

  const [totalPages, setTotalPages] = useState<number>(1)
  const [page, setPage] = useState<number>(1)
  const [searchText, setSearchText] = useState('')
  const [loading, setLoading] = useState<boolean>(false)

  const selectedCategoriesEvent = selectedCategories.map(cat => `${subcategoryPrefix}:${cat}`)
  const selectedNetworkEvent = selectedNetworks.map(cat => `${networkPrefix}:${cat}`)

  const textFilter = { "query_string": { "query": `*${searchInputText}*`, "fields": ["service.attributes.main.name"] } }
  const datasetCategory = { "match": { "service.attributes.additionalInformation.categories": selectedCategoriesEvent.length === 0 ? "defi-datasets" : selectedCategoriesEvent.join(', ') } }
  const datasetNetwork = { "match": { "service.attributes.additionalInformation.blockchain": selectedNetworkEvent.length === 0 ? "" : selectedNetworks.join(', ') } }
  const dateFilter = fromDate !== '' && toDate !== '' && {
    "range": {
      "service.attributes.main.dateCreated": {
        "time_zone": "+01:00",
        "gte": fromDate,
        "lte": toDate
      }
    }
  }

  const priceRange =  selectedPrice > 0 && {
    "range": {
      "service.attributes.main.price": {
        "gte": "0",
        "lte": selectedPrice
      }
    }
  }

  const mustArray = [textFilter, datasetCategory]
  selectedNetworkEvent.length > 0 && mustArray.push(datasetNetwork)
  dateFilter && mustArray.push(dateFilter)
  priceRange && mustArray.push(priceRange)


  const query = {
    "bool": {
      "must": mustArray,
      "must_not": [{ "match": { "service.attributes.additionalInformation.categories": "EventType:bundle" } }]
    }
  }


  //this happen when the page is loaded to get the query string
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    for (var [key, value] of queryParams.entries()) {
      switch (key) {
        case 'searchInputText': queryParams.get("searchInputText") ? setSearchInputText(value) : setSearchInputText(searchInputText); break
        case 'selectedCategories': queryParams.get("selectedCategories") ? setSelectedCategories(value.split(",")) : setSelectedCategories(selectedCategories); break
        case 'selectedNetworks': queryParams.get("selectedNetworks") ? setSelectedNetworks(value.split(",")) : setSelectedNetworks(selectedNetworks); break
        case 'toDate': queryParams.get("toDate") ? setToDate(value) : setToDate(toDate); break
        case 'fromDate': queryParams.get("fromDate") ? setFromDate(value) : setFromDate(fromDate); break
        case 'priceRange': queryParams.get("priceRange") ? setSelectedPriceRange(parseFloat(value)) : setSelectedPriceRange(selectedPrice); break
        default: break
      }
    }
  }, [])

  useEffect(() => {
    if (!sdk.assets) {
      return
    }
    setLoading(true)
    sdk.assets
      .query({
        offset: pageSize,
        page,
        query: query!,
        sort: {
          created: -1
        }
      })
      .then(({ results, totalPages }) => {
        setLoading(false)
        setAssets(results)
        setTotalPages(totalPages)
        history.replaceState(null, '', `/list?searchInputText=${searchInputText}&fromDate=${fromDate}&toDate=${toDate}&selectedCategories=${selectedCategories}&selectedNetworks=${selectedNetworks}&priceRange=${selectedPrice}`);
      })
  }, [sdk, page, JSON.stringify(query)])


  return (
    <>
      {loading && <Loader />}
      {search && (
        <div>
          <XuiSearchBar showButton={true} />
        </div>
      )}

      {content(assets)}

      {totalPages > 1 && (
        <XuiPagination setPage={setPage} page={page} totalPages={totalPages} />
      )}
    </>
  )
}

