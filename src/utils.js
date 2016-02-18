/**
 * Determine the mouse position
 *
 * @param event the canvas event
 * @returns *[] tuple of position x,y
 * @private
 */
export function mousePosition(event) {
    event = event || window.event;
    var target = event.target || event.srcElement,
        style = target.currentStyle || window.getComputedStyle(target, null),
        borderLeftWidth = parseInt(style['borderLeftWidth'], 10),
        borderTopWidth = parseInt(style['borderTopWidth'], 10),
        rect = target.getBoundingClientRect(),
        _x = event.clientX - borderLeftWidth - rect.left,
        _y = event.clientY - borderTopWidth - rect.top;
    return [_x, _y];
}