'use strict';

module.exports = function(Chart) {

	var helpers = Chart.helpers;

	Chart.defaults.barError = helpers.extend(Chart.defaults.bar, {
		errorDir: "both",
		errorStrokeWidth: 1,
		errorCapWidth: 0.75,
		errorColor: null
	});

	Chart.controllers.barError = Chart.controllers.bar.extend({

		dataElementType: Chart.elements.Rectangle,

		initialize: function(chart, datasetIndex) {
			Chart.controllers.bar.prototype.initialize.apply(this, arguments);
		},

		addElements: function() {
			// call Super
			Chart.controllers.bar.prototype.addElements.call(this);
			var me = this;
			var meta = me.getMeta();
			var error = me.getDataset().error || [];
			var i, ilen;

			meta.error = meta.error || [];

			helpers.each(error, function(value, index) {
				meta.error[index] = new Chart.elements.ErrorBar({
					_chart: this.chart.chart,
					_datasetIndex: this.index,
					_index: index
				});
			}, this);
		},

		update: function(reset) {
			var me = this;
			var meta = me.getMeta();
			helpers.each(meta.data, function(rectangle, index) {
				me.updateElement(rectangle, index, reset);
				me.updateErrorBar(meta.error[index], rectangle, index, reset);
			}, me);
		},

		updateErrorBar: function(errorBar, rectangle, index, reset, numBars) {

			var meta = this.getMeta();
			var xScale = this.getScaleForId(meta.xAxisID);
			var yScale = this.getScaleForId(meta.yAxisID);

			//TODO: abstract out so these can be global options
			var errorDir = this.getDataset().errorDir || Chart.defaults.barError.errorDir;
			var errorCapWidth = this.getDataset().errorCapWidth || Chart.defaults.barError.errorCapWidth;
			var errorStrokeColor = this.getDataset().errorColor || rectangle._model.backgroundColor;
			var errorStrokeWidth = this.getDataset().errorStrokeWidth || Chart.defaults.barError.errorStrokeWidth;

			var ruler = this.getRuler(index);
			helpers.extend(errorBar, {
				// Utility
				_chart: this.chart.chart,
				_xScale: xScale,
				_yScale: yScale,
				_datasetIndex: this.index,
				_index: index,

				_model: {
					x: this.calculateBarX(index, this.index, ruler),
					yTop: this.calculateErrorBarTop(index, this.index),
					yBottom: this.calculateErrorBarBottom(index, this.index),

					// Appearance
					capWidth: rectangle._model.width * errorCapWidth,
					direction: errorDir,
					strokeColor: errorStrokeColor,
					strokeWidth: errorStrokeWidth
				}

			});
			errorBar.pivot();
		},

		calculateErrorBarTop: function(index, datasetIndex) {
			var value = this.getDataset().data[index] + this.getDataset().error[index],
				yScale = this.getScaleForId(this.getMeta().yAxisID);

			//TODO: still need to worry about stacked bar chart.
			return yScale.getPixelForValue(value);
		},

		calculateErrorBarBottom: function(index, datasetIndex) {
			var value = this.getDataset().data[index] - this.getDataset().error[index],
				yScale = this.getScaleForId(this.getMeta().yAxisID);

			//TODO: still need to worry about stacked bar chart.
			return yScale.getPixelForValue(value);
		},

		draw: function(ease) {
			Chart.controllers.bar.prototype.draw.call(this, ease);
			var easingDecimal = ease || 1;
			var metaError = this.getMeta().error;
			var dataset = this.getDataset();
			helpers.each(metaError, function(errorBar, index) {
				var e = dataset.error[index];
				if (e !== null && e !== undefined && !isNaN(e)) {
					errorBar.transition(easingDecimal).draw();
				}
			}, this);

			return;
		}

	});
};
