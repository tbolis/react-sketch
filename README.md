# react-sketch

[![NPM version][npm-image]][npm-url]
[![NPM downloads][downloads-image]][downloads-url]
[![Build status][travis-image]][travis-url]

A Simple Sketch tool for React based applications

## Installation

```sh
npm install react-sketch
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

Note that react and react-dom have been declared as peer dependencies and **should** exist in your project when using 
react-sketch as a library, if not do the following:

```sh
npm install react --save
npm install react-dom --save
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


[npm-url]: https://www.npmjs.com/package/react-sketch
[downloads-url]: https://www.npmjs.com/package/react-sketch
[travis-url]: https://travis-ci.org/mulesoft/react-sketch