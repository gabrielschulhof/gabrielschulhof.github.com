(function ( root, doc, factory ) {
	if ( typeof define === "function" && define.amd ) {
		// AMD. Register as an anonymous module.
		define( [ "jquery" ], function ( $ ) {
			factory( $, root, doc );
			return $.mobile;
		});
	} else {
		// Browser globals
		factory( root.jQuery, root, doc );
	}
}( this, document, function ( jQuery, window, document, undefined ) {
/*!
 * jQuery Mobile Namespace @VERSION
 * http://jquerymobile.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Namespace
//>>group: Core
//>>description: The mobile namespace on the jQuery object

( function( factory ) {
	if ( typeof define === "function" && define.amd ) {

		// AMD. Register as an anonymous module.
		define( 'ns',[ "jquery" ], factory );
	} else {

		// Browser globals
		factory( jQuery );
	}
} )( function( $ ) {

$.mobile = { version: "@VERSION" };

return $.mobile;
} );

/*!
 * jQuery UI Widget @VERSION
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Widget
//>>group: UI Core
//>>description: Provides a factory for creating stateful widgets with a common API.
//>>docs: http://api.jqueryui.com/jQuery.widget/
//>>demos: http://jqueryui.com/widget/

( function( factory ) {
	if ( typeof define === "function" && define.amd ) {

		// AMD. Register as an anonymous module.
		define( 'jquery-ui/widget',[ "jquery" ], factory );
	} else {

		// Browser globals
		factory( jQuery );
	}
}( function( $ ) {

var widget_uuid = 0,
	widget_slice = Array.prototype.slice;

$.cleanData = ( function( orig ) {
	return function( elems ) {
		var events, elem, i;
		for ( i = 0; ( elem = elems[ i ] ) != null; i++ ) {
			try {

				// Only trigger remove when necessary to save time
				events = $._data( elem, "events" );
				if ( events && events.remove ) {
					$( elem ).triggerHandler( "remove" );
				}

			// http://bugs.jquery.com/ticket/8235
			} catch ( e ) {}
		}
		orig( elems );
	};
} )( $.cleanData );

$.widget = function( name, base, prototype ) {
	var fullName, existingConstructor, constructor, basePrototype,
		// proxiedPrototype allows the provided prototype to remain unmodified
		// so that it can be used as a mixin for multiple widgets (#8876)
		proxiedPrototype = {},
		namespace = name.split( "." )[ 0 ];

	name = name.split( "." )[ 1 ];
	fullName = namespace + "-" + name;

	if ( !prototype ) {
		prototype = base;
		base = $.Widget;
	}

	if ( $.isArray( prototype ) ) {
		prototype = $.extend.apply( null, [ {} ].concat( prototype ) );
	}

	// create selector for plugin
	$.expr[ ":" ][ fullName.toLowerCase() ] = function( elem ) {
		return !!$.data( elem, fullName );
	};

	$[ namespace ] = $[ namespace ] || {};
	existingConstructor = $[ namespace ][ name ];
	constructor = $[ namespace ][ name ] = function( options, element ) {
		// allow instantiation without "new" keyword
		if ( !this._createWidget ) {
			return new constructor( options, element );
		}

		// allow instantiation without initializing for simple inheritance
		// must use "new" keyword (the code above always passes args)
		if ( arguments.length ) {
			this._createWidget( options, element );
		}
	};
	// extend with the existing constructor to carry over any static properties
	$.extend( constructor, existingConstructor, {
		version: prototype.version,
		// copy the object used to create the prototype in case we need to
		// redefine the widget later
		_proto: $.extend( {}, prototype ),
		// track widgets that inherit from this widget in case this widget is
		// redefined after a widget inherits from it
		_childConstructors: []
	} );

	basePrototype = new base();
	// we need to make the options hash a property directly on the new instance
	// otherwise we'll modify the options hash on the prototype that we're
	// inheriting from
	basePrototype.options = $.widget.extend( {}, basePrototype.options );
	$.each( prototype, function( prop, value ) {
		if ( !$.isFunction( value ) ) {
			proxiedPrototype[ prop ] = value;
			return;
		}
		proxiedPrototype[ prop ] = ( function() {
			var _super = function() {
					return base.prototype[ prop ].apply( this, arguments );
				},
				_superApply = function( args ) {
					return base.prototype[ prop ].apply( this, args );
				};
			return function() {
				var __super = this._super,
					__superApply = this._superApply,
					returnValue;

				this._super = _super;
				this._superApply = _superApply;

				returnValue = value.apply( this, arguments );

				this._super = __super;
				this._superApply = __superApply;

				return returnValue;
			};
		} )();
	} );
	constructor.prototype = $.widget.extend( basePrototype, {
		// TODO: remove support for widgetEventPrefix
		// always use the name + a colon as the prefix, e.g., draggable:start
		// don't prefix for widgets that aren't DOM-based
		widgetEventPrefix: existingConstructor ? ( basePrototype.widgetEventPrefix || name ) : name
	}, proxiedPrototype, {
		constructor: constructor,
		namespace: namespace,
		widgetName: name,
		widgetFullName: fullName
	} );

	// If this widget is being redefined then we need to find all widgets that
	// are inheriting from it and redefine all of them so that they inherit from
	// the new version of this widget. We're essentially trying to replace one
	// level in the prototype chain.
	if ( existingConstructor ) {
		$.each( existingConstructor._childConstructors, function( i, child ) {
			var childPrototype = child.prototype;

			// redefine the child widget using the same prototype that was
			// originally used, but inherit from the new version of the base
			$.widget( childPrototype.namespace + "." + childPrototype.widgetName, constructor, child._proto );
		} );
		// remove the list of existing child constructors from the old constructor
		// so the old child constructors can be garbage collected
		delete existingConstructor._childConstructors;
	} else {
		base._childConstructors.push( constructor );
	}

	$.widget.bridge( name, constructor );

	return constructor;
};

$.widget.extend = function( target ) {
	var input = widget_slice.call( arguments, 1 ),
		inputIndex = 0,
		inputLength = input.length,
		key,
		value;
	for ( ; inputIndex < inputLength; inputIndex++ ) {
		for ( key in input[ inputIndex ] ) {
			value = input[ inputIndex ][ key ];
			if ( input[ inputIndex ].hasOwnProperty( key ) && value !== undefined ) {
				// Clone objects
				if ( $.isPlainObject( value ) ) {
					target[ key ] = $.isPlainObject( target[ key ] ) ?
						$.widget.extend( {}, target[ key ], value ) :
						// Don't extend strings, arrays, etc. with objects
						$.widget.extend( {}, value );
				// Copy everything else by reference
				} else {
					target[ key ] = value;
				}
			}
		}
	}
	return target;
};

$.widget.bridge = function( name, object ) {
	var fullName = object.prototype.widgetFullName || name;
	$.fn[ name ] = function( options ) {
		var isMethodCall = typeof options === "string",
			args = widget_slice.call( arguments, 1 ),
			returnValue = this;

		if ( isMethodCall ) {
			this.each( function() {
				var methodValue,
					instance = $.data( this, fullName );
				if ( options === "instance" ) {
					returnValue = instance;
					return false;
				}
				if ( !instance ) {
					return $.error( "cannot call methods on " + name + " prior to initialization; " +
						"attempted to call method '" + options + "'" );
				}
				if ( !$.isFunction( instance[ options ] ) || options.charAt( 0 ) === "_" ) {
					return $.error( "no such method '" + options + "' for " + name + " widget instance" );
				}
				methodValue = instance[ options ].apply( instance, args );
				if ( methodValue !== instance && methodValue !== undefined ) {
					returnValue = methodValue && methodValue.jquery ?
						returnValue.pushStack( methodValue.get() ) :
						methodValue;
					return false;
				}
			} );
		} else {

			// Allow multiple hashes to be passed on init
			if ( args.length ) {
				options = $.widget.extend.apply( null, [ options ].concat( args ) );
			}

			this.each( function() {
				var instance = $.data( this, fullName );
				if ( instance ) {
					instance.option( options || {} );
					if ( instance._init ) {
						instance._init();
					}
				} else {
					$.data( this, fullName, new object( options, this ) );
				}
			} );
		}

		return returnValue;
	};
};

$.Widget = function( /* options, element */ ) {};
$.Widget._childConstructors = [];

$.Widget.prototype = {
	widgetName: "widget",
	widgetEventPrefix: "",
	defaultElement: "<div>",
	options: {
		classes: {},
		disabled: false,

		// callbacks
		create: null
	},
	_createWidget: function( options, element ) {
		element = $( element || this.defaultElement || this )[ 0 ];
		this.element = $( element );
		this.uuid = widget_uuid++;
		this.eventNamespace = "." + this.widgetName + this.uuid;

		this.bindings = $();
		this.hoverable = $();
		this.focusable = $();
		this.classesElementLookup = {};

		if ( element !== this ) {
			$.data( element, this.widgetFullName, this );
			this._on( true, this.element, {
				remove: function( event ) {
					if ( event.target === element ) {
						this.destroy();
					}
				}
			} );
			this.document = $( element.style ?
				// element within the document
				element.ownerDocument :
				// element is window or document
				element.document || element );
			this.window = $( this.document[ 0 ].defaultView || this.document[ 0 ].parentWindow );
		}

		this.options = $.widget.extend( {},
			this.options,
			this._getCreateOptions(),
			options );

		this._create();
		this._trigger( "create", null, this._getCreateEventData() );
		this._init();
	},
	_getCreateOptions: $.noop,
	_getCreateEventData: $.noop,
	_create: $.noop,
	_init: $.noop,

	destroy: function() {
		var that = this;

		this._destroy();
		$.each( this.classesElementLookup, function( key, value ) {
			that._removeClass( value, key );
		} );

		// we can probably remove the unbind calls in 2.0
		// all event bindings should go through this._on()
		this.element
			.off( this.eventNamespace )
			.removeData( this.widgetFullName );
		this.widget()
			.off( this.eventNamespace )
			.removeAttr( "aria-disabled" );

		// clean up events and states
		this.bindings.off( this.eventNamespace );
	},
	_destroy: $.noop,

	widget: function() {
		return this.element;
	},

	option: function( key, value ) {
		var options = key,
			parts,
			curOption,
			i;

		if ( arguments.length === 0 ) {
			// don't return a reference to the internal hash
			return $.widget.extend( {}, this.options );
		}

		if ( typeof key === "string" ) {
			// handle nested keys, e.g., "foo.bar" => { foo: { bar: ___ } }
			options = {};
			parts = key.split( "." );
			key = parts.shift();
			if ( parts.length ) {
				curOption = options[ key ] = $.widget.extend( {}, this.options[ key ] );
				for ( i = 0; i < parts.length - 1; i++ ) {
					curOption[ parts[ i ] ] = curOption[ parts[ i ] ] || {};
					curOption = curOption[ parts[ i ] ];
				}
				key = parts.pop();
				if ( arguments.length === 1 ) {
					return curOption[ key ] === undefined ? null : curOption[ key ];
				}
				curOption[ key ] = value;
			} else {
				if ( arguments.length === 1 ) {
					return this.options[ key ] === undefined ? null : this.options[ key ];
				}
				options[ key ] = value;
			}
		}

		this._setOptions( options );

		return this;
	},
	_setOptions: function( options ) {
		var key;

		for ( key in options ) {
			this._setOption( key, options[ key ] );
		}

		return this;
	},
	_setOption: function( key, value ) {
		if ( key === "classes" ) {
			this._setOptionClasses( value );
		}

		this.options[ key ] = value;

		if ( key === "disabled" ) {
			this._toggleClass( this.widget(), this.widgetFullName + "-disabled", null, !!value );

			// If the widget is becoming disabled, then nothing is interactive
			if ( value ) {
				this._removeClass( this.hoverable, null, "ui-state-hover" );
				this._removeClass( this.focusable, null, "ui-state-focus" );
			}
		}

		return this;
	},
	_setOptionClasses: function( value ) {
		var classKey, elements, currentElements;

		for ( classKey in value ) {
			currentElements = this.classesElementLookup[ classKey ];
			if ( value[ classKey ] === this.options.classes[ classKey ] ||
					!currentElements ||
					!currentElements.length ) {
				continue;
			}

			// We are doing this to create a new jQuery object because the _removeClass() call
			// on the next line is going to destroy the reference to the current elements being
			// tracked. We need to save a copy of this collection so that we can add the new classes
			// below.
			elements = $( currentElements.get() );
			this._removeClass( currentElements, classKey );

			// We don't use _addClass() here, because that uses this.options.classes
			// for generating the string of classes. We want to use the value passed in from
			// _setOption(), this is the new value of the classes option which was passed to
			// _setOption(). We pass this value directly to _classes().
			elements.addClass( this._classes( {
				element: elements,
				keys: classKey,
				classes: value,
				add: true
			} ) );
		}
	},

	enable: function() {
		return this._setOptions( { disabled: false } );
	},
	disable: function() {
		return this._setOptions( { disabled: true } );
	},

	_classes: function( options ) {
		var full = [],
			that = this;

		options = $.extend( {
			element: this.element,
			classes: this.options.classes || {}
		}, options );

		function processClassString( classes, checkOption ) {
			var current, i;
			for ( i = 0; i < classes.length; i++ ) {
				current = that.classesElementLookup[ classes[ i ] ] || $();
				if ( options.add ) {
					current = $( $.unique( current.get().concat( options.element.get() ) ) );
				} else {
					current = $( current.not( options.element ).get() );
				}
				that.classesElementLookup[ classes[ i ] ] = current;
				full.push( classes[ i ] );
				if ( checkOption && options.classes[ classes[ i ] ] ) {
					full.push( options.classes[ classes[ i ] ] );
				}
			}
		}

		if ( options.keys ) {
			processClassString( options.keys.match( /\S+/g ) || [], true );
		}
		if ( options.extra ) {
			processClassString( options.extra.match( /\S+/g ) || [] );
		}

		return full.join( " " );
	},

	_removeClass: function( element, keys, extra ) {
		return this._toggleClass( element, keys, extra, false );
	},

	_addClass: function( element, keys, extra ) {
		return this._toggleClass( element, keys, extra, true );
	},

	_toggleClass: function( element, keys, extra, add ) {
		add = ( typeof add === "boolean" ) ? add : extra;
		var shift = ( typeof element === "string" || element === null ),
			options = {
				extra: shift ? keys : extra,
				keys: shift ? element : keys,
				element: shift ? this.element : element,
				add: add
			};
		options.element.toggleClass( this._classes( options ), add );
		return this;
	},

	_on: function( suppressDisabledCheck, element, handlers ) {
		var delegateElement,
			instance = this;

		// no suppressDisabledCheck flag, shuffle arguments
		if ( typeof suppressDisabledCheck !== "boolean" ) {
			handlers = element;
			element = suppressDisabledCheck;
			suppressDisabledCheck = false;
		}

		// no element argument, shuffle and use this.element
		if ( !handlers ) {
			handlers = element;
			element = this.element;
			delegateElement = this.widget();
		} else {
			element = delegateElement = $( element );
			this.bindings = this.bindings.add( element );
		}

		$.each( handlers, function( event, handler ) {
			function handlerProxy() {
				// allow widgets to customize the disabled handling
				// - disabled as an array instead of boolean
				// - disabled class as method for disabling individual parts
				if ( !suppressDisabledCheck &&
						( instance.options.disabled === true ||
						$( this ).hasClass( "ui-state-disabled" ) ) ) {
					return;
				}
				return ( typeof handler === "string" ? instance[ handler ] : handler )
					.apply( instance, arguments );
			}

			// copy the guid so direct unbinding works
			if ( typeof handler !== "string" ) {
				handlerProxy.guid = handler.guid =
					handler.guid || handlerProxy.guid || $.guid++;
			}

			var match = event.match( /^([\w:-]*)\s*(.*)$/ ),
				eventName = match[ 1 ] + instance.eventNamespace,
				selector = match[ 2 ];
			if ( selector ) {
				delegateElement.on( eventName, selector, handlerProxy );
			} else {
				element.on( eventName, handlerProxy );
			}
		} );
	},

	_off: function( element, eventName ) {
		eventName = ( eventName || "" ).split( " " ).join( this.eventNamespace + " " ) +
			this.eventNamespace;
		element.off( eventName ).off( eventName );

		// Clear the stack to avoid memory leaks (#10056)
		this.bindings = $( this.bindings.not( element ).get() );
		this.focusable = $( this.focusable.not( element ).get() );
		this.hoverable = $( this.hoverable.not( element ).get() );
	},

	_delay: function( handler, delay ) {
		function handlerProxy() {
			return ( typeof handler === "string" ? instance[ handler ] : handler )
				.apply( instance, arguments );
		}
		var instance = this;
		return setTimeout( handlerProxy, delay || 0 );
	},

	_hoverable: function( element ) {
		this.hoverable = this.hoverable.add( element );
		this._on( element, {
			mouseenter: function( event ) {
				this._addClass( $( event.currentTarget ), null, "ui-state-hover" );
			},
			mouseleave: function( event ) {
				this._removeClass( $( event.currentTarget ), null, "ui-state-hover" );
			}
		} );
	},

	_focusable: function( element ) {
		this.focusable = this.focusable.add( element );
		this._on( element, {
			focusin: function( event ) {
				this._addClass( $( event.currentTarget ), null, "ui-state-focus" );
			},
			focusout: function( event ) {
				this._removeClass( $( event.currentTarget ), null, "ui-state-focus" );
			}
		} );
	},

	_trigger: function( type, event, data ) {
		var prop, orig,
			callback = this.options[ type ];

		data = data || {};
		event = $.Event( event );
		event.type = ( type === this.widgetEventPrefix ?
			type :
			this.widgetEventPrefix + type ).toLowerCase();
		// the original event may come from any element
		// so we need to reset the target on the new event
		event.target = this.element[ 0 ];

		// copy original event properties over to the new event
		orig = event.originalEvent;
		if ( orig ) {
			for ( prop in orig ) {
				if ( !( prop in event ) ) {
					event[ prop ] = orig[ prop ];
				}
			}
		}

		this.element.trigger( event, data );
		return !( $.isFunction( callback ) &&
			callback.apply( this.element[ 0 ], [ event ].concat( data ) ) === false ||
			event.isDefaultPrevented() );
	}
};

$.each( { show: "fadeIn", hide: "fadeOut" }, function( method, defaultEffect ) {
	$.Widget.prototype[ "_" + method ] = function( element, options, callback ) {
		if ( typeof options === "string" ) {
			options = { effect: options };
		}
		var hasOptions,
			effectName = !options ?
				method :
				options === true || typeof options === "number" ?
					defaultEffect :
					options.effect || defaultEffect;
		options = options || {};
		if ( typeof options === "number" ) {
			options = { duration: options };
		}
		hasOptions = !$.isEmptyObject( options );
		options.complete = callback;
		if ( options.delay ) {
			element.delay( options.delay );
		}
		if ( hasOptions && $.effects && $.effects.effect[ effectName ] ) {
			element[ method ]( options );
		} else if ( effectName !== method && element[ effectName ] ) {
			element[ effectName ]( options.duration, options.easing, callback );
		} else {
			element.queue( function( next ) {
				$( this )[ method ]();
				if ( callback ) {
					callback.call( element[ 0 ] );
				}
				next();
			} );
		}
	};
} );

return $.widget;

} ) );

