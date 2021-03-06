import createPersist from 'vuex-localstorage'
import { sessionConfig, ExpensesType } from '../../local/config.enum'
import { parseDomain, toFloatFixed } from '../../services/util.svc'
import {
  ADD_TO_CART,
  RECEIVE_SHOPPING_INFO,
  GET_CART_LIST,
  INIT_SHOPPING_DISPLAY,
  UPDATE_SHOPPING_DISPLAY,
  SELECT_ALL_SHOPPING,
  SELECT_SHOP_SHOPPING,
  SELECT_SHOPPING,
  INCREASE_SHOPPING_COUNT,
  DECREASE_SHOPPING_COUNT,
  SET_DEFAULT_COMPANY,
  SAVE_COUNTRY_RATE,
  SAVE_SHOP_RATE,
  SET_COMPANY_BY_CID,
  REMOVE_SHOPPING_BY_ID,
  CLEAR_REMOVE_LIST,
  ADD_NO_COUNT_SHOPPING,
  REMOVE_NO_COUNT_SHOPPING,
  CLEAR_NO_COUNT_SHOPPING,
  SET_FAQ,
  SET_FAQ_INDEX,
  SET_FAQ_LOADED,
  SET_COMPANY_AND_WAY
} from '../mutation-types'

const CART_ENV_KEY = 'CART_ENV_KEY'

const persist = createPersist(CART_ENV_KEY, {
  detail: {},
  display: {},
  cartList: [],
  removeList: [],
  noCountList: [],
  order: {},
  company: {
    companySet: [],
    companyAndWay: []
  },
  countries: [],
  rates: [],
  shoppingTotalPrice: 0,
  faqList: [],
  faqIndex: 1,
  faqAllLoaded: false
}, {
  expires: sessionConfig.Duration
})

const state = persist.get()

const getRateById = (url, wid, cid) => {
  const webRate = state.rates.find(rate => {
    if (wid === 0) return rate.Url === parseDomain(url)
    return rate.WebSiteId === wid
  })
  return (webRate
    ? webRate.Rate
    : state.countries.find(item => item.Id === cid).Rate)
}

const genPrice = (shopping, rate) => {
  const afterRatePrice =
    shopping.OriginalPrice * getRateById(shopping.Url, shopping.WebSiteId, shopping.CountryId)
  return toFloatFixed((toFloatFixed(afterRatePrice, 2) * (1 + rate)), 2) * shopping.Quantity
}

const getRulePrice = (rule, price, rate) => {
  if (rule.ExpensesType === ExpensesType.NotFull) {
    if (price < rule.LimitPrice * rate && price !== 0) {
      return toFloatFixed((rule.ExpensesPrice * rate), 2)
    }
  }
  if (rule.ExpensesType === ExpensesType.Must && price !== 0) {
    return toFloatFixed((rule.ExpensesPrice * rate), 2)
  }
  return 0
}

const genExpressFee = (list, Rate) => {
  if (!list || list.length === 0) return 0
  return toFloatFixed((Math.max(...list.map(item => item.ExpressFee)) * Rate), 2)
}

