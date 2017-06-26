/*global module*/
/*eslint no-console:0*/
'use strict';

(function () {
    let React = require('react');
    let ReactDOM = require('react-dom');
    let injectTapEventPlugin = require('react-tap-event-plugin');
    let AppContainer = require('react-hot-loader').AppContainer;

    let Demo = require('./main').default;

    // Needed for React Developer Tools (Chrome Extension)
    window.React = React;

    /* Some components use react-tap-event-plugin to listen for touch events.
     This dependency is temporary and will go away once react v1.0 is released.
     Until then, be sure to inject this plugin at the start of your app */
    injectTapEventPlugin();

    // Render the main app react component into the app div
    ReactDOM.render(<AppContainer><Demo /></AppContainer>, document.getElementById('container'));

    if (module && module.hot) {
        module.hot.accept('./main.jsx', () => {
            const App = require('./main.jsx').default;
            ReactDOM.render(
                <AppContainer>
                    <App/>
                </AppContainer>,
                document.getElementById('container')
            );
        });
    }
})();