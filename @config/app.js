(function() {

const App = Vue.createApp({
  data() {
    const owner = 'Cxsmo-ai';
    const repo = 'syncler-aiostreams';
    const branch = 'main';
    const baseUrl = `https://${owner.toLowerCase()}.github.io/${repo}`;
    return {
      packageName: 'AioStreams',
      vendorUrl: `${baseUrl}/vendor.json`,
      manifestUrl: `${baseUrl}/manifest.json`,
      packageUrl: `${baseUrl}/express.json`
    };
  },
  methods: {
    copy(value) {
      navigator.clipboard && navigator.clipboard.writeText(value);
    }
  }
});

App.mount('.c-app');
window.App = App;

}());