const mutations = {
  [ADD_TO_CART] (state, shopping) {
    state.cart = shopping
    persist.set(state)
  },
  [RECEIVE_SHOPPING_INFO] (state, shopping) {
    state.detail = shopping
    persist.set(state)
  },
  [GET_CART_LIST] (state, list) {
    state.cartList = list
    persist.set(state)
  },
  [INIT_SHOPPING_DISPLAY] (state, detail) {
    state.display = detail
    persist.set(state)
  },
  [UPDATE_SHOPPING_DISPLAY] (state, detail) {
    state.display.skuSelect = detail.skuSelect
    state.display.disableSku = detail.disableSku
    state.display.picture = detail.picture ? detail.picture : state.display.picture
    persist.set(state)
  },
  [SELECT_ALL_SHOPPING] (state, toggle, rate) {
    if (toggle) {
      state.shoppingTotalPrice = 0
      state.order = Object.assign({}, {
        selectAll: true,
        selected: state.cartList.map(list => {
          let shopTotalPrice = 0
          list.GrabAttrs.forEach(item => {
            if (!state.noCountList.includes(item.Id)) {
              shopTotalPrice += parseFloat(genPrice(item, rate))
            }
          })
          const Rate = getRateById(
            list.GrabAttrs[0].Url,
            list.GrabAttrs[0].WebSiteId,
            list.GrabAttrs[0].CountryId
          )
          const ruleTemp = state.countries
            .find(item => item.Id === list.GrabAttrs[0].CountryId)
          const ruleRate = ruleTemp ? ruleTemp.Rate : 0
          let RulePrice = 0
          if (list.Rule.ExpensesType === ExpensesType.NoSet) {
            RulePrice += genExpressFee(
              list.GrabAttrs.filter(item => !state.noCountList.includes(item.Id)), Rate)
          } else {
            RulePrice += getRulePrice(list.Rule, shopTotalPrice, ruleRate)
          }
          state.shoppingTotalPrice += RulePrice

          return ({
            selectShop: true,
            CountryId: list.GrabAttrs[0].CountryId,
            Rate,
            ruleRate,
            RulePrice,
            Rule: list.Rule,
            shopping: list.GrabAttrs
              .filter(item => !state.noCountList.includes(item.Id))
              .map(item => item.Id)
          })
        })
      })
      state.cartList.forEach(shop => {
        shop.GrabAttrs.forEach(item => {
          if (!state.noCountList.includes(item.Id)) {
            state.shoppingTotalPrice += parseFloat(genPrice(item, rate))
          }
        })
      })
    } else {
      state.order = {
        selectAll: false,
        selected: state.cartList.map(list => {
          const Rate = getRateById(
            list.GrabAttrs[0].Url,
            list.GrabAttrs[0].WebSiteId,
            list.GrabAttrs[0].CountryId
          )
          const ruleRate = state.countries
            .find(item => item.Id === list.GrabAttrs[0].CountryId).Rate
          const CountryId = list.GrabAttrs[0].CountryId
          return ({
            selectShop: false,
            CountryId,
            Rate,
            ruleRate,
            RulePrice: 0,
            Rule: list.Rule,
            shopping: []
          })
        })
      }
      state.shoppingTotalPrice = 0
    }
    persist.set(state)
  },
  [SELECT_SHOP_SHOPPING] (state, toggle, shopId, rate) {
    if (toggle) {
      state.order.selected[shopId].selectShop = true
      let shopTotalPrice = 0
      state.cartList[shopId].GrabAttrs
        .forEach(item => {
          const shoppingPrice = parseFloat(genPrice(item, rate))
          if (!state.order.selected[shopId].shopping.includes(item.Id) &&
            !state.noCountList.includes(item.Id)) {
            state.order.selected[shopId].shopping.push(item.Id)
            state.shoppingTotalPrice += shoppingPrice
          }
          shopTotalPrice += shoppingPrice
        })
      const rulePriceTemp = getRulePrice(state.cartList[shopId].Rule
        , shopTotalPrice
        , state.order.selected[shopId].ruleRate)
      if (state.order.selected[shopId].RulePrice === 0) {
        state.shoppingTotalPrice += rulePriceTemp
      } else if (rulePriceTemp === 0 && state.order.selected[shopId].RulePrice !== 0) {
        state.shoppingTotalPrice -= state.order.selected[shopId].RulePrice
      }
      state.order.selected[shopId].RulePrice = rulePriceTemp
    } else {
      state.order.selected[shopId].selectShop = false
      /**
       * important!! vue cannot observe Array s change unless use splice or $set
       */
      state.order.selected[shopId].shopping.splice(0, state.order.selected[shopId].shopping.length)
      state.cartList[shopId].GrabAttrs
        .forEach(item => {
          if (!state.noCountList.includes(item.Id)) {
            state.shoppingTotalPrice -= parseFloat(genPrice(item, rate))
          }
        })
      if (state.order.selected[shopId].RulePrice !== 0) {
        state.shoppingTotalPrice -= state.order.selected[shopId].RulePrice
      }
      state.order.selected[shopId].RulePrice = 0
    }
    if (state.cartList[shopId].Rule.ExpensesType === ExpensesType.NoSet) {
      const expressFee = genExpressFee(
        state.cartList[shopId].GrabAttrs
          .filter(item => state.order.selected[shopId].shopping.includes(item.Id) &&
            !state.noCountList.includes(item.Id)),
        state.order.selected[shopId].Rate
      )
      if (toggle && state.order.selected[shopId].RulePrice === 0) {
        state.shoppingTotalPrice += expressFee
        state.order.selected[shopId].RulePrice = expressFee
      }
      if (!toggle) {
        state.shoppingTotalPrice -= state.order.selected[shopId].RulePrice
        state.order.selected[shopId].RulePrice = 0
      }
    }
    state.order.selectAll = state.order.selected.every(item => item.selectShop === true)
    persist.set(state)
  },
  [SELECT_SHOPPING] (state, toggle, shopId, id, rate) {
    let shopPriceTemp = 0
    const rule = state.order.selected[shopId].Rule
    const shoppingPriceTemp = parseFloat(genPrice(state.cartList[shopId].GrabAttrs
      .find(item => item.Id === id), rate))
    const shopRate = state.order.selected[shopId].ruleRate
    if (toggle) {
      state.order.selected[shopId].shopping.push(id)
      state.shoppingTotalPrice += shoppingPriceTemp
    } else {
      state.order.selected[shopId].shopping
        .splice(state.order.selected[shopId].shopping.indexOf(id), 1)
      state.shoppingTotalPrice -= shoppingPriceTemp
    }
    state.order.selected[shopId].selectShop =
      state.cartList[shopId].GrabAttrs.filter(item => (
        !state.noCountList.includes(item.Id)
      )).length === state.order.selected[shopId].shopping.length
    if (rule.ExpensesType === ExpensesType.NotFull) {
      state.order.selected[shopId].shopping.forEach(shoppingId => {
        shopPriceTemp += parseFloat(genPrice(state.cartList[shopId].GrabAttrs
          .find(item => item.Id === shoppingId), rate))
      })
      if (state.order.selected[shopId].RulePrice !== 0 &&
        rule.LimitPrice * shopRate <= (shopPriceTemp)) {
        state.shoppingTotalPrice -= toFloatFixed((rule.ExpensesPrice * shopRate), 2)
        state.order.selected[shopId].RulePrice = 0
      }
      if (state.order.selected[shopId].RulePrice === 0 &&
        rule.LimitPrice * shopRate > (shopPriceTemp) &&
        state.order.selected[shopId].shopping.length !== 0) {
        state.shoppingTotalPrice += toFloatFixed((rule.ExpensesPrice * shopRate), 2)
        state.order.selected[shopId].RulePrice = toFloatFixed((rule.ExpensesPrice * shopRate), 2)
      }
      if (state.order.selected[shopId].RulePrice !== 0 &&
        state.order.selected[shopId].shopping.length === 0) {
        state.shoppingTotalPrice -= toFloatFixed((rule.ExpensesPrice * shopRate), 2)
        state.order.selected[shopId].RulePrice = 0
      }
    }
    if (rule.ExpensesType === ExpensesType.Must) {
      if (state.order.selected[shopId].shopping.length === 0) {
        state.shoppingTotalPrice -= toFloatFixed((rule.ExpensesPrice * shopRate), 2)
        state.order.selected[shopId].RulePrice = 0
      }
      if (state.order.selected[shopId].shopping.length === 1 && toggle) {
        state.shoppingTotalPrice += toFloatFixed((rule.ExpensesPrice * shopRate), 2)
        state.order.selected[shopId].RulePrice = toFloatFixed((rule.ExpensesPrice * shopRate), 2)
      }
    }
    if (rule.ExpensesType === ExpensesType.NoSet) {
      const expressFee = genExpressFee(
        state.cartList[shopId].GrabAttrs
          .filter(item => state.order.selected[shopId].shopping.includes(item.Id) &&
            !state.noCountList.includes(item.Id)
          ),
        state.order.selected[shopId].Rate
      )
      if (state.order.selected[shopId].shopping.length === 0) {
        state.shoppingTotalPrice -= state.order.selected[shopId].RulePrice
      }
      if (state.order.selected[shopId].shopping.length === 1 && toggle) {
        state.shoppingTotalPrice += expressFee
      }
      state.order.selected[shopId].RulePrice = expressFee
    }
    state.order.selectAll = state.order.selected
      .every(item => item.selectShop === true)
    persist.set(state)
  },
  [INCREASE_SHOPPING_COUNT] (state) {
    state.display.count++
    persist.set(state)
  },
  [DECREASE_SHOPPING_COUNT] (state) {
    state.display.count--
    persist.set(state)
  },
  [SET_DEFAULT_COMPANY] (state, companyList) {
    state.company.companySet = []
    companyList.forEach((item, index) => {
      state.company.companySet.$set(index, item)
    })
    persist.set(state)
  },
  [SAVE_SHOP_RATE] (state, rateList) {
    rateList.forEach((item, index) => {
      state.rates.$set(index, item)
    })
    persist.set(state)
  },
  [SAVE_COUNTRY_RATE] (state, countryList) {
    countryList.forEach((item, index) => {
      state.countries.$set(index, item)
    })
    persist.set(state)
  },
  [SET_COMPANY_BY_CID] (state, countryId, company) {
    const index = state.company.companySet.findIndex(item => item.CountryId === countryId)
    state.company.companySet.splice(index, 1, company)
    persist.set(state)
  },
  [SET_COMPANY_AND_WAY] (state, countryId, company) {
    const index = state.company.companyAndWay.findIndex(item => item.countryId === countryId)
    if (index < 0) {
      state.company.companyAndWay.push({ countryId, company })
    }
    persist.set(state)
  },
  [REMOVE_SHOPPING_BY_ID] (state, id) {
    state.removeList.push(id)
    persist.set(state)
  },
  [CLEAR_REMOVE_LIST] (state) {
    state.removeList.splice(0, state.removeList.length)
    persist.set(state)
  },
  [ADD_NO_COUNT_SHOPPING] (state, id) {
    state.noCountList.push(id)
    persist.set(state)
  },
  [REMOVE_NO_COUNT_SHOPPING] (state, id) {
    const index = state.noCountList.findIndex(item => item === id)
    state.noCountList.splice(index, 1)
    persist.set(state)
  },
  [CLEAR_NO_COUNT_SHOPPING] (state) {
    state.noCountList.splice(0, state.noCountList.length)
    persist.set(state)
  },
  [SET_FAQ] (state, list, index) {
    if (index === 1) state.faqList = list
    else state.faqList = state.faqList.concat(list)
    persist.set(state)
  },
  [SET_FAQ_INDEX] (state, index) {
    state.faqIndex = index
    persist.set(state)
  },
  [SET_FAQ_LOADED] (state, isLoaded) {
    state.faqAllLoaded = isLoaded
    persist.set(state)
  }
}

export default {
  state,
  mutations
}

