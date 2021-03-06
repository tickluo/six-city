import api from '../webServices/api.wsvc'

export default {
  getAppCurrency: model => api.post('/catelog/app', model),
  getRegion: model => api.local(model),
  getCaptcha: model => api.post('/userlogin/auth/code', model)
}
