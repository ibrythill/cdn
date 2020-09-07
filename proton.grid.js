/*
 *  Project:
 *  Description:
 *  Author:
 *  License:
 */

;(function ( $, window, document, undefined ) {

$.protongrid = function(element, options)  {
		var GRID 				= this;
		var $_matrix 			= {},
			$_gridObjects 		= {},
			$_defautlCols,
			$_colWidth 			= 0,
			$_colHeight 		= 0,
			$_maxHeight 		= 0,
			$_maxRow 			= 0,
			$container 			= $(element);

		options = $.extend({
			columns				: 4,
			gutter				: 20,
			height				: false,
			layout				: 'default', //default, columns
			responsive			: [
		        [0, 480, 1],
		        [480, 768, 3],
		        [768, 992, 3]
		    ],
		    beforeStart			: function() {},
			beforePlaceObject	: function() {},
			afterPlaceObject	: function() {},
			afterEnd			: function() {}

		}, options);



		var _addMatrixRow = function (y) {
            if ($_matrix[y]) {
                return false;
            } else{ $_matrix[y] = {};}

            for (var c = 0; c < options.columns; c++) {
                var x = c ;//* ($_colWidth + options.gutter);
                $_matrix[y][x] = false;
            }
            $_maxRow = y;
        };

		var _getWidth = function() {
			return ($container.width() - (options.gutter * (options.columns - 1))) / options.columns;
		};
		var _getItemHeight = function() {
			return (options.height === false) ? $_colWidth : options.height;
		};
		var _setHeight = function(height) {
			if($_maxHeight < height){
				$_maxHeight = height;
			}
		};

		var _getAvailableCluster = function(currentRow,currentCol,rows,cols) {
			var matrixPosition = [];
			currentRow = parseInt(currentRow);
			currentCol = parseInt(currentCol);
			if(typeof rows !== "undefined"){
				rows = parseInt(rows);
			}else{
				rows = 0;
			}
			if(typeof cols !== "undefined"){
				cols = parseInt(cols);
			}else{
				cols = 0;
			}

			if(cols > options.columns) {cols=options.columns;}
			if((currentCol + cols) > options.columns){
				currentRow = currentRow +1;
				if(currentRow > $_maxRow){ _addMatrixRow(currentRow); }
				return _getAvailableCluster(currentRow,0,rows,cols);
			}
			//find columns
			for (var i=currentRow; i < currentRow + rows; i++) {
				//add new row if unavailable
				if(i>$_maxRow){_addMatrixRow(i);}
				for (var j = currentCol; j < currentCol + cols; j++) {

					if($_matrix[i][j] === false){
							matrixPosition.push(i);
							matrixPosition.push(j);
					}else{
						return _getAvailableCluster(currentRow, currentCol+1, rows, cols);
					}
				}
			}

			return matrixPosition;
		};

		var _getAvailableColumn = function() {
			var shortest = false, shortestval;
			for (var i=0; i < options.columns; i++) {
				if(shortest === false || shortestval > $_matrix[i]){
					shortest = i;
					shortestval = $_matrix[i];
				}
			}
			return shortest;
		};

		var _generateObject = function($el) {
			var object = {},width,height;

			var cols = $($el).attr("data-pg-colspan");
			if(typeof cols === "undefined"){ cols = 1; }

			var rows = $($el).attr("data-pg-rowspan");
			if(typeof rows === "undefined"){ rows = 1; }

			if(cols > options.columns){
				cols = options.columns;
			}

			if(cols >= 2){ width 	= $_colWidth * cols + options.gutter * (cols-1); 	}else{ width = $_colWidth; 	}
			if(rows >= 2){ height 	= $_colHeight * rows + options.gutter * (rows-1); 	}else{ height = $_colHeight; 	}

			object.element = $el;
			object.rows = parseInt(rows);
			object.cols = parseInt(cols);
			object.size = [width,height];

			$($el).css({
                'width': width,
                'height': height,
                'position': 'absolute',
                'opacity': 1
	        });
	        return object;
		};

		var _placeObject = function(object, cluster) {
			var posX,posY;

			var clusterX = cluster[0],
				clusterY = cluster[1];

			posX = clusterY * ($_colWidth + options.gutter);
			posY = ($_colHeight + options.gutter) * clusterX;

			object.posX = [clusterX,posX];
			object.posY = [clusterY,posY];

			for (var h = clusterX; h < (clusterX + object.rows); h++) {
				for (var g = clusterY; g < ( clusterY + object.cols );g++) {
					 if(h === clusterX && g ===  clusterY ){
					 	$_matrix[h][g] = object;
					 }else{
					 	$_matrix[h][g] = object;
					 }
				}
			}

			$(object.element).css({
                'top': posY,
                'left': posX
            });
		};



		var _fillGridGaps = function(){

		};

		// Create the listener function
		var _resizeLayout = _debounce(function() {
			$_maxHeight = 0;
			$_matrix = {};
			var windowWidth = $(window).width();
			options.columns = $_defautlCols;
			$.each(options.responsive, function (key, value ) {
				if(windowWidth>value[0] && windowWidth<=value[1]){options.columns = value[2];}
			});

			_generateGrid();


		}, 100); // Maximum run of once per 500 milliseconds

		// Add the event listener
		window.addEventListener("resize", _resizeLayout, false);

		var _generateGrid = function(){

			options.beforeStart();
			$_colWidth = _getWidth();
			$_colHeight = _getItemHeight();

			_addMatrixRow(0);

			$.each($_gridObjects, function (index) {

				var object = _generateObject(this);
				object.index = index;
				var cluster;
				cluster = _getAvailableCluster(0,0, object.rows, object.cols);

				options.beforePlaceObject(object,cluster);

				_placeObject(object, cluster);

				options.afterPlaceObject(object,cluster);

			});
			//_fillGap();
			var height = (parseInt($_maxRow +1) * ($_colHeight + options.gutter));

			$container.css({ 'height': height});

			options.afterEnd();

		};
		GRID._updateLayout = function(){
			$_maxHeight = 0;
			$_matrix = {};
			_generateGrid();

		};

		GRID._init = function(){
			$_defautlCols = options.columns;
			$_gridObjects = $container.children();
			if($_gridObjects.length === 0){return true;}
			$container.css({'position':'relative'});

			_generateGrid();

		};
		GRID._init();
	};

	$.fn.protongrid = function(options) {

        return this.each(function() {
            if (undefined === $(this).data('protongrid')) {
                var plugin = new $.protongrid(this, options);
                $(this).data('protongrid', plugin);
            }
        });

    };



})( jQuery, window, document );
