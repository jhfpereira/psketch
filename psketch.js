
/**
 * P>>Sketch
 * 
 * P>>Sketch is a simple painting tool to be used in a browser, which supports basic painting operations
 *    Written with the intention to learn more about javascript and the HTML5 canvas element
 *       enjoy :)
 * 
 *
 * Copyright 2012 Jorge H. F. Pereira
 *
 * Released under the MIT and GPL Licenses.
 *
 *
 * author:  Jorge H. F. Pereira
 * version: 0.1
 * source:  http://github.com/jhfpereira/psketch/
 *
 *
 * "I'll see you in another life, when we are both cats."
 *
 */
 

var PSketch;


(function(document, window) {
    "use strict";
    
    /* Disable console logging */
    console.log = function() {};
    
    
    PSketch = new (function() {
        
        var self = this,
            canvasWidth = -1,
            canvasHeight = -1,
            canvasToolbar = null,
            canvasContainer = null,
            canvasBg = null,
            canvasBgContext = null,
            canvas = null,
            context = null,
            
            brushColorShowNode = null,
            canvasColorShowNode = null,
            
            opacityImageDataURL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAIE"
                                  + "lEQVQ4jWP4TwCcOXMGL2YYNWBYGEBIASEwasCwMAAAyhSvrtyMQtgAAAAASUVORK5CYII=",
            
            alreadyInitialized = false,
            prevTimeStamp = -1,
            mouseDown = false,
            
            canvasOptions = {
                color: {
                    r: 255,
                    g: 255,
                    b: 255,
                    alpha: 1.0
                }
            },
            
            brushSelected = -1,
            brushList = [],
            brushOptions = {
                eraser: false,
                color: {
                    r: 0,
                    g: 0,
                    b: 0,
                    alpha: 1.0
                },
                size: 4,
                lineCap: 'round', //'square' //'butt',
                minSize: 1,
                maxSize: 200
            },
        
            brushPrevPos = {
                x: -1,
                y: -1
            },
            
            /* Not changeable through the setOption-method */
            sliderOptions = {
                width: 250
            };
        
        var parseRGBColorCode = function(colorObj) {
              
            var convertValue = function(val) {
                var valPair = [];
                valPair.push(parseInt(val / 16));
                valPair.push(val % 16);
                
                var charCode = "";                
                var charStr = "0123456789abcdef";
                
                for(var i = 0; i < valPair.length; i++) {
                    charCode += charStr.charAt(valPair[i]);
                }
                
                return charCode;
            };
            
            
            return   convertValue(colorObj.r) + convertValue(colorObj.g)
                   + convertValue(colorObj.b) + convertValue(parseInt(colorObj.alpha * 255));
              
        };
        
        
        var parseHTMLColorCode = function(stringCode) {
            
            var colorArr = [];
            
            var parseChar = function(ch) {
                var retVal = false;
                var charStr = "0123456789abcdef";
                
                retVal = charStr.indexOf(ch);
                
                if(retVal == -1) {
                    retVal = null;
                }
                
                return retVal;
            };
            
            if(stringCode.length > 0) {
                if(stringCode.indexOf('#') >= 0) {
                    stringCode = stringCode.slice(1, stringCode.length).toLowerCase();
                }
                
                if(stringCode.length == 8) {
                    for(var i = 0; i  < stringCode.length; i+=2) {
                        var number1 = parseChar(stringCode[i]);
                        var number2 = parseChar(stringCode[i+1]);

                        if(number1 != null && number2 != null) {
                            colorArr.push(16 * number1 + number2);
                        }
                        else {
                            return null;
                        }
                    }
                    
                    return {
                        r:      colorArr[0],
                        g:      colorArr[1],
                        b:      colorArr[2],
                        alpha:  1.0 / 255 * colorArr[3]
                    };
                }
                
            }
            
            return null;
        };
        
        
        var keepHashUpdated = function () {
            
            if(     brushList[brushSelected]
                &&  brushOptions.size
                &&  brushOptions.color
                &&  canvasOptions.color ) {
            
                var paramList = {
                    'brushName':    brushList[brushSelected].info.brushName,
                    'brushSize':    brushOptions.size,
                    'brushColor':   parseRGBColorCode(brushOptions.color),
                    'canvasColor':  parseRGBColorCode(canvasOptions.color)
                };
                
                var concatKeyValueList = [];
                for(var k in paramList) {
                    concatKeyValueList.push(k + ":" + paramList[k]);
                }
                
                window.location.hash = "#" + concatKeyValueList.join(';');
            }
        };
        
        
        var calculateBrushPos = function(e) {
            
            var mouseX = e.clientX,
                mouseY = e.clientY,
            
                brushPosX = mouseX - canvas.offsetLeft,
                brushPosY = mouseY - canvas.offsetTop,
            
                newBrushPos = {
                    x:      brushPosX,
                    y:      brushPosY,
                    prevX:  brushPrevPos.x,
                    prevY:  brushPrevPos.y
                };
            
            brushPrevPos = {
                x: brushPosX,
                y: brushPosY
            };
            
            return newBrushPos;
        };
        
        
        var brushDown = function(e) {
            
            /* Go on only if at least one brush was found and is selected */
            if(brushSelected < 0) {
                return;
            }
            
            /* Left mousebutton -> start painting */
            if(e.which == 1) {
                mouseDown = true;
                prevTimeStamp = e.timeStamp;
                
                if(!brushOptions.eraser) {
                    canvas.style.opacity = brushOptions.color.alpha.toString();
                }
                
                var chosenContext = context;
                if(brushOptions.eraser) {
                    chosenContext = canvasBgContext;
                }
                
                if(e.shiftKey && brushPrevPos.x >= 0 && brushPrevPos.y >= 0) {
                    brushMove(e);
                }
                else {
                    var brushPos = calculateBrushPos(e);
                    brushList[brushSelected].startPainting(chosenContext, brushPos, brushOptions, 0);
                }
                
                canvas.addEventListener("mousemove", brushMove);
                canvas.addEventListener("mouseout", brushOut);
            }
            /* Right mousebutton -> undo current drawing in action */
            else if(e.which == 3) {
                context.clearRect(0, 0, canvasWidth, canvasHeight);
                //brushUp(e);
            }
            
        };
        
        
        var brushMove = function(e) {
            if(mouseDown) {
                var brushPos = calculateBrushPos(e);
                
                var timeDiff = e.timeStamp - prevTimeStamp;
                prevTimeStamp = e.timeStamp;
                
                var chosenContext = context;
                if(brushOptions.eraser) {
                    chosenContext = canvasBgContext;
                }
                
                if(brushList[brushSelected].info.inBetweenSteps) {
                    var brushX = brushPos.x,
                        brushY = brushPos.y,
                        spaceInBetweenX = brushX - brushPos.prevX,
                        spaceInBetweenY = brushY - brushPos.prevY,
                        
                        spaceInBetweenMax = (Math.abs(spaceInBetweenX) >= Math.abs(spaceInBetweenY)) ?
                                                Math.abs(spaceInBetweenX): Math.abs(spaceInBetweenY),
                        
                        stepX = spaceInBetweenX / spaceInBetweenMax,
                        stepY = spaceInBetweenY / spaceInBetweenMax;
                    
                    for(var i = 1; i <= Math.abs(spaceInBetweenMax); i+=1) {
                        var newBrushPos = { x:     brushPos.prevX + (i * stepX),
                                            y:     brushPos.prevY + (i * stepY),
                                            prevX: brushPos.prevX,
                                            prevY: brushPos.prevY               };
                        
                        brushList[brushSelected].moveOnPainting(chosenContext, newBrushPos,
                                                                brushOptions, timeDiff);
                    }
                }
                else {
                    timeDiff = 100;
                    brushList[brushSelected].moveOnPainting(chosenContext, brushPos, brushOptions, timeDiff);
                }
            }
        };

        
        var brushUp = function(e) {
            if(mouseDown) {
                mouseDown = false;
            
                var brushPos = calculateBrushPos(e);
                brushList[brushSelected].stopPainting(context, brushPos, brushOptions);
            
                canvas.removeEventListener("mousemove", brushMove);
                canvas.removeEventListener("mouseout", brushOut);
                
                if(!brushOptions.eraser && !e.shiftKey) {
                    /*
                     * Get brushlines and merge it with the canvas in the background
                     *  (in a really, really dirty way)
                     */
                    canvasBgContext.save();
                    canvasBgContext.globalAlpha = brushOptions.color.alpha;
                    canvasBgContext.drawImage(context.canvas, 0, 0);
                    canvasBgContext.restore();
                    
                    context.clearRect(0, 0, canvasWidth, canvasHeight);
                    
                    /*
                     * Reset the top canvas opacity to its default value
                     */
                    canvas.style.opacity = "1.0";
                }
            }
        };
        
        
        var brushOut = function(e) {
            brushUp(e);
        };
        
        
        var imageUpload = function(e) {
            var xPos = e.clientX;
            var yPos = e.clientY - e.target.offsetTop;
            
            var file = e.dataTransfer.files[0];
            
            var img = document.createElement("img");
            var reader = new FileReader();
            
            reader.addEventListener("load", function(e) {
                img.src = e.target.result;
                
                img.addEventListener("load", function() {
                    canvasBgContext.drawImage(img, xPos, yPos, img.width, img.height);
                });
                
            });
            reader.readAsDataURL(file);
            
            e.preventDefault();
        };
        
        
        var chooseBrush = function(pos) {
            if(pos >= 0 && pos < brushList.length) {
                brushSelected = pos;
                
                keepHashUpdated();
                
                console.log("New Brush: " + pos + " -> "  + brushList[pos].info.brushName);
            }
            else {
                return false;
            }
            
            return true;
        };
        
        
        var chooseBrushByName = function(name) {
            if(name.length > 0) {
                
                for(var i = 0; i < brushList.length; i++) {
                    if(name == brushList[i].info.brushName) {
                        chooseBrush(i);
                        return true;
                    }
                }
                
                if(brushList.length > 0) {
                    chooseBrush(0);
                }
            }
            
            return false;
        };
        
        
        var setBrushSize = function(sizeValue) {
            
            if(typeof sizeValue === 'number') {
                brushOptions.size = Math.round(sizeValue);
                
                keepHashUpdated();
                
                console.log("New Brush-Size: " + brushOptions.size);
            
                return true;
            }
            else {
                return false;
            }
        };
        
        
        var setBrushColor = function(type, newValue) {
            
            if(     (type == "alpha" && (newValue >= 0.0 || newValue <= 1.0))
                ||  (type != "alpha" && (newValue >= 0 || newValue <= 255))     ) {
                
                if(type != "alpha") {
                    newValue = parseInt(newValue);
                }
                
                switch(type) {
                    case "red":
                        brushOptions.color.r = newValue;
                        break;
                    case "green":
                        brushOptions.color.g = newValue;
                        break;
                    case "blue":
                        brushOptions.color.b = newValue;
                        break;
                    case "alpha":
                        brushOptions.color.alpha = newValue;
                        break;
                    default:
                        return false;
                }
                
                if(brushColorShowNode) {
                    brushColorShowNode.style.background =   "rgba("        + brushOptions.color.r
                                                                    + ", " + brushOptions.color.g
                                                                    + ", " + brushOptions.color.b
                                                                    + ", " + brushOptions.color.alpha + ")";
                }
                
                keepHashUpdated();
                
                console.log("New Brush-Color: rgba("        + brushOptions.color.r
                                                     + ", " + brushOptions.color.g
                                                     + ", " + brushOptions.color.b
                                                     + ", " + brushOptions.color.alpha + ")" );
                return true;
            }
            
            return false;
        };
        
        
        var setCanvasColor = function(type, newValue) {
            
            if(     (type == "alpha" && (newValue >= 0.0 || newValue <= 1.0))
                ||  (type != "alpha" && (newValue >= 0 || newValue <= 255))     ) {
                
                if(type != "alpha") {
                    newValue = parseInt(newValue);
                }
                
                switch(type) {
                    case "red":
                        canvasOptions.color.r = newValue;
                        break;
                    case "green":
                        canvasOptions.color.g = newValue;
                        break;
                    case "blue":
                        canvasOptions.color.b = newValue;
                        break;
                    case "alpha":
                        canvasOptions.color.alpha = newValue;
                        break;
                    default:
                        return false;
                }
                
                if(canvasColorShowNode) {
                    canvasColorShowNode.style.background = "rgba("        + canvasOptions.color.r
                                                                   + ", " + canvasOptions.color.g
                                                                   + ", " + canvasOptions.color.b
                                                                   + ", " + canvasOptions.color.alpha + ")";
                }
                
                keepHashUpdated();
                
                canvasBg.style.background = "rgba("        + canvasOptions.color.r
                                                    + ", " + canvasOptions.color.g
                                                    + ", " + canvasOptions.color.b
                                                    + ", " + canvasOptions.color.alpha + ")";
                return true;
            }
            
            return false;
        };
        
        
        var toggleEraser = function(e) {
            var callerNodeParent = e.target.parentNode;
            
            brushOptions.eraser = !brushOptions.eraser;
            
            if(brushOptions.eraser) {
                callerNodeParent.className += " activeItem";
            }
            else {
                var classArr = callerNodeParent.className.split(' ');
                
                for(var i = 0; i < classArr.length; i++) {
                    if(classArr[i] == "activeItem") {
                        classArr.splice(i);
                        break;
                    }
                }
                
                callerNodeParent.className = classArr.join(' ');
            }
            
            return brushOptions.eraser;
        };
        
        
        var shortcutPressed = function(e) {
            //console.log("keyPressed:", e.which || e.keyCode);
            //e.ctrlKey
            //e.shiftKey
            //e.altKey
            //e.metaKey
            
            console.log(e, e.which, e.keyCode);
            
            switch(e.which || e.keyCode) {
                case 73:    /* I */
                case 105:   /* i */
                        /* Mirror canvasdata horizontally -> i- or I-Key */
                        var imgDat = canvasBgContext.getImageData(0, 0, canvasBg.width, canvasBg.height);
                        
                        for(var y = 0; y < imgDat.height; y++) {
                            var xBegin = y * (imgDat.width * 4);
                            for(var x = 0; x < (imgDat.width * 4) / 2; x+=4) {
                                var index = xBegin + x;
                                var lastLineIndex = xBegin + (((imgDat.width - 1) * 4) - x);
                                
                                var r = imgDat.data[index  ];
                                var g = imgDat.data[index+1];
                                var b = imgDat.data[index+2];
                                var a = imgDat.data[index+3];
                                
                                imgDat.data[index  ]    = imgDat.data[lastLineIndex  ];
                                imgDat.data[index+1]    = imgDat.data[lastLineIndex+1];
                                imgDat.data[index+2]    = imgDat.data[lastLineIndex+2];
                                imgDat.data[index+3]    = imgDat.data[lastLineIndex+3];
                                
                                imgDat.data[lastLineIndex  ]    = r;
                                imgDat.data[lastLineIndex+1]    = g;
                                imgDat.data[lastLineIndex+2]    = b;
                                imgDat.data[lastLineIndex+3]    = a;
                            }
                        }
                        
                        canvasBgContext.putImageData(imgDat, 0, 0);
                    break;
                case 66:    /* B */
                case 98:    /* b */
                        
                        /* Convert canvasdata to black and white -> ctrl+b- or ctrl+B-Keyshortcut */
                        if(!e.ctrlKey) {
                            break;
                        }
                        
                        var imgDat = canvasBgContext.getImageData(0, 0, canvasBg.width, canvasBg.height);
                        
                        for(var y = 0; y < imgDat.height; y++) {
                            var xBegin = y * (imgDat.width * 4);
                            for(var x = 0; x < (imgDat.width * 4); x+=4) {
                                var i = xBegin + x;
                                
                                var r = imgDat.data[i  ],
                                    g = imgDat.data[i+1],
                                    b = imgDat.data[i+2];
                                    
                                //var average = Math.max(r, Math.max(g, b))
                                //              + Math.min(r, Math.min(g, b)) / 2;  // lightness
                                var average = (r + g + b) / 3;                      // average
                                //var average = (r * 0.21 + g * 0.71 + b * 0.07);   // luminosity
                                
                                average = Math.floor(average);    
                                
                                imgDat.data[i  ]    = average;
                                imgDat.data[i+1]    = average;
                                imgDat.data[i+2]    = average;
                                //imgDat.data[i+3] // leaving alpha the way it is
                             }
                        }
                        
                        canvasBgContext.putImageData(imgDat, 0, 0);
                        e.preventDefault();
                    break;
            }
        };
        
        
        var clearCanvas = function() {
            if(confirm("Are your sure?")) {
                canvasBgContext.clearRect(0, 0, canvasWidth, canvasHeight);
            }
        };
        
        
        var saveCanvas = function(alpha) {
            /*
             *  Open a new window (tab) and pass the image as a dataURL to it
             */
            
            var chosenCanvas = canvasBg;
            
            /*
             * With backgroundcolor?
             */
            if(!alpha) {
                
                var chosenCanvasContext = chosenCanvas.getContext("2d");
                chosenCanvasContext.save();
                chosenCanvasContext.globalCompositeOperation = "destination-over";
                chosenCanvasContext.fillStyle = canvasBg.style.backgroundColor;
                chosenCanvasContext.rect(0, 0, canvasWidth, canvasHeight);
                chosenCanvasContext.fill();
                chosenCanvasContext.restore();
            }
            
            window.open(chosenCanvas.toDataURL("image/png"), 'Image');
            
        };
        
        
        var createSliderNode = function(sliderWidth, caption, minValue, maxValue, initialValue, callback) {
            var momSliderPos = 0;
            var mousePrevX = -1;
            var valueToWrite = false;
            
            var map = function(x, in_min, in_max, out_min, out_max) {
                return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
            };
            
            
            var positionateSlider = function(momPos) {
                if(momPos >= 0 && momPos <= (sliderWidth - 10)) {
                    sliderKnob.style.left = (momPos - 6) + "px";
                    momSliderPos = momPos;
                    return true;
                } else {
                    false;
                }
            };
            
            
            var bodyEventhandlerMove = function(e) {
                var mouseMomX = e.clientX;
                
                var diff = e.clientX - mousePrevX;
                
                momSliderPos += diff;
                
                if(positionateSlider(momSliderPos)) {
                    var newValue = map(momSliderPos, 0, (sliderWidth - 10), minValue, maxValue);
                    callback(newValue);
                    valueToWrite = false;
                
                    mousePrevX = mouseMomX;
                }
                else {
                    /* Reverte Sliderstep */
                    momSliderPos -= diff;
                }
                
                e.preventDefault();
            };
            
            var bodyEventhandlerMouseUp = function(e) {
                
                document.body.removeEventListener("mousemove", bodyEventhandlerMove);
                document.body.removeEventListener("mouseup", bodyEventhandlerMouseUp);
                
                /*
                var newValue = map(momSliderPos, 0, (sliderWidth - 10 - 10 ), minValue, maxValue);
                callback(newValue);
                
                valueToWrite = false;
                */
                
                e.preventDefault();
            };
            
            
            var sliderNode = document.createElement("div");
            sliderNode.style.width = sliderWidth + "px";
            sliderNode.setAttribute("class", "sliderItem");
            sliderNode.addEventListener("mouseleave", function(e) {
                
                if(valueToWrite) {
                    bodyEventhandlerMouseUp(e);
                    valueToWrite = false;
                }
                
                e.preventDefault();
            });
                
                if(caption.length > 0) {
                    var sliderCaption = document.createElement("a");
                    sliderCaption.setAttribute("class", "sliderCaption");
                    sliderCaption.innerHTML = caption;
                    sliderNode.appendChild(sliderCaption);
                }
                
                var sliderInnerBox = document.createElement("div");
                sliderInnerBox.setAttribute("class", "sliderInnerBox");
                sliderInnerBox.style.width = (sliderWidth - 10) + "px";
                sliderInnerBox.addEventListener("mousedown", function(e) {
                    
                    var newPos = (e.offsetX || e.layerX) - sliderInnerBox.offsetLeft;
                    var newValue = map(newPos, 0, (sliderWidth - 10), minValue, maxValue);
                    callback(newValue);
                    positionateSlider(newPos);
                    
                    e.preventDefault();
                });
                sliderNode.appendChild(sliderInnerBox);
                
                    var sliderKnob = document.createElement("div");
                    sliderKnob.setAttribute("class", "sliderKnob");
                    sliderKnob.addEventListener("mousedown", function(e) {
                        mousePrevX = e.clientX;
                        
                        document.body.addEventListener("mousemove", bodyEventhandlerMove);
                        document.body.addEventListener("mouseup", bodyEventhandlerMouseUp);
                        
                        e.preventDefault();
                        e.stopPropagation();
                    });
                    
                    sliderInnerBox.appendChild(sliderKnob);
                    momSliderPos = map(initialValue, minValue, maxValue, 0, (sliderWidth - 10));
                    positionateSlider(momSliderPos);
                
            return sliderNode;
        }
        
        
        var setOption = function(key, value) {
            switch(key) {
                /* Brush */
                case "brushName":
                    chooseBrushByName(value);
                    break;
                case "brushSize":
                    value = parseInt(value);
                    if(value >= brushOptions.minSize && value <= brushOptions.maxSize) {
                        setBrushSize(value);
                        return true;
                    }
                    break;
                case "brushColor":
                    var colorArr = parseHTMLColorCode(value);
                    if(colorArr != null) {
                        brushOptions.color.r        = colorArr.r;
                        brushOptions.color.g        = colorArr.g;
                        brushOptions.color.b        = colorArr.b;
                        brushOptions.color.alpha    = colorArr.alpha;
                        return true;
                    }
                    break;
                
                /* Canvas */
                case "canvasColor":
                    var colorArr = parseHTMLColorCode(value);
                    if(colorArr != null) {
                        canvasOptions.color.r       = colorArr.r;
                        canvasOptions.color.g       = colorArr.g;
                        canvasOptions.color.b       = colorArr.b;
                        canvasOptions.color.alpha   = colorArr.alpha;
                        return true;
                    }
                    break;
            }
            
            return false;
        }
        
        
        this.setOptions = function(options) {
            if(!alreadyInitialized) {
                for(var key in options) {
                    setOption(key, options[key]);
                }
            }
            else {
                console.log("Info: P>>Sketch already initilaized!");
            }
            
            return self;
        };

        
        this.addBrush = function(brush) {
            brush.info.brushName = brush.info.brushName.replace(":", "").replace(";", "");
            var brushName = brush.info.brushName;
            
            if(!alreadyInitialized) {
                if(brushName.length == 0) {
                    console.log("Info: Brushname is too short/not existent!");
                    return self;
                }
                                
                for(var i = 0; i < brushList.length; i++) {
                    
                    if(brushName === brushList[i].info.brushName) {
                        console.log("Warning: Brush \"" + brushName + "\" is already known!");
                        return self;
                    }
                }
                
                brushList.push(brush);
            }
            else {
                console.log("Info: P>>Sketch already initilaized!");
            }
            
            return self;
        };
        
        
        this.init = function() {
            
            canvasWidth = window.innerWidth;
            canvasHeight = window.innerHeight - 30;
            
            /* Resize every canvas in use, every time the window is resized by the user; only let it
                become bigger, but never smaller in size */
            window.addEventListener("resize", function(e) {
                var newWidth = e.target.innerWidth;
                var newHeight = e.target.innerHeight - 30;
                
                /* Keep the current canvas imagedata for a refill, after the canvas is resized to a
                    bigger size */
                var canvasBgData = canvasBgContext.getImageData(0, 0, canvasWidth, canvasHeight);
                
                if(newWidth > canvasWidth) {
                    var oldCanvasWidth = canvasWidth;
                    
                    /* Resize the canvas in its width */
                    canvasWidth = newWidth;
                    canvasBg.setAttribute("width", canvasWidth);
                    canvas.setAttribute("width", canvasWidth);
                    
                    /* Refill canvas with saved imagedata */
                    canvasBgContext.putImageData(canvasBgData, 0, 0, oldCanvasWidth, canvasHeight);
                }
                
                if(newHeight > canvasHeight) {
                    var oldCanvasHeight = canvasHeight;
                    
                    /* Resize the canvas in its height */
                    canvasHeight = newHeight;
                    canvasBg.setAttribute("height", canvasHeight);
                    canvas.setAttribute("height", canvasHeight);
                    
                    /* Refill canvas with saved imagedata */
                    canvasBgContext.putImageData(canvasBgData, 0, 0, canvasWidth, oldCanvasHeight);
                }
            });
            
            
            /* Set up the opacity indicator image */
            document.body.style.backgroundImage = "url('"+opacityImageDataURL+"')";
            
            /* Bind a key listener to the body element */
            document.body.addEventListener("keydown", shortcutPressed);
            
            /* Prevent textselection (trying) */
            document.body.addEventListener("selectstart", function (e) { e.preventDefault(); return false; });
            
            
            /*
             * Load all possible options through the locationhash,
             *      if given overwrites options set through the 'setOptions'-method!
             */
            var hash = window.location.hash;
            if(hash.length > 1) {
                hash = hash.slice(1, hash.length);
                var hashArr = hash.split(';');
                
                for(var i = 0; i < hashArr.length; i++) {
                    var keyValuePair = hashArr[i].split(':');
                    
                    if(keyValuePair.length == 2) {
                        var key = keyValuePair[0];
                        var value = keyValuePair[1];
                        
                        setOption(key, value);
                    }
                }
            }
            
            
            /*
             *  Toolbar
             */
            canvasToolbar = document.createElement("div");
            canvasToolbar.setAttribute("id", "toolbar");
            
            /* Fill the toolbar */
                var appNameNode = document.createElement("a");
                appNameNode.setAttribute("id", "appNameText");
                appNameNode.innerHTML = 'P<span id="appNameHighlight">&gt;&gt;</span>Sketch';
                canvasToolbar.appendChild(appNameNode);
                
                var menueListNode = document.createElement("ul");
                menueListNode.setAttribute("id", "menueList");
                canvasToolbar.appendChild(menueListNode);
                    
                    /*
                     * Create the brush itemlist
                     */
                    var brushItems = [];
                    for(var i = 0; i < brushList.length; i++) {
                        (function(momPos) {
                            brushItems.push({ caption:       brushList[i].info.brushName,
                                              clickCallback: function() { chooseBrush(momPos); } });
                        })(i);
                    }
                    
                    /* Show an info entry, when no brushes were found */
                    if(brushList.length == 0) {
                        brushItems.push({ caption:       "Brushes were not found!",
                                          clickCallback: function() {}              });
                    }
                    
                    
                    /* Fill the menuelist with menueitems */
                    var menueItemsArr = [
                        {
                            id:            "brushItem",
                            type:          "caption",
                            caption:       "brush",
                            clickCallback: function() {  },
                            hoverCallback: function() {  },
                            subItemsList:  brushItems
                        },
                        {
                            id:            "sizeItem",
                            type:          "caption",
                            caption:       "size",
                            clickCallback: function() {  },
                            hoverCallback: function() {  },
                            subSliderList: [
                                { caption:      "",
                                  minValue:     brushOptions.minSize,
                                  maxValue:     brushOptions.maxSize,
                                  initialValue: brushOptions.size,
                                  callback:     function(newValue) { setBrushSize(newValue); } }
                            ]
                        },
                        {
                            id:            "colorItem",
                            type:          "caption",
                            caption:       "color",
                            clickCallback: function() {  },
                            hoverCallback: function() {  },
                            subSliderList: [
                                {   caption:     "red",
                                    minValue:     0,
                                    maxValue:     255,
                                    initialValue: brushOptions.color.r,
                                    callback:     function(newValue) { setBrushColor("red", newValue) }
                                },
                                {   caption:      "green",
                                    minValue:     0,
                                    maxValue:     255,
                                    initialValue: brushOptions.color.g,
                                    callback:     function(newValue) { setBrushColor("green", newValue) }
                                },
                                {   caption:      "blue",
                                    minValue:     0,
                                    maxValue:     255,
                                    initialValue: brushOptions.color.b,
                                    callback:     function(newValue) { setBrushColor("blue", newValue) }
                                },
                                {   caption:     "alpha",
                                    minValue:     0.0,
                                    maxValue:     1.0,
                                    initialValue: brushOptions.color.alpha,
                                    callback:     function(newValue) { setBrushColor("alpha", newValue) }
                                }
                            ]
                        },
                        {
                            id:            "brushColorShowItem",
                            type:          "colorShowBox",
                            clickCallback: function() {  },
                            hoverCallback: function() {  },
                            colorShowBox:  { callback: function(node) { brushColorShowNode = node; } }
                        },
                        {
                            id:            "canvasItem",
                            type:          "caption",
                            caption:       "canvas",
                            clickCallback: function() {  },
                            hoverCallback: function() {  },
                            subSliderList: [
                                {   caption:      "red",
                                    minValue:     0,
                                    maxValue:     255,
                                    initialValue: canvasOptions.color.r,
                                    callback:     function(newValue) { setCanvasColor("red", newValue) }
                                },
                                {   caption:      "green",
                                    minValue:     0,
                                    maxValue:     255,
                                    initialValue: canvasOptions.color.g,
                                    callback:     function(newValue) { setCanvasColor("green", newValue) }
                                },
                                {   caption:      "blue",
                                    minValue:     0,
                                    maxValue:     255,
                                    initialValue: canvasOptions.color.b,
                                    callback:     function(newValue) { setCanvasColor("blue", newValue) }
                                },
                                {   caption:      "alpha",
                                    minValue:     0.0,
                                    maxValue:     1.0,
                                    initialValue: canvasOptions.color.alpha,
                                    callback:     function(newValue) { setCanvasColor("alpha", newValue); }
                                }
                            ]
                        },
                        {
                            id: "canvasColorShowItem",
                            type: "colorShowBox",
                            clickCallback: function() {  },
                            hoverCallback: function() {  },
                            colorShowBox: { callback: function(node) { canvasColorShowNode = node; } }
                        },
                        
                        
                        
                        /* Actions */
                        {
                            id:            "saveItem",
                            type:          "caption",
                            caption:       "save",
                            clickCallback: function(e) { saveCanvas(false); },
                            hoverCallback: function(e) {  }
                        },
                        {
                            id:            "saveAlphaItem",
                            type:          "caption",
                            caption:       "save+alpha",
                            clickCallback: function(e) { saveCanvas(true); },
                            hoverCallback: function(e) {  }
                        },
                        {
                            id:            "eraserItem",
                            type:          "caption",
                            caption:       "eraser",
                            clickCallback: function(e) { toggleEraser(e); },
                            hoverCallback: function(e) {  }
                        },
                        {
                            id:            "clearItem",
                            type:          "caption",
                            caption:       "clear",
                            clickCallback: function(e) { clearCanvas(e); },
                            hoverCallback: function(e) {  }
                        }
                    ];
                    
                    for(var i = 0; i < menueItemsArr.length; i++) {
                        var menueItem = document.createElement("li");
                        menueItem.setAttribute("class", "menueItem");
                        menueItem.setAttribute("id", menueItemsArr[i].id)
                        
                        if(menueItemsArr[i].type == "caption") {
                            var menueItemContent = document.createElement("a");
                            menueItemContent.setAttribute("class", "menueItemContent");
                            menueItemContent.innerHTML = menueItemsArr[i].caption;
                            menueItemContent.addEventListener("click", menueItemsArr[i].clickCallback);
                            menueItemContent.addEventListener("mouseover", menueItemsArr[i].hoverCallback);
                            menueItem.appendChild(menueItemContent);
                        }
                        else if(menueItemsArr[i].type == "colorShowBox") {
                            var menueItemContent = document.createElement("div");
                            menueItemContent.setAttribute("class", "menueItemContentColorBox");
                            menueItemContent.style.background = "url('"+opacityImageDataURL+"')";
                            
                            var menueItemContentInner = document.createElement("div");
                            menueItemContentInner.setAttribute("class", "menueItemContentColorBoxInner");
                            menueItemContent.appendChild(menueItemContentInner);
                            
                            menueItemsArr[i].colorShowBox.callback(menueItemContentInner);
                            
                            menueItem.appendChild(menueItemContent);
                        }
                        
                        menueListNode.appendChild(menueItem);
                        
                        /* Create a sublist if given */
                        if(menueItemsArr[i].subItemsList && menueItemsArr[i].subItemsList.length > 0) {
                            /* Sublistitems */
                            var subListContainer = document.createElement("div");
                            subListContainer.setAttribute("id", menueItemsArr[i].id + "SubList");
                            subListContainer.setAttribute("class", "itemSubList");
                            var subListMenueList = document.createElement("ul");
                            subListContainer.appendChild(subListMenueList);
                            
                            /* Fill the sublist with sublistitems */
                            for(var j = 0; j < menueItemsArr[i].subItemsList.length; j++) {
                                var subListMenueItem = document.createElement("li");
                                subListMenueItem.innerHTML = menueItemsArr[i].subItemsList[j].caption;
                                subListMenueItem.addEventListener("click",
                                    menueItemsArr[i].subItemsList[j].clickCallback);
                                //subListMenueItem.addEventListener("mouseover",
                                //  menueItemsArr[i].subItemsList[j].hoverCallback);
                                subListMenueList.appendChild(subListMenueItem);
                            }
                            
                            menueItem.appendChild(subListContainer);
                        }
                        else if (    menueItemsArr[i].subSliderList
                                  && menueItemsArr[i].subSliderList.length > 0 ) {
                            /* Sublistsliders */
                            var subListContainer = document.createElement("div");
                            subListContainer.setAttribute("id", menueItemsArr[i].id + "SubList");
                            subListContainer.setAttribute("class", "itemSubList");
                            
                            /* Fill the sublist with sublistitems */
                            for(var j = 0; j < menueItemsArr[i].subSliderList.length; j++) {
                                var subListSlider =
                                    createSliderNode(   sliderOptions.width,
                                                        menueItemsArr[i].subSliderList[j].caption,
                                                        menueItemsArr[i].subSliderList[j].minValue,
                                                        menueItemsArr[i].subSliderList[j].maxValue,
                                                        menueItemsArr[i].subSliderList[j].initialValue,
                                                        menueItemsArr[i].subSliderList[j].callback  );
                                subListContainer.appendChild(subListSlider);
                            }
                            
                            menueItem.appendChild(subListContainer);
                        }
                    }
            
            
            /*
             *  CanvasContainer
             */
            canvasContainer = document.createElement("div");
            canvasContainer.setAttribute("id", "canvasContainer");
            
            
            /*
             *  CanvasBg
             */
            canvasBg = document.createElement("canvas");
            canvasBg.setAttribute("id", "canvasBg");
            canvasBg.setAttribute('width', canvasWidth + "px");
            canvasBg.setAttribute('height', canvasHeight + "px");
            canvasBg.style.position = "absolute";
            canvasBg.style.zIndex = "2";
            canvasBg.style.background = "rgba("        + canvasOptions.color.r
                                                + ", " + canvasOptions.color.g
                                                + ", " + canvasOptions.color.b
                                                + ", " + canvasOptions.color.alpha + ")";
            canvasBg.style.left = canvasBg.offsetX + "px";
            canvasBg.style.top = canvasBg.offsetY + "px";
            canvasBg.innerHTML = "Your browser doesn't support the canvas element!";
            
            
            /*
             *  Canvas
             */
            canvas = document.createElement("canvas");
            canvas.setAttribute("id", "canvas");
            canvas.setAttribute('width', canvasWidth + "px");
            canvas.setAttribute('height', canvasHeight + "px");
            canvas.style.position = "absolute";
            canvas.style.zIndex = "3";
            canvas.style.left = canvas.offsetX + "px";
            canvas.style.top = canvas.offsetY + "px";
            canvas.style.cursor = "crosshair";
            
            /* Append each node to its parentnode */
            canvasContainer.appendChild(canvasBg);
            canvasContainer.appendChild(canvas);
            document.body.appendChild(canvasToolbar);
            document.body.appendChild(canvasContainer);
            
            canvasBgContext = canvasBg.getContext("2d");
            canvasBgContext.clearRect(0, 0, canvasWidth, canvasHeight);
            
            context = canvas.getContext("2d");
            context.clearRect(0, 0, canvasWidth, canvasHeight);
            
            if(brushList.length > 0) {
            
                canvas.addEventListener("mousedown", brushDown);
                canvas.addEventListener("mouseup", brushUp);
                canvas.addEventListener("dragover", function(e) { e.preventDefault(); });
                canvas.addEventListener("drop", imageUpload);
                
                /* Disable the contextmenu if possible; right mouse button is used to undo
                    the current drawing in action */
                canvas.addEventListener("contextmenu", function(e) { e.stopPropagation();
                                                                     e.preventDefault();
                                                                     return false;          });
                
                alreadyInitialized = true;
                
                if(brushSelected == -1) {
                    chooseBrush(0);
                }
            }
            else {
                console.log("Warning: No brushes were loaded!");
            }
            
            
            /* Initialize the colorShowBoxes by invoking the colorsetting-functions with an initial value */
            setBrushColor("alpha", brushOptions.color.alpha);
            setCanvasColor("alpha", canvasOptions.color.alpha);
            
            /* Keep locationhash up to date */
            keepHashUpdated();
            
            /* Ask the user if he really wants to leave (without saving?)) */
            window.addEventListener("beforeunload", function(e) {
                e.stopPropagation();
                e.preventDefault();
            });
            
            return self;
        };

    });


})(document, window);


