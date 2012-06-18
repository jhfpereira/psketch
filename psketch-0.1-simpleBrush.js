
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
            brushName: "SimpleBrush",
            brushCategory: "simple",
            inBetweenSteps: true
        };
        
        this.startPainting = function(ctx, brushPos, brushOptions, timeDiff) {
            /* Initial point */
            self.moveOnPainting(ctx, brushPos, brushOptions, timeDiff);
        };
        
        this.moveOnPainting = function(ctx, brushPos, brushOptions, timeDiff) {
                var color = brushOptions.color;
                var brushSize = brushOptions.size / 2;
                
                
                ctx.save();
                ctx.beginPath();
                
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
                
                ctx.arc(brushPos.x, brushPos.y, brushSize, 0, 2 * Math.PI, false);
                
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


