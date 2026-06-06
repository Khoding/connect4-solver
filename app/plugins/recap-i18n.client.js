import {setRecapI18n} from '~/utils/recap';

// The recap exporter (utils/recap) lives outside the component tree, so it can't
// call useNuxtApp itself. Hand it the global vue-i18n composer once, on the
// client (recaps are only ever built in response to user interaction).
export default defineNuxtPlugin(nuxtApp => {
  setRecapI18n(nuxtApp.$i18n);
});
