
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
        
        this.info = {
            brushName: "SimpleBrush.Fine",
            brushCategory: "simple",
            inBetweenSteps: false,
        };
        
        this.startPainting = function(ctx, brushPos, brushOptions, timeDiff) {
            /* Initial point */
            self.moveOnPainting(ctx, brushPos, brushOptions, timeDiff);
        };
        
        this.moveOnPainting = function(ctx, brushPos, brushOptions, timeDiff) {
            var color = brushOptions.color;
            var brushSize = brushOptions.size / 2;        
            
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
            
            ctx.fillStyle = "rgb("+ color.r +", "+ color.g +", "+ color.b +")";
            
            var brushX = brushPos.x,
                brushY = brushPos.y,
                spaceInBetweenX = brushX - brushPos.prevX,
                spaceInBetweenY = brushY - brushPos.prevY,
                
                spaceInBetweenMax = (Math.abs(spaceInBetweenX) >= Math.abs(spaceInBetweenY)) ? Math.abs(spaceInBetweenX): Math.abs(spaceInBetweenY),
                
                stepX = spaceInBetweenX / spaceInBetweenMax,
                stepY = spaceInBetweenY / spaceInBetweenMax;
            
            brushSize = Math.floor(brushSize);
            spaceInBetweenMax = Math.abs(spaceInBetweenMax);
            
            for(var i = 1; i <= spaceInBetweenMax; i+=1) {
                var newBrushPos = { x: brushPos.prevX + (i * stepX), y: brushPos.prevY + (i * stepY)};
                
                ctx.beginPath();
                ctx.arc(newBrushPos.x, newBrushPos.y, (brushSize *  (spaceInBetweenMax / timeDiff / 50)) + 0.3, 0, 2 * Math.PI, false);
                ctx.closePath();
                ctx.fill();
            }
            
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


