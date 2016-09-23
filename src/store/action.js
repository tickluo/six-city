import cartApi from '../webServices/cart.wsvc'
import appApi from '../webServices/app.wsvc'
import orderApi from '../webServices/order.wsvc'
import userApi from '../webServices/user.wsvc'
import * as types from './mutation-types'

const localRegion = require('../local/region.json')

const app = {
  setAppCurrency ({ dispatch }, token) {
    return appApi.getAppCurrency('307480468f2bb43dd01b190a169c8084547b4403')
      .then(data => {
        if (data.Success) return dispatch(types.SET_APP_CURRENCY, data.Data)
        return Promise.reject(data.Message)
      })
  },
  getRegion () {
    return localRegion.List
  }
}

const cart = {
  getShopping ({ dispatch }, token) {
    return cartApi.getShopping('307480468f2bb43dd01b190a169c8084547b4403')
      .then(shopping => {
        dispatch(types.RECEIVE_SHOPPING_INFO, shopping.Data)
      })
  },
  getExchangeRate (token, domain) {
    return cartApi.getShopRate('307480468f2bb43dd01b190a169c8084547b4403', domain)
    /* .then(rate => {
     if (rate.List.length > 0) {
     return Promise.resolve(rate)
     }
     return cartApi.getCountryRate('307480468f2bb43dd01b190a169c8084547b4403')
     }).then(rate => rate)*/
  },
  setShoppingRate ({ dispatch }, token, rateList) {
    return cartApi.getCountryRate('307480468f2bb43dd01b190a169c8084547b4403')
      .then((res) => dispatch(types.SAVE_COUNTRY_RATE, rateList, res.List))
  },
  initShoppingDisplay ({ dispatch }, detail) {
    dispatch(types.INIT_SHOPPING_DISPLAY, detail)
  },
  updateShoppingDisplay ({ dispatch }, detail) {
    dispatch(types.UPDATE_SHOPPING_DISPLAY, detail)
  },
  getCartList ({ dispatch }, token) {
    return cartApi.getCartList('307480468f2bb43dd01b190a169c8084547b4403')
      .then(cartInfo => dispatch(types.GET_CART_LIST, cartInfo.List))
  },
  selectAll ({ dispatch }, toggle) {
    dispatch(types.SELECT_ALL_SHOPPING, toggle)
  },
  selectShop ({ dispatch }, toggle, shopId) {
    dispatch(types.SELECT_SHOP_SHOPPING, toggle, shopId)
  },
  selectShopping ({ dispatch }, toggle, shopId, id) {
    dispatch(types.SELECT_SHOPPING, toggle, shopId, id)
  },
  addShoppingCount ({ dispatch }) {
    dispatch(types.INCREASE_SHOPPING_COUNT)
  },
  reduceShoppingCount ({ dispatch }) {
    dispatch(types.DECREASE_SHOPPING_COUNT)
  },
  addToCart (token, shopping) {
    return cartApi.addToCart('307480468f2bb43dd01b190a169c8084547b4403', shopping)
  },
  removeShopping ({ dispatch }, token, shopId, id) {
    cartApi.removeShopping('307480468f2bb43dd01b190a169c8084547b4403', id)
      .then(res => {
        if (res.Success) {
          return dispatch(types.REMOVE_SHOPPING_BY_ID, shopId, id)
        }
        return Promise.reject(res.Message)
      })
  },
  getDefaultCompany ({ dispatch }, token, countryIds) {
    return cartApi.getDefaultCompany('307480468f2bb43dd01b190a169c8084547b4403', countryIds)
      .then(res => {
        dispatch(types.SET_DEFAULT_COMPANY, res.List)
        return res.List
      })
  },
  getCompanyByCid (token, countryId) {
    return cartApi.getCompanyByCid('307480468f2bb43dd01b190a169c8084547b4403', countryId)
  },
  setCompanyByCid ({ dispatch }, countryId, company) {
    dispatch(types.SET_COMPANY_BY_CID, countryId, company)
  }
}

const orders = {
  saveOrder (order) {
    return orderApi.saveOrder(order)
  },
  getOrderList ({ dispatch }, token, page) {
    return orderApi.getOrderList({ key: '307480468f2bb43dd01b190a169c8084547b4403', Page: page })
      .then(data => {
        if (data.Success) {
          dispatch(types.SET_ORDER_LIST, data.List)
        }
        return Promise.resolve(data)
      })
  },
  getOrderDetail ({ dispatch }, token, id) {
    return orderApi.getOrderDetail({ key: '307480468f2bb43dd01b190a169c8084547b4403', OrderId: id })
      .then(data => {
        if (data.Success) {
          dispatch(types.SET_DISPLAY_ORDER, data.Data)
        }
        return Promise.resolve(data)
      })
  },
  getPackageList ({ dispatch }, token) {
    return orderApi.getPackageList({ key: '307480468f2bb43dd01b190a169c8084547b4403', Type: 2 })
      .then(data => {
        if (data.Success) {
          dispatch(types.SET_PACKAGE_LIST, data.List)
        }
        return Promise.resolve(data)
      })
  },
  getStoreDetail ({ dispatch }, token, id) {
    return orderApi.getPackageDetail({
      key: '307480468f2bb43dd01b190a169c8084547b4403',
      PackageId: id
    })
      .then(data => {
        if (data.Success) {
          dispatch(types.SET_DISPLAY_PACKAGE, data.Data)
        }
        return Promise.resolve(data)
      })
  },
  setPackageIds ({ dispatch }, ids) {
    return dispatch(types.SET_PACKAGE_IDS, ids)
  },
  getPackageByShipId (token, id) {

  },
  getPackageByIds (token, ids) {

  },
  getShipWay (token, weight, id) {

  },
  getShipService (token, id) {

  }
}

const user = {
  getDefaultAddress ({ dispatch }, token) {
    return userApi.getDefaultAddress({ key: '307480468f2bb43dd01b190a169c8084547b4403' })
      .then(data => {
        if (data.Success) {
          dispatch(types.SET_DEFAULT_ADDRESS, data.Data)
        }
        return Promise.resolve(data)
      })
  }
}

export {
  app,
  user,
  cart,
  orders
}
