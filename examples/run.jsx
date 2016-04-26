'use strict';

(function () {
    let React = require('react');
    let ReactDOM = require('react-dom');
    let injectTapEventPlugin = require('react-tap-event-plugin');

    let Demo = require('./main').default;

    // Needed for React Developer Tools (Chrome Extension)
    window.React = React;

    /* Some components use react-tap-event-plugin to listen for touch events.
     This dependency is temporary and will go away once react v1.0 is released.
     Until then, be sure to inject this plugin at the start of your app */
    injectTapEventPlugin();

    // Render the main app react component into the app div
    ReactDOM.render(<Demo />, document.getElementById('container'));
})();