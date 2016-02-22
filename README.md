# react-sketch

[![NPM version][npm-image]][npm-url]
[![NPM downloads][downloads-image]][downloads-url]
[![Build status][travis-image]][travis-url]

A Simple Sketch tool for React based applications

## Installation

Note that react and react-dom have been declared as peer dependencies and **should** exist in your project when using 
react-sketch as a library, if not do the following:

```sh
npm install react --save
npm install react-dom --save
npm install react-sketch --save
```

or in one command
```sh
npm install --save react  react-dom react-sketch
```

## Usage

Import the relevant SketchField component and use it, you can find more on the examples folder of the project

```javascript
import {SketchField, Tools} from 'react-sketch';

class SketchFieldDemo extends React.Component {
     render() {
        return (
            <SketchField width='1024px' 
                         height='768px' 
                         tool={Tools.Pencil} 
                         color='black'
                         lineWidth={3}/>
        )
     }
}

```

## Examples

The project includes a webpack server for running the examples, just run:

```sh
git clone https://github.com/tbolis/react-sketch.git
npm install
npm start
```

and navigate to http://localhost:9999

## Issues

See https://github.com/tbolis/react-sketch/issues

## Changelog

See https://github.com/tbolis/react-sketch/blob/master/CHANGELOG.md

## License

MIT, do remember to add a reference if you find it useful :)

[github-image]: https://img.shields.io/github/release/tbolis/react-sketch.svg
[github-url]: https://github.com/tbolis/react-sketch/releases
[npm-image]: https://img.shields.io/npm/v/react-sketch.svg?style=flat
[npm-url]: https://www.npmjs.com/package/react-sketch
[downloads-image]: https://img.shields.io/npm/dm/react-sketch.svg?style=flat
[downloads-url]: https://www.npmjs.com/package/react-sketch
[travis-image]: https://img.shields.io/travis/tbolis/react-sketch.svg?style=flat
[travis-url]: https://travis-ci.org/tbolis/react-sketch
