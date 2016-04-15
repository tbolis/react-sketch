# react-sketch

[![GitHub release][github-image]][github-url]
[![NPM downloads][downloads-image]][downloads-url]
[![Build status][travis-image]][travis-url]

A Sketch tool for React based applications, backed-up by [FabricJS](http://fabricjs.com/)

![warning-image] _Please note that this module is still in early development!_


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

### Source installation

In order to build from source, read the [relevant instructions](http://fabricjs.com/fabric-intro-part-4#node) first. 

On an ubuntu machine perform the following steps to install, node version should be >=0.4.0 && <1.0.0, tested with 0.12.12. 
This is only for installation (npm install) we can then change back to a newer stable node version

```sh
$ sudo apt-get install libcairo2-dev libjpeg-dev libgif-dev
$ sudo npm install -g canvas
$ npm install
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
Configuration Options

| Option  	        | Type                  | Default 	    | Description  	                                                    |    
|---                |---    	            |---	        |---                                                                |
| tool              | Enumeration (string)  | pencil        | The tool to use, can be select,pencil,circle, rectangle,circle    |
| lineColor         | String                | black         | The color of the line   	                                        |
| lineWidth         | Number                | 1             | The width of the line                                             | 
| fillColor         | String                | transparent   | The fill color of the shape when applicable (e.g. circle)         |
| undoSteps         | Number                | 15            | number of undo/redo steps to maintain                             |
| imageFormat       | String                | png           | image format when calling toDataURL                               | 
| scaleOnResize     | boolean               | false         | Scale the drawing when we resize the canvas                       |         
| defaultData       | JSON or data URL      |               | Default initial data, can be json or URL data accroding to configuration option below, in the case of data URL the initial drawing will be improted as an image |
| defaultDataType   | Enumeration (string)  | json          | The Type of initial data, can be either json or url               | 


## Examples

The project includes a webpack server for running the examples, just run:

```sh
git clone https://github.com/tbolis/react-sketch.git
npm install
npm start
```

and navigate to http://localhost:9999

You can as well check the live showcase here: http://tbolis.github.io/showcase/react-sketch/
                                         
## Issues

See https://github.com/tbolis/react-sketch/issues

## Changelog

See https://github.com/tbolis/react-sketch/blob/master/CHANGELOG.md

## License

MIT, do remember to add a reference if you find it useful :)

[warning-image]: /docs/img/warning.png
[github-image]: https://img.shields.io/github/release/tbolis/react-sketch.svg
[github-url]: https://github.com/tbolis/react-sketch/releases
[npm-image]: https://img.shields.io/npm/v/react-sketch.svg?style=flat
[npm-url]: https://www.npmjs.com/package/react-sketch
[downloads-image]: https://img.shields.io/npm/dm/react-sketch.svg?style=flat
[downloads-url]: https://www.npmjs.com/package/react-sketch
[travis-image]: https://img.shields.io/travis/tbolis/react-sketch.svg?style=flat
[travis-url]: https://travis-ci.org/tbolis/react-sketch
