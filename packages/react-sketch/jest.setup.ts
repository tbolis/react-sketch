// jest matchers for the DOM (toBeInTheDocument, toHaveStyle, ...)
import "@testing-library/jest-dom";
// jsdom has no 2D canvas implementation; fabric needs getContext("2d") to work
import "jest-canvas-mock";
