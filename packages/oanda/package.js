Package.describe({
  name: 'oanda',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: '',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Npm.depends({
  "node-oanda": "https://github.com/pcorey/node-oanda/archive/3e363a90e2c0fa37cb79f4edb8b1dbe1be04127a.tar.gz"
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.1');
  api.use('ecmascript');
  api.addFiles('oanda.js', "server");
  api.export("OANDA", "server");
});
