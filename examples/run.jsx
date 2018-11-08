(function() {
  const React = require('react');
  const ReactDOM = require('react-dom');
  const AppContainer = require('react-hot-loader').AppContainer;

  const Demo = require('./main').default;

  // Needed for React Developer Tools (Chrome Extension)
  window.React = React;

  // Render the main app react component into the app div
  ReactDOM.render(
    <AppContainer>
      <Demo />
    </AppContainer>,
    document.getElementById('container'),
  );

  if (module && module.hot) {
    module.hot.accept('./main.jsx', () => {
      const App = require('./main.jsx').default;
      ReactDOM.render(
        <AppContainer>
          <App />
        </AppContainer>,
        document.getElementById('container'),
      );
    });
  }
})();
