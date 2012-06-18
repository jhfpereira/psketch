
/*
 *  P>>Sketch - SimpleBrush
 *  
 *      > J.H.F.P
 *      > February 2012
 */


(function() {
    "use strict";
    
    var SimpleBrush = function() {
        var self = this;
        var prevTimeDiff = -1;
        
        this.info = {
            brushName: "DotsBrush.Dynamic",
            brushCategory: "simple",
            inBetweenSteps: false
        };
        
        this.startPainting = function(ctx, brushPos, brushOptions, timeDiff) {
            /* Initial point */
            self.moveOnPainting(ctx, brushPos, brushOptions, timeDiff);
        };
        
        this.moveOnPainting = function(ctx, brushPos, brushOptions, timeDiff) {
                var color = brushOptions.color;
                var brushSize = brushOptions.size / 2;                
                
                prevTimeDiff = timeDiff;
                
                ctx.save();
                
                if(brushOptions.eraser) {
                    ctx.globalCompositeOperation = "destination-out";
                    color = {
                        r: 255, // dummy value
                        g: 255, // dummy value
                        b: 255, // dummy value
                        alpha: brushOptions.color.alpha
                    }
                }
                
                ctx.fillStyle = "rgba("+ color.r +", "+ color.g +", "+ color.b +", " + color.alpha + ")";
                
                var brushX = brushPos.x,
                    brushY = brushPos.y,
                    spaceInBetweenX = brushX - brushPos.prevX,
                    spaceInBetweenY = brushY - brushPos.prevY,
                    
                    spaceInBetweenMax = (Math.abs(spaceInBetweenX) >= Math.abs(spaceInBetweenY)) ? Math.abs(spaceInBetweenX): Math.abs(spaceInBetweenY),
                    
                    stepX = spaceInBetweenX / spaceInBetweenMax,
                    stepY = spaceInBetweenY / spaceInBetweenMax;
                
                brushSize = Math.floor(brushSize);
                spaceInBetweenMax = Math.abs(spaceInBetweenMax);
                
                var length = Math.sqrt(Math.pow(spaceInBetweenX, 2) + Math.pow(spaceInBetweenY, 2));
                
                ctx.beginPath();
                
                ctx.arc(brushPos.x, brushPos.y, (brushSize * (length / timeDiff) / 5) + 1, 0, 2 * Math.PI, false);
                
                ctx.closePath();
                ctx.fill();
                
                ctx.restore();
        };
        
        this.stopPainting = function(ctx, brushPos, brushOptions) {
            // nothing to do here for now
        };
    };

    if(PSketch && PSketch.addBrush) {
        var brush = new SimpleBrush();
        
        PSketch.addBrush(brush);
    }

})();


