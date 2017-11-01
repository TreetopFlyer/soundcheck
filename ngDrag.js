angular.module("ngDrag", [])
.factory("Lerp", [function(){
    var obj = {};

    obj.Get = function(inMin, inAmount, inMax)
    {
        return (inAmount - inMin)/(inMax - inMin);
    };
    obj.Set = function(inMin, inAmount, inMax)
    {
        return inMin + inAmount*(inMax - inMin);
    };
    obj.Clip = function(inMin, inAmount, inMax)
    {
        if(inAmount < inMin)
        {
            return inMin;
        }
        if(inAmount > inMax)
        {
            return inMax;
        }
        return inAmount;
    };

    return obj;
}])
.directive("ngDrag", ["$document", "$parse", "Lerp", function($document, $parse, Lerp)
{
    var obj = {};

    obj.link = function(inScope, inElement, inAttributes)
    {
        var minH = $parse(inAttributes.ngDragHMin)(inScope) || 0;
        var maxH = $parse(inAttributes.ngDragHMax)(inScope) || 1;
        var minV = $parse(inAttributes.ngDragVMin)(inScope) || 0;
        var maxV = $parse(inAttributes.ngDragVMax)(inScope) || 1;

        var horizontal = $parse(inAttributes.ngDragH);
        var vertical = $parse(inAttributes.ngDragV);
        var handler = $parse(inAttributes.ngDragMove)(inScope);
        var handlerStart = $parse(inAttributes.ngDragStart)(inScope);
        var handlerStop = $parse(inAttributes.ngDragStop)(inScope);

        var linker = {};
        linker.element = inElement;
        linker.handlerMove = function($event)
        {
            //coords of AABB within browser window
            var rect = inElement[0].getBoundingClientRect();
            var locX = $event.clientX || $event.touches[0].clientX;
            var locY = $event.clientX || $event.touches[0].clientY;

            //$event.client is the coords of the mouse within the browser window
            var mouseRect = {
                x:Lerp.Clip(0, locX - rect.left, rect.width),
                y:Lerp.Clip(0, locY - rect.top, rect.height)
            };

            var mouseRelative = {
                x:mouseRect.x/rect.width,
                y:mouseRect.y/rect.height
            };

            mouseRelative.x = Lerp.Set(minH, mouseRelative.x, maxH);
            mouseRelative.y = Lerp.Set(minV, mouseRelative.y, maxV);

            if(horizontal.assign)
                horizontal.assign(inScope, mouseRelative.x);

            if(vertical.assign) 
                vertical.assign(inScope, mouseRelative.y);

            if(handler)  
                handler(mouseRelative);

            inScope.$apply();
        };

        linker.handlerDown = function($event)
        {
            $event.preventDefault();
            $document.bind("mousemove", linker.handlerMove);
            $document.bind("mouseup", linker.handlerUp);

            $document.bind("touchmove", linker.handlerMove);
            $document.bind("touchend", linker.handlerUp);

            linker.handlerMove($event);

            if(handlerStart)
            {
                handlerStart($event);
            }
        };

        linker.handlerUp = function($event)
        {
            $document.unbind("mousemove", linker.handlerMove);
            $document.unbind("mouseup", linker.handlerUp);

            $document.unbind("touchmove", linker.handlerMove);
            $document.unbind("touchend", linker.handlerUp);

            if(handlerStop)
            {
                handlerStop($event);
                inScope.$apply();
            }
                
        };

        inElement.bind("mousedown", linker.handlerDown);
        inElement.bind("touchstart", linker.handlerDown);
    };
    return obj;
}]);