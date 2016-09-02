import Vue from 'vue'
import Resource from 'vue-resource'
import Router from 'vue-router'

import App from './app.vue'
import routers from './routers'

// Install plugins
Vue.use(Router)
Vue.use(Resource)

// Set up a new router
const router = new Router({
  history: false,
  saveScrollPosition: true,
  linkActiveClass: 'link-active'
})

// Route config
routers(router)

// Start up our app
router.start(App, '#app')