/*!
 * jQuery Mobile Data @VERSION
 * http://jquerymobile.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: jqmData
//>>group: Core
//>>description: Mobile versions of Data functions to allow for namespaceing
//>>css.structure: ../css/structure/jquery.mobile.core.css
//>>css.theme: ../css/themes/default/jquery.mobile.theme.css

( function( factory ) {
	if ( typeof define === "function" && define.amd ) {

		// AMD. Register as an anonymous module.
		define( 'data',[
			"jquery",
			"./ns" ], factory );
	} else {

		// Browser globals
		factory( jQuery );
	}
} )( function( $ ) {

var nsNormalizeDict = {},
	oldFind = $.find,
	rbrace = /(?:\{[\s\S]*\}|\[[\s\S]*\])$/,
	jqmDataRE = /:jqmData\(([^)]*)\)/g;

$.extend( $.mobile, {

	// Namespace used framework-wide for data-attrs. Default is no namespace

	ns: $.mobileBackcompat === false ? "ui-" : "",

	// Retrieve an attribute from an element and perform some massaging of the value

	getAttribute: function( element, key ) {
		var data;

		element = element.jquery ? element[ 0 ] : element;

		if ( element && element.getAttribute ) {
			data = element.getAttribute( "data-" + $.mobile.ns + key );
		}

		// Copied from core's src/data.js:dataAttr()
		// Convert from a string to a proper data type
		try {
			data = data === "true" ? true :
				data === "false" ? false :
					data === "null" ? null :
						// Only convert to a number if it doesn't change the string
						+data + "" === data ? +data :
							rbrace.test( data ) ? JSON.parse( data ) :
								data;
		} catch ( err ) {}

		return data;
	},

	// Expose our cache for testing purposes.
	nsNormalizeDict: nsNormalizeDict,

	// Take a data attribute property, prepend the namespace
	// and then camel case the attribute string. Add the result
	// to our nsNormalizeDict so we don't have to do this again.
	nsNormalize: function( prop ) {
		return nsNormalizeDict[ prop ] ||
			( nsNormalizeDict[ prop ] = $.camelCase( $.mobile.ns + prop ) );
	},

	// Find the closest javascript page element to gather settings data jsperf test
	// http://jsperf.com/single-complex-selector-vs-many-complex-selectors/edit
	// possibly naive, but it shows that the parsing overhead for *just* the page selector vs
	// the page and dialog selector is negligable. This could probably be speed up by
	// doing a similar parent node traversal to the one found in the inherited theme code above
	closestPageData: function( $target ) {
		return $target
			.closest( ":jqmData(role='page'), :jqmData(role='dialog')" )
				.data( "mobile-page" );
	}

} );

// Mobile version of data and removeData and hasData methods
// ensures all data is set and retrieved using jQuery Mobile's data namespace
$.fn.jqmData = function( prop, value ) {
	var result;
	if ( typeof prop !== "undefined" ) {
		if ( prop ) {
			prop = $.mobile.nsNormalize( prop );
		}

		// undefined is permitted as an explicit input for the second param
		// in this case it returns the value and does not set it to undefined
		if ( arguments.length < 2 || value === undefined ) {
			result = this.data( prop );
		} else {
			result = this.data( prop, value );
		}
	}
	return result;
};

$.jqmData = function( elem, prop, value ) {
	var result;
	if ( typeof prop !== "undefined" ) {
		result = $.data( elem, prop ? $.mobile.nsNormalize( prop ) : prop, value );
	}
	return result;
};

$.fn.jqmRemoveData = function( prop ) {
	return this.removeData( $.mobile.nsNormalize( prop ) );
};

$.jqmRemoveData = function( elem, prop ) {
	return $.removeData( elem, $.mobile.nsNormalize( prop ) );
};

$.find = function( selector, context, ret, extra ) {
	if ( selector.indexOf( ":jqmData" ) > -1 ) {
		selector = selector.replace( jqmDataRE, "[data-" + ( $.mobile.ns || "" ) + "$1]" );
	}

	return oldFind.call( this, selector, context, ret, extra );
};

$.extend( $.find, oldFind );

return $.mobile;
} );

/*!
 * jQuery Mobile Widget @VERSION
 * http://jquerymobile.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Widget Factory
//>>group: Core
//>>description: Widget factory extentions for mobile.
//>>css.theme: ../css/themes/default/jquery.mobile.theme.css

( function( factory ) {
	if ( typeof define === "function" && define.amd ) {

		// AMD. Register as an anonymous module.
		define( 'widget',[
			"jquery",
			"./ns",
			"jquery-ui/widget",
			"./data" ], factory );
	} else {

		// Browser globals
		factory( jQuery );
	}
} )( function( $ ) {

return $.mobile.widget = $.mobile.widget || {};

} );

/*!
 * jQuery Mobile Defaults @VERSION
 * http://jquerymobile.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Defaults
//>>group: Core
//>>description: Default values for jQuery Mobile
//>>css.structure: ../css/structure/jquery.mobile.core.css
//>>css.theme: ../css/themes/default/jquery.mobile.theme.css

( function( factory ) {
	if ( typeof define === "function" && define.amd ) {

		// AMD. Register as an anonymous module.
		define( 'defaults',[
			"jquery",
			"./ns" ], factory );
	} else {

		// Browser globals
		factory( jQuery );
	}
} )( function( $ ) {

return $.extend( $.mobile, {

	hideUrlBar: true,

	// Keepnative Selector
	keepNative: ":jqmData(role='none'), :jqmData(role='nojs')",

	// Automatically handle clicks and form submissions through Ajax, when same-domain
	ajaxEnabled: true,

	// Automatically load and show pages based on location.hash
	hashListeningEnabled: true,

	// disable to prevent jquery from bothering with links
	linkBindingEnabled: true,

	// Set default page transition - 'none' for no transitions
	defaultPageTransition: "fade",

	// Set maximum window width for transitions to apply - 'false' for no limit
	maxTransitionWidth: false,

	// Set default dialog transition - 'none' for no transitions
	defaultDialogTransition: "pop",

	// Error response message - appears when an Ajax page request fails
	pageLoadErrorMessage: "Error Loading Page",

	// For error messages, which theme does the box use?
	pageLoadErrorMessageTheme: "a",

	// replace calls to window.history.back with phonegaps navigation helper
	// where it is provided on the window object
	phonegapNavigationEnabled: false,

	//automatically initialize the DOM when it's ready
	autoInitializePage: true,

	pushStateEnabled: true,

	// allows users to opt in to ignoring content by marking a parent element as
	// data-ignored
	ignoreContentEnabled: false,

	// default the property to remove dependency on assignment in init module
	pageContainer: $(),

	//enable cross-domain page support
	allowCrossDomainPages: false,

	dialogHashKey: "&ui-state=dialog"
} );
} );

/*!
 * jQuery UI Core @VERSION
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 *
 */

