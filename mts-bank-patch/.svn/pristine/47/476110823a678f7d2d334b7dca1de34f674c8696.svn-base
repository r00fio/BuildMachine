(function($){
    var GestureHandler = {
        init: function(masterInstance, slaveHandler) {
            this.base = masterInstance;
            this.slaveHandler = slaveHandler;

            if (slaveHandler) {
                slaveHandler.base.ev_types.start = "touchstart.owl mousedown.owl";
                slaveHandler.base.ev_types.move = "touchmove.owl mousemove.owl";
                slaveHandler.base.ev_types.end = "touchend.owl touchcancel.owl mouseup.owl";

                var base = this.base;
                base.goTo = function() {
                    Object.getPrototypeOf(base).goTo.apply(base, arguments);
                    if (arguments[1]) {
                        slaveHandler.base.goTo.apply(slaveHandler.base, arguments);
                    }
                }
                base.jumpTo = function() {
                    Object.getPrototypeOf(base).jumpTo.apply(base, arguments);
                    slaveHandler.base.jumpTo.apply(slaveHandler.base, arguments);
                }
            }

            this.locals = {
                offsetX : 0,
                offsetY : 0,
                baseElWidth : 0,
                relativePos : 0,
                position: null,
                minSwipe : null,
                maxSwipe: null,
                sliding : null,
                dargging: null,
                targetElement : null
            };
        },

        getTouches: function(event) {
            if (event.touches !== undefined) {
                return {
                    x : event.touches[0].pageX,
                    y : event.touches[0].pageY
                };
            }

            if (event.touches === undefined) {
                if (event.pageX !== undefined) {
                    return {
                        x : event.pageX,
                        y : event.pageY
                    };
                }
                if (event.pageX === undefined) {
                    return {
                        x : event.clientX,
                        y : event.clientY
                    };
                }
            }
        },

        swapEvents: function(gestureHandler) {
            return function(type) {
                var base = gestureHandler.base;
                if (type === "on") {
                    $(document).on(base.ev_types.move, gestureHandler.dragMove(gestureHandler));
                    $(document).on(base.ev_types.end, gestureHandler.dragEnd(gestureHandler));
                } else if (type === "off") {
                    $(document).off(base.ev_types.move);
                    $(document).off(base.ev_types.end);
                }
            };
        },

        dragStart: function(gestureHandler) {
            return function(event) {
                var ev = event.originalEvent || event || window.event,
                    position,
                    base = gestureHandler.base,
                    locals = gestureHandler.locals;

                if (ev.which === 3) {
                    return false;
                }
                if (base.itemsAmount <= base.options.items) {
                    return;
                }
                if (base.isCssFinish === false && !base.options.dragBeforeAnimFinish) {
                    return false;
                }
                if (base.isCss3Finish === false && !base.options.dragBeforeAnimFinish) {
                    return false;
                }

                if (base.options.autoPlay !== false) {
                    window.clearInterval(base.autoPlayInterval);
                }

                if (base.browser.isTouch !== true && !base.$owlWrapper.hasClass("grabbing")) {
                    base.$owlWrapper.addClass("grabbing");
                }

                base.newPosX = 0;
                base.newRelativeX = 0;

                base.$owlWrapper.css(base.removeTransition());

                position = base.$owlWrapper.position();
                locals.relativePos = position.left;

                locals.offsetX = gestureHandler.getTouches(ev).x - position.left;
                locals.offsetY = gestureHandler.getTouches(ev).y - position.top;

                gestureHandler.swapEvents(gestureHandler)("on");

                locals.sliding = false;
                locals.targetElement = ev.target || ev.srcElement;

                if (gestureHandler.slaveHandler) {
                    gestureHandler.slaveHandler.dragStart(gestureHandler.slaveHandler)(event);
                }
            };
        },

        dragMove: function(gestureHandler) {
            return function(event) {
                var ev = event.originalEvent || event || window.event,
                    minSwipe,
                    maxSwipe,
                    base = gestureHandler.base,
                    locals = gestureHandler.locals;

                base.newPosX = gestureHandler.getTouches(ev).x - locals.offsetX;
                base.newPosY = gestureHandler.getTouches(ev).y - locals.offsetY;
                base.newRelativeX = base.newPosX - locals.relativePos;

                if (typeof base.options.startDragging === "function" && locals.dragging !== true && base.newRelativeX !== 0) {
                    locals.dragging = true;
                    base.options.startDragging.apply(base, [base.$elem]);
                }

                if ((base.newRelativeX > 8 || base.newRelativeX < -8) && (base.browser.isTouch === true)) {
                    if (ev.preventDefault !== undefined) {
                        ev.preventDefault();
                    } else {
                        ev.returnValue = false;
                    }
                    locals.sliding = true;
                }

                if ((base.newPosY > 10 || base.newPosY < -10) && locals.sliding === false) {
                    $(document).off("touchmove.owl");
                }

                minSwipe = function () {
                    return base.newRelativeX / 5;
                };

                maxSwipe = function () {
                    return base.maximumPixels + base.newRelativeX / 5;
                };

                base.newPosX = Math.max(Math.min(base.newPosX, minSwipe()), maxSwipe());
                if (base.browser.support3d === true) {
                    base.transition3d(base.newPosX);
                } else {
                    base.css2move(base.newPosX);
                }
            };
        },

        dragEnd: function(gestureHandler) {
            return function(event) {
                var ev = event.originalEvent || event || window.event,
                    newPosition,
                    handlers,
                    owlStopEvent,
                    base = gestureHandler.base,
                    locals = gestureHandler.locals;

                ev.target = ev.target || ev.srcElement;

                locals.dragging = false;

                if (base.browser.isTouch !== true) {
                    base.$owlWrapper.removeClass("grabbing");
                }

                if (base.newRelativeX < 0) {
                    base.dragDirection = base.owl.dragDirection = "left";
                } else {
                    base.dragDirection = base.owl.dragDirection = "right";
                }

                if (base.newRelativeX !== 0) {
                    newPosition = base.getNewPosition();
                    base.goTo(newPosition, false, "drag");
                    if (locals.targetElement === ev.target && base.browser.isTouch !== true) {
                        $(ev.target).on("click.disable", function (ev) {
                            ev.stopImmediatePropagation();
                            ev.stopPropagation();
                            ev.preventDefault();
                            $(ev.target).off("click.disable");
                        });
                        handlers = $._data(ev.target, "events").click;
                        owlStopEvent = handlers.pop();
                        handlers.splice(0, 0, owlStopEvent);
                    }
                }
                gestureHandler.swapEvents(gestureHandler)("off");
            };
        },

        gestures: function() {
            this.base.isCssFinish = true;
            this.base.$elem.on(this.base.ev_types.start, ".owl-wrapper", this.dragStart(this));
        }
    };

    var OwlSynchronizer = {
        init: function(masterOwl, slaveOwl) {
            var master = $(masterOwl).data("owlCarousel");
            var slave = $(slaveOwl).data("owlCarousel");

            master.gestures = function() {
                var slaveGestureHandler = Object.create(GestureHandler);
                slaveGestureHandler.init(slave);

                var masterGestureHandler = Object.create(GestureHandler);
                masterGestureHandler.init(master, slaveGestureHandler);

                masterGestureHandler.gestures();
            }
            master.reinit(master.options);
        }
    };

    $.fn.synchronizeOwlWith = function(masterOwl){ 
        var synchronizer = Object.create(OwlSynchronizer);
        synchronizer.init(masterOwl, this);
        $.data(this, "owlSynchronizer", synchronizer);
    };

})(jQuery);
