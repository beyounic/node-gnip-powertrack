module.exports = {
  gnip: {
    powerTrackUrl: 'https://stream.gnip.com:443/accounts/XYZ/publishers/twitter/streams/track/Production.json',
    rulesAPIUrl: 'https://api.gnip.com:443/accounts/XYZ/publishers/twitter/streams/track/Production/rules.json',
    username: '',
    password: ''
  },
  server: {
    port: 5000,
    rate: {             // Optional rate limiting (works only when using normalized stream)
      max: 20,          // If a rule generates a number > [max] activities
      interval: 30000   // within [interval] (in milliseconds) it will be removed
    }
  }
};