//>>label: Core
//>>group: UI Core
//>>description: The core of jQuery UI, required for all interactions and widgets.
//>>docs: http://api.jqueryui.com/category/ui-core/
//>>demos: http://jqueryui.com/

( function( factory ) {
	if ( typeof define === "function" && define.amd ) {

		// AMD. Register as an anonymous module.
		define( 'jquery-ui/core',[ "jquery" ], factory );
	} else {

		// Browser globals
		factory( jQuery );
	}
}( function( $ ) {

// $.ui might exist from components with no dependencies, e.g., $.ui.position
$.ui = $.ui || {};

$.extend( $.ui, {
	version: "@VERSION",

	keyCode: {
		BACKSPACE: 8,
		COMMA: 188,
		DELETE: 46,
		DOWN: 40,
		END: 35,
		ENTER: 13,
		ESCAPE: 27,
		HOME: 36,
		LEFT: 37,
		PAGE_DOWN: 34,
		PAGE_UP: 33,
		PERIOD: 190,
		RIGHT: 39,
		SPACE: 32,
		TAB: 9,
		UP: 38
	},

	// Internal use only
	safeActiveElement: function( document ) {
		var activeElement;

		// Support: IE 9 only
		// IE9 throws an "Unspecified error" accessing document.activeElement from an <iframe>
		try {
			activeElement = document.activeElement;
		} catch ( error ) {
			activeElement = document.body;
		}

		// Support: IE 9 - 11 only
		// IE may return null instead of an element
		// Interestingly, this only seems to occur when NOT in an iframe
		if ( !activeElement ) {
			activeElement = document.body;
		}

		// Support: IE 11 only
		// IE11 returns a seemingly empty object in some cases when accessing
		// document.activeElement from an <iframe>
		if ( !activeElement.nodeName ) {
			activeElement = document.body;
		}

		return activeElement;
	},

	// Internal use only
	safeBlur: function( element ) {

		// Support: IE9 - 10 only
		// If the <body> is blurred, IE will switch windows, see #9420
		if ( element && element.nodeName.toLowerCase() !== "body" ) {
			$( element ).trigger( "blur" );
		}
	},

	// Internal use only
	escapeSelector: ( function() {
		var selectorEscape = /([!"#$%&'()*+,./:;<=>?@[\]^`{|}~])/g;
		return function( selector ) {
			return selector.replace( selectorEscape, "\\$1" );
		};
	} )()
} );

// plugins
$.fn.extend( {
	scrollParent: function( includeHidden ) {
		var position = this.css( "position" ),
			excludeStaticParent = position === "absolute",
			overflowRegex = includeHidden ? /(auto|scroll|hidden)/ : /(auto|scroll)/,
			scrollParent = this.parents().filter( function() {
				var parent = $( this );
				if ( excludeStaticParent && parent.css( "position" ) === "static" ) {
					return false;
				}
				return overflowRegex.test( parent.css( "overflow" ) + parent.css( "overflow-y" ) + parent.css( "overflow-x" ) );
			} ).eq( 0 );

		return position === "fixed" || !scrollParent.length ? $( this[ 0 ].ownerDocument || document ) : scrollParent;
	},

	uniqueId: ( function() {
		var uuid = 0;

		return function() {
			return this.each( function() {
				if ( !this.id ) {
					this.id = "ui-id-" + ( ++uuid );
				}
			} );
		};
	} )(),

	removeUniqueId: function() {
		return this.each( function() {
			if ( /^ui-id-\d+$/.test( this.id ) ) {
				$( this ).removeAttr( "id" );
			}
		} );
	},

	// Support: IE8 Only
	// IE8 does not support the form attribute and when it is supplied. It overwrites the form prop
	// with a string, so we need to find the proper form.
	form: function() {
		return typeof this[ 0 ].form === "string" ? this.closest( "form" ) : $( this[ 0 ].form );
	},

	labels: function() {
		var ancestor, selector, id, labels, ancestors;

		// Check control.labels first
		if ( this[ 0 ].labels && this[ 0 ].labels.length ) {
			return this.pushStack( this[ 0 ].labels );
		}

		// Support: IE <= 11, FF <= 37, Android <= 2.3 only
		// Above browsers do not support control.labels. Everything below is to support them
		// as well as document fragments. control.labels does not work on document fragments
		labels = this.eq( 0 ).parents( "label" );

		// Look for the label based on the id
		id = this.attr( "id" );
		if ( id ) {

			// We don't search against the document in case the element
			// is disconnected from the DOM
			ancestor = this.eq( 0 ).parents().last();

			// Get a full set of top level ancestors
			ancestors = ancestor.add( ancestor.length ? ancestor.siblings() : this.siblings() );

			// Create a selector for the label based on the id
			selector = "label[for='" + $.ui.escapeSelector( id ) + "']";

			labels = labels.add( ancestors.find( selector ).addBack( selector ) );

		}

		// Return whatever we have found for labels
		return this.pushStack( labels );
	}
} );

// selectors
function focusable( element, hasTabindex ) {
	var map, mapName, img,
		nodeName = element.nodeName.toLowerCase();
	if ( "area" === nodeName ) {
		map = element.parentNode;
		mapName = map.name;
		if ( !element.href || !mapName || map.nodeName.toLowerCase() !== "map" ) {
			return false;
		}
		img = $( "img[usemap='#" + mapName + "']" )[ 0 ];
		return !!img && visible( img );
	}
	return ( /^(input|select|textarea|button|object)$/.test( nodeName ) ?
		!element.disabled :
		"a" === nodeName ?
			element.href || hasTabindex :
			hasTabindex ) &&
		// the element and all of its ancestors must be visible
		visible( element );
}

function visible( element ) {
	return $.expr.filters.visible( element ) &&
		!$( element ).parents().addBack().filter( function() {
			return $.css( this, "visibility" ) === "hidden";
		} ).length;
}

$.extend( $.expr[ ":" ], {
	data: $.expr.createPseudo ?
		$.expr.createPseudo( function( dataName ) {
			return function( elem ) {
				return !!$.data( elem, dataName );
			};
		} ) :
		// support: jQuery <1.8
		function( elem, i, match ) {
			return !!$.data( elem, match[ 3 ] );
		},

	focusable: function( element ) {
		return focusable( element, $.attr( element, "tabindex" ) != null );
	},

	tabbable: function( element ) {
		var tabIndex = $.attr( element, "tabindex" ),
			hasTabindex = tabIndex != null;
		return ( !hasTabindex || tabIndex >= 0 ) && focusable( element, hasTabindex );
	}
} );

// support: jQuery 1.7 only
// Not a great way to check versions, but since we only support 1.7+ and only
// need to detect <1.8, this is a simple check that should suffice. Checking
// for "1.7." would be a bit safer, but the version string is 1.7, not 1.7.0
// and we'll never reach 1.70.0 (if we do, we certainly won't be supporting
// 1.7 anymore). See #11197 for why we're not using feature detection.
if ( $.fn.jquery.substring( 0, 3 ) === "1.7" ) {

	// Setters for .innerWidth(), .innerHeight(), .outerWidth(), .outerHeight()
	// Unlike jQuery Core 1.8+, these only support numeric values to set the
	// dimensions in pixels
	$.each( [ "Width", "Height" ], function( i, name ) {
		var side = name === "Width" ? [ "Left", "Right" ] : [ "Top", "Bottom" ],
			type = name.toLowerCase(),
			orig = {
				innerWidth: $.fn.innerWidth,
				innerHeight: $.fn.innerHeight,
				outerWidth: $.fn.outerWidth,
				outerHeight: $.fn.outerHeight
			};

		function reduce( elem, size, border, margin ) {
			$.each( side, function() {
				size -= parseFloat( $.css( elem, "padding" + this ) ) || 0;
				if ( border ) {
					size -= parseFloat( $.css( elem, "border" + this + "Width" ) ) || 0;
				}
				if ( margin ) {
					size -= parseFloat( $.css( elem, "margin" + this ) ) || 0;
				}
			} );
			return size;
		}

		$.fn[ "inner" + name ] = function( size ) {
			if ( size === undefined ) {
				return orig[ "inner" + name ].call( this );
			}

			return this.each( function() {
				$( this ).css( type, reduce( this, size ) + "px" );
			} );
		};

		$.fn[ "outer" + name ] = function( size, margin ) {
			if ( typeof size !== "number" ) {
				return orig[ "outer" + name ].call( this, size );
			}

			return this.each( function() {
				$( this ).css( type, reduce( this, size, true, margin ) + "px" );
			} );
		};
	} );

	$.fn.addBack = function( selector ) {
		return this.add( selector == null ?
			this.prevObject : this.prevObject.filter( selector )
		);
	};
}

// deprecated
$.ui.ie = !!/msie [\w.]+/.exec( navigator.userAgent.toLowerCase() );

$.fn.extend( {
	disableSelection: ( function() {
		var eventType = "onselectstart" in document.createElement( "div" ) ?
			"selectstart" :
			"mousedown";

		return function() {
			return this.on( eventType + ".ui-disableSelection", function( event ) {
				event.preventDefault();
			} );
		};
	} )(),

	enableSelection: function() {
		return this.off( ".ui-disableSelection" );
	}
} );

// $.ui.plugin is deprecated. Use $.widget() extensions instead.
$.ui.plugin = {
	add: function( module, option, set ) {
		var i,
			proto = $.ui[ module ].prototype;
		for ( i in set ) {
			proto.plugins[ i ] = proto.plugins[ i ] || [];
			proto.plugins[ i ].push( [ option, set[ i ] ] );
		}
	},
	call: function( instance, name, args, allowDisconnected ) {
		var i,
			set = instance.plugins[ name ];

		if ( !set ) {
			return;
		}

		if ( !allowDisconnected && ( !instance.element[ 0 ].parentNode || instance.element[ 0 ].parentNode.nodeType === 11 ) ) {
			return;
		}

		for ( i = 0; i < set.length; i++ ) {
			if ( instance.options[ set[ i ][ 0 ] ] ) {
				set[ i ][ 1 ].apply( instance.element, args );
			}
		}
	}
};

} ) );

/*!
 * jQuery Mobile Helpers @VERSION
 * http://jquerymobile.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Helpers
//>>group: Core
//>>description: Helper functions and references
//>>css.structure: ../css/structure/jquery.mobile.core.css
//>>css.theme: ../css/themes/default/jquery.mobile.theme.css

( function( factory ) {
	if ( typeof define === "function" && define.amd ) {

		// AMD. Register as an anonymous module.
		define( 'helpers',[
			"jquery",
			"./ns",
			"jquery-ui/core" ], factory );
	} else {

		// Browser globals
		factory( jQuery );
	}
} )( function( $ ) {

// Subtract the height of external toolbars from the page height, if the page does not have
// internal toolbars of the same type. We take care to use the widget options if we find a
// widget instance and the element's data-attributes otherwise.
var compensateToolbars = function( page, desiredHeight ) {
	var pageParent = page.parent(),
		toolbarsAffectingHeight = [],

		// We use this function to filter fixed toolbars with option updatePagePadding set to
		// true (which is the default) from our height subtraction, because fixed toolbars with
		// option updatePagePadding set to true compensate for their presence by adding padding
		// to the active page. We want to avoid double-counting by also subtracting their
		// height from the desired page height.
		noPadders = function() {
			var theElement = $( this ),
				widgetOptions = $.mobile.toolbar && theElement.data( "mobile-toolbar" ) ?
					theElement.toolbar( "option" ) : {
						position: theElement.attr( "data-" + $.mobile.ns + "position" ),
						updatePagePadding: ( theElement.attr( "data-" + $.mobile.ns +
								"update-page-padding" ) !== false )
					};

			return !( widgetOptions.position === "fixed" &&
				widgetOptions.updatePagePadding === true );
		},
		externalHeaders = pageParent.children( ":jqmData(role='header')" ).filter( noPadders ),
		internalHeaders = page.children( ":jqmData(role='header')" ),
		externalFooters = pageParent.children( ":jqmData(role='footer')" ).filter( noPadders ),
		internalFooters = page.children( ":jqmData(role='footer')" );

	// If we have no internal headers, but we do have external headers, then their height
	// reduces the page height
	if ( internalHeaders.length === 0 && externalHeaders.length > 0 ) {
		toolbarsAffectingHeight = toolbarsAffectingHeight.concat( externalHeaders.toArray() );
	}

	// If we have no internal footers, but we do have external footers, then their height
	// reduces the page height
	if ( internalFooters.length === 0 && externalFooters.length > 0 ) {
		toolbarsAffectingHeight = toolbarsAffectingHeight.concat( externalFooters.toArray() );
	}

	$.each( toolbarsAffectingHeight, function( index, value ) {
		desiredHeight -= $( value ).outerHeight();
	} );

	// Height must be at least zero
	return Math.max( 0, desiredHeight );
};

$.extend( $.mobile, {
	// define the window and the document objects
	window: $( window ),
	document: $( document ),

	// TODO: Remove and use $.ui.keyCode directly
	keyCode: $.ui.keyCode,

	// Place to store various widget extensions
	behaviors: {},

	// Scroll page vertically: scroll to 0 to hide iOS address bar, or pass a Y value
	silentScroll: function( ypos ) {
		if ( $.type( ypos ) !== "number" ) {
			ypos = $.mobile.defaultHomeScroll;
		}

		// prevent scrollstart and scrollstop events
		$.event.special.scrollstart.enabled = false;

		setTimeout( function() {
			window.scrollTo( 0, ypos );
			$.mobile.document.trigger( "silentscroll", { x: 0, y: ypos } );
		}, 20 );

		setTimeout( function() {
			$.event.special.scrollstart.enabled = true;
		}, 150 );
	},

	getClosestBaseUrl: function( ele ) {
		// Find the closest page and extract out its url.
		var url = $( ele ).closest( ".ui-page" ).jqmData( "url" ),
			base = $.mobile.path.documentBase.hrefNoHash;

		if ( !$.mobile.base.dynamicBaseEnabled || !url || !$.mobile.path.isPath( url ) ) {
			url = base;
		}

		return $.mobile.path.makeUrlAbsolute( url, base );
	},
	removeActiveLinkClass: function( forceRemoval ) {
		if ( !!$.mobile.activeClickedLink &&
				( !$.mobile.activeClickedLink.closest( ".ui-page-active" ).length ||
				forceRemoval ) ) {

			$.mobile.activeClickedLink.removeClass( "ui-button-active" );
		}
		$.mobile.activeClickedLink = null;
	},

	// DEPRECATED in 1.4
	// Find the closest parent with a theme class on it. Note that
	// we are not using $.fn.closest() on purpose here because this
	// method gets called quite a bit and we need it to be as fast
	// as possible.
	getInheritedTheme: function( el, defaultTheme ) {
		var e = el[ 0 ],
			ltr = "",
			re = /ui-(bar|body|overlay)-([a-z])\b/,
			c, m;
		while ( e ) {
			c = e.className || "";
			if ( c && ( m = re.exec( c ) ) && ( ltr = m[ 2 ] ) ) {
				// We found a parent with a theme class
				// on it so bail from this loop.
				break;
			}

			e = e.parentNode;
		}
		// Return the theme letter we found, if none, return the
		// specified default.
		return ltr || defaultTheme || "a";
	},

	enhanceable: function( elements ) {
		return this.haveParents( elements, "enhance" );
	},

	hijackable: function( elements ) {
		return this.haveParents( elements, "ajax" );
	},

	haveParents: function( elements, attr ) {
		if ( !$.mobile.ignoreContentEnabled ) {
			return elements;
		}

		var count = elements.length,
			$newSet = $(),
			e, $element, excluded,
			i, c;

		for ( i = 0; i < count; i++ ) {
			$element = elements.eq( i );
			excluded = false;
			e = elements[ i ];

			while ( e ) {
				c = e.getAttribute ? e.getAttribute( "data-" + $.mobile.ns + attr ) : "";

				if ( c === "false" ) {
					excluded = true;
					break;
				}

				e = e.parentNode;
			}

			if ( !excluded ) {
				$newSet = $newSet.add( $element );
			}
		}

		return $newSet;
	},

	getScreenHeight: function() {
		// Native innerHeight returns more accurate value for this across platforms,
		// jQuery version is here as a normalized fallback for platforms like Symbian
		return window.innerHeight || $.mobile.window.height();
	},

	//simply set the active page's minimum height to screen height, depending on orientation
	resetActivePageHeight: function( height ) {
		var page = $( ".ui-page-active" ),
			pageHeight = page.height(),
			pageOuterHeight = page.outerHeight( true );

		height = compensateToolbars( page,
			( typeof height === "number" ) ? height : $( window ).height() );

		// Remove any previous min-height setting
		page.css( "min-height", "" );

		// Set the minimum height only if the height as determined by CSS is insufficient
		if ( page.height() < height ) {
			page.css( "min-height", height - ( pageOuterHeight - pageHeight ) );
		}
	},

	loading: function() {
		// If this is the first call to this function, instantiate a loader widget
		var loader = this.loading._widget || $( $.mobile.loader.prototype.defaultHtml ).loader(),

			// Call the appropriate method on the loader
			returnValue = loader.loader.apply( loader, arguments );

		// Make sure the loader is retained for future calls to this function.
		this.loading._widget = loader;

		return returnValue;
	}
} );

$.addDependents = function( elem, newDependents ) {
	var $elem = $( elem ),
		dependents = $elem.jqmData( "dependents" ) || $();

	$elem.jqmData( "dependents", $( dependents ).add( newDependents ) );
};

// plugins
$.fn.extend( {
	removeWithDependents: function() {
		$.removeWithDependents( this );
	},

	addDependents: function( newDependents ) {
		$.addDependents( this, newDependents );
	},

	// note that this helper doesn't attempt to handle the callback
	// or setting of an html element's text, its only purpose is
	// to return the html encoded version of the text in all cases. (thus the name)
	getEncodedText: function() {
		return $( "<a>" ).text( this.text() ).html();
	},

	// fluent helper function for the mobile namespaced equivalent
	jqmEnhanceable: function() {
		return $.mobile.enhanceable( this );
	},

	jqmHijackable: function() {
		return $.mobile.hijackable( this );
	}
} );

$.removeWithDependents = function( nativeElement ) {
	var element = $( nativeElement );

	( element.jqmData( "dependents" ) || $() ).remove();
	element.remove();
};
$.addDependents = function( nativeElement, newDependents ) {
	var element = $( nativeElement ),
		dependents = element.jqmData( "dependents" ) || $();

	element.jqmData( "dependents", $( dependents ).add( newDependents ) );
};

$.find.matches = function( expr, set ) {
	return $.find( expr, null, null, set );
};

$.find.matchesSelector = function( node, expr ) {
	return $.find( expr, null, null, [ node ] ).length > 0;
};

return $.mobile;
} );

/*!
 * jQuery Mobile Core @VERSION
 * http://jquerymobile.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>group: exclude

( function( factory ) {
	if ( typeof define === "function" && define.amd ) {

		// AMD. Register as an anonymous module.
		define( 'core',[
			"./defaults",
			"./data",
			"./helpers" ], factory );
	} else {

		// Browser globals
		factory( jQuery );
	}
} )( function() {} );

/*!
 * jQuery Mobile First And Last Classes @VERSION
 * http://jquerymobile.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: First & Last Classes
//>>group: Widgets
//>>description: Behavior mixin to mark first and last visible item with special classes.

( function( factory ) {
	if ( typeof define === "function" && define.amd ) {

		// AMD. Register as an anonymous module.
		define( 'widgets/addFirstLastClasses',[
			"jquery",
			"../core" ], factory );
	} else {

		// Browser globals
		factory( jQuery );
	}
} )( function( $ ) {

var uiScreenHiddenRegex = /\bui-screen-hidden\b/;
function noHiddenClass( elements ) {
	var index,
		length = elements.length,
		result = [];

	for ( index = 0; index < length; index++ ) {
		if ( !elements[ index ].className.match( uiScreenHiddenRegex ) ) {
			result.push( elements[ index ] );
		}
	}

	return $( result );
}

$.mobile.behaviors.addFirstLastClasses = {
	_getVisibles: function( $els, create ) {
		var visibles;

		if ( create ) {
			visibles = noHiddenClass( $els );
		} else {
			visibles = $els.filter( ":visible" );
			if ( visibles.length === 0 ) {
				visibles = noHiddenClass( $els );
			}
		}

		return visibles;
	},

	_addFirstLastClasses: function( $els, $visibles, create ) {
		$els.removeClass( "ui-first-child ui-last-child" );
		$visibles.eq( 0 ).addClass( "ui-first-child" ).end().last().addClass( "ui-last-child" );
		if ( !create ) {
			this.element.trigger( "updatelayout" );
		}
	},

	_removeFirstLastClasses: function( $els ) {
		$els.removeClass( "ui-first-child ui-last-child" );
	}
};

return $.mobile.behaviors.addFirstLastClasses;

} );

/*!
 * jQuery Mobile Listview @VERSION
 * http://jquerymobile.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Listview
//>>group: Widgets
//>>description: Applies listview styling of various types (standard, numbered, split button, etc.)
//>>docs: http://api.jquerymobile.com/listview/
//>>demos: http://demos.jquerymobile.com/@VERSION/listview/
//>>css.structure: ../css/structure/jquery.mobile.listview.css
//>>css.theme: ../css/themes/default/jquery.mobile.theme.css

( function( factory ) {
	if ( typeof define === "function" && define.amd ) {

		// AMD. Register as an anonymous module.
		define( 'widgets/listview',[
			"jquery",
			"../widget",
			"./addFirstLastClasses" ], factory );
	} else {

		// Browser globals
		factory( jQuery );
	}
} )( function( $ ) {

function filterBubbleSpan() {
	var child, parentNode,
		anchorHash = { "a": true, "A": true };

	for ( child = this.firstChild ; !!child ; child = child.nextSibling ) {

		// Accept list item when we've found an element with class
		// ui-listview-item-count-bubble
		if ( child.className && child.className.match( countBubbleClassRegex ) ) {
			return true;
		}

		// Descend into anchor, remembering where we've been
		if ( anchorHash[ child.nodeName ] ) {
			parentNode = child;
			child = child.firstChild;
		}

		// When done with anchor, resume checking children of list item
		if ( !child && parentNode ) {
			child = parentNode;
			parentNode = null;
		}
	}
}

var getAttribute = $.mobile.getAttribute,
	countBubbleClassRegex = /\bui-listview-item-count-bubble\b/,
	listviewItemClassRegex = /\bui-listview-item-static\b|\bui-listview-item-divider\b/,
	buttonClassRegex = /\bui-button\b/;

return $.widget( "mobile.listview", $.extend( {
	version: "@VERSION",

	options: {
		classes: {
			"ui-listview-inset": "ui-corner-all ui-shadow"
		},
		theme: "inherit",
		dividerTheme: "inherit",
		icon: "caret-r",
		splitIcon: "caret-r",
		splitTheme: "inherit",
		inset: false,
		enhanced: false
	},

	_create: function() {
		this._addClass( "ui-listview" );
		if ( this.options.inset ) {
			this._addClass( "ui-listview-inset" );
		}
		this.refresh( true );
	},

	// We only handle the theme option through the theme extension. Theme options concerning list
	// items such as splitTheme and dividerTheme have to be handled in refresh().
	_themeElements: function() {
		return [ {
			element: this.element,
			prefix: "ui-group-theme-"
		} ];
	},

	_setOption: function( key, value ) {
		if ( key === "inset" ) {
			this._toggleClass( this.element, "ui-listview-inset", null, !!value );
		}

		return this._superApply( arguments );
	},

	_getChildrenByTagName: function( ele, lcName, ucName ) {
		var results = [],
			dict = {};
		dict[ lcName ] = dict[ ucName ] = true;
		ele = ele.firstChild;
		while ( ele ) {
			if ( dict[ ele.nodeName ] ) {
				results.push( ele );
			}
			ele = ele.nextSibling;
		}
		return $( results );
	},

	_beforeListviewRefresh: $.noop,
	_afterListviewRefresh: $.noop,

	refresh: function( create ) {
		var buttonClass, pos, numli, item, itemClass, itemExtraClass, itemTheme, itemIcon, icon, a,
			isDivider, startCount, newStartCount, value, last, splittheme, splitThemeClass, li, ol,
			altButtonClass, dividerTheme, start, itemClassDict, dictionaryKey, span, spliticon,
			currentOptions = this.options,
			createEnhanced = create && this.options.enhanced,
			list = this.element;

		ol = !!$.nodeName( list[ 0 ], "ol" );
		start = list.attr( "start" );
		itemClassDict = {};

		// Check if a start attribute has been set while taking a value of 0 into account
		if ( ol && ( start || start === 0 ) ) {
			startCount = parseInt( start, 10 ) - 1;
			list.css( "counter-reset", "listnumbering " + startCount );
		}

		this._beforeListviewRefresh();

		li = this._getChildrenByTagName( list[ 0 ], "li", "LI" );

		for ( pos = 0, numli = li.length; pos < numli; pos++ ) {
			item = li.eq( pos );
			itemClass = "ui-listview-item";
			itemExtraClass = undefined;

			if ( create || !listviewItemClassRegex.test( item[ 0 ].className ) ) {
				a = this._getChildrenByTagName( item[ 0 ], "a", "A" );
				isDivider = ( getAttribute( item[ 0 ], "role" ) === "list-divider" );
				value = item.attr( "value" );
				itemTheme = getAttribute( item[ 0 ], "theme" );

				if ( ( a.length && !buttonClassRegex.test( a[ 0 ].className ) &&
						!isDivider ) || create ) {
					itemIcon = getAttribute( item[ 0 ], "icon" );
					icon = ( itemIcon === false ) ? false : ( itemIcon || currentOptions.icon );

					buttonClass = "ui-button";

					if ( itemTheme ) {
						buttonClass += " ui-button-" + itemTheme;
					}

					if ( a.length > 1 ) {
						itemClass = "ui-listview-item-has-alternate";

						last = a.last();
						splittheme = getAttribute( last[ 0 ], "theme" ) ||
							currentOptions.splitTheme || getAttribute( item[ 0 ], "theme", true );
						splitThemeClass = splittheme ? " ui-button-" + splittheme : "";
						spliticon = getAttribute( last[ 0 ], "icon" ) ||
							getAttribute( item[ 0 ], "icon" ) || currentOptions.splitIcon;
						altButtonClass = "ui-button ui-button-icon-only" + splitThemeClass;

						span = createEnhanced ? last.children( ".ui-listview-item-split-icon" ) :
							$( "<span>" );
						this._addClass( span, "ui-listview-item-split-icon",
							"ui-icon ui-icon-" + spliticon );
						this._addClass( last, "ui-listview-item-split-button", altButtonClass );
						last.attr( "title", $.trim( last.getEncodedText() ) );
						if ( !createEnhanced ) {
							last.empty().append( span );
						}

						// Reduce to the first anchor, because only the first gets the buttonClass
						a = a.first();
					} else if ( icon ) {
						span = createEnhanced ? a.children( ".ui-listview-item-icon" ) :
							$( "<span>" );
						this._addClass( span, "ui-listview-item-icon", "ui-icon ui-icon-" + icon +
							" ui-widget-icon-floatend" );
						if ( !createEnhanced ) {
							a.append( span );
						}
					}

					// Apply buttonClass to the (first) anchor
					this._addClass( a, "ui-listview-item-button", buttonClass );
				} else if ( isDivider ) {
					dividerTheme = ( getAttribute( item[ 0 ], "theme" ) ||
						currentOptions.dividerTheme || currentOptions.theme );

					itemClass = "ui-listview-item-divider";
					itemExtraClass = "ui-bar-" + ( dividerTheme ? dividerTheme : "inherit" );

					item.attr( "role", "heading" );
				} else if ( a.length <= 0 ) {
					itemClass = "ui-listview-item-static";
					itemExtraClass = "ui-body-" + ( itemTheme ? itemTheme : "inherit" );
				}
				if ( ol && value ) {
					newStartCount = parseInt( value, 10 ) - 1;

					item.css( "counter-reset", "listnumbering " + newStartCount );
				}
			}

			// Instead of setting item class directly on the list item
			// at this point in time, push the item into a dictionary
			// that tells us what class to set on it so we can do this after this
			// processing loop is finished.

			// Construct the dictionary key from the key class and the extra class
			dictionaryKey = [ itemClass ]
				.concat( itemExtraClass ? [ itemExtraClass ] : [] )
				.join( "|" );
			if ( !itemClassDict[ dictionaryKey ] ) {
				itemClassDict[ dictionaryKey ] = [];
			}

			itemClassDict[ dictionaryKey ].push( item[ 0 ] );
		}

		// Set the appropriate listview item classes on each list item.
		// The main reason we didn't do this
		// in the for-loop above is because we can eliminate per-item function overhead
		// by calling addClass() and children() once or twice afterwards. This
		// can give us a significant boost on platforms like WP7.5.

		for ( dictionaryKey in itemClassDict ) {

			// Split the dictionary key back into key classes and extra classes and construct the
			// _addClass() parameter list
			this._addClass.apply( this,
				[ $( itemClassDict[ dictionaryKey ] ) ]
					.concat( dictionaryKey.split( "|" ) ) );
		}

		this._addClass(
			li.filter( filterBubbleSpan ),
			"ui-listview-item-has-count" );

		this._afterListviewRefresh();

		this._addFirstLastClasses( li, this._getVisibles( li, create ), create );

		// Untrack removed items
		if ( this._oldListItems ) {
			this._removeClass(
				this._oldListItems.filter( function() {
					return ( $( this ).parent().length === 0 );
				} ),
				"ui-listview-item ui-listview-item-static ui-listview-item-has-count " +
				"ui-listview-item-has-alternate ui-listview-item-divider" );
			this._oldListItems = li;
		}
	}
}, $.mobile.behaviors.addFirstLastClasses ) );

} );

/*!
 * jQuery Mobile Enhancer @VERSION
 * http://jquerymobile.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Enhancer
//>>group: Widgets
//>>description: Enhables declarative initalization of widgets
//>>docs: http://api.jquerymobile.com/enhancer/

( function( factory ) {
	if ( typeof define === "function" && define.amd ) {

		// AMD. Register as an anonymous module.
		define( 'widgets/enhancer',[
			"jquery" ], factory );
	} else {

		// Browser globals
		factory( jQuery );
	}
} )( function( $ ) {

var installed = false;

$.fn.extend( {
	enhance: function() {
		return $.enhance.enhance( this );
	},
	enhanceWithin: function() {
		this.children().enhance();
		return this;
	},
	enhanceOptions: function() {
		return $.enhance.getOptions( this );
	},
	enhanceRoles: function() {
		return $.enhance.getRoles( this );
	}
} );
$.enhance = $.enhance || {};
$.extend( $.enhance, {

	enhance: function( elem ) {
		var i,
			enhanceables = elem.find( "[" + $.enhance.defaultProp() + "]" ).addBack();

		if ( $.enhance._filter ) {
			enhanceables = $.enhance._filter( enhanceables );
		}

		// Check if the widget factory exists and if it
		// does make sure the options extension is installed
		$.enhance._installWidget();

		// Loop over and execute any hooks that exist
		for ( i = 0; i < $.enhance.hooks.length; i++ ) {
			$.enhance.hooks[ i ].call( elem, enhanceables );
		}

		// Call the default enhancer function
		$.enhance.defaultFunction.call( elem, enhanceables );

		return elem;
	},

	// Check if the enhancer has already been defined if it has copy its hooks if not
	// define an empty array
	hooks: $.enhance.hooks || [],

	_filter: $.enhance._filter || false,

	defaultProp: $.enhance.defaultProp || function() { return "data-ui-role"; },

	defaultFunction: function( enhanceables ) {
		enhanceables.each( function() {
			var i,
				roles = $( this ).enhanceRoles();

			for ( i = 0; i < roles.length; i++ ) {
				if ( $.fn[ roles[ i ] ] ) {
					$( this )[ roles[ i ] ]();
				}
			}
		} );
	},

	cache: true,

	roleCache: {},

	getRoles: function( element ) {
		if ( !element.length ) {
			return [];
		}

		var role,

			// Look for cached roles
			roles = $.enhance.roleCache[ !!element[ 0 ].id ? element[ 0 ].id : undefined ];

		// We already have done this return the roles
		if ( roles ) {
			return roles;
		}

		// This is our first time get the attribute and parse it
		role = element.attr( $.enhance.defaultProp() );
		roles = role ? role.match( /\S+/g ) : [];

		// Caches the array of roles for next time
		$.enhance.roleCache[ element[ 0 ].id ] = roles;

		// Return the roles
		return roles;
	},

	optionCache: {},

	getOptions: function( element ) {
		var options = $.enhance.optionCache[ !!element[ 0 ].id ? element[ 0 ].id : undefined ],
			ns;

		// Been there done that return what we already found
		if ( !!options ) {
			return options;
		}

		// This is the first time lets compile the options object
		options = {};
		ns = ( $.mobile.ns || "ui-" ).replace( "-", "" );

		$.each( $( element ).data(), function( option, value ) {
			option = option.replace( ns, "" );

			option = option.charAt( 0 ).toLowerCase() + option.slice( 1 );
			options[ option ] = value;
		} );

		// Cache the options for next time
		$.enhance.optionCache[ element[ 0 ].id ] = options;

		// Return the options
		return options;
	},

	_installWidget: function() {
		if ( $.Widget && !installed ) {
			$.extend( $.Widget.prototype, {
				_getCreateOptions: function( options ) {
					var option, value,
						dataOptions = this.element.enhanceOptions();

					options = options || {};

					// Translate data-attributes to options
					for ( option in this.options ) {
						value = dataOptions[ option ];
						if ( value !== undefined ) {
							options[ option ] = value;
						}
					}
					return options;
				}
			} );
			installed = true;
		}
	}
} );

$.enhance._installWidget();

return $.enhance;
} );

}));
