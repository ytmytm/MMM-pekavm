
//process.binding('http_parser').HTTPParser = require('http-parser-js').HTTPParser;

const request = require('request');
const NodeHelper = require("node_helper");

module.exports = NodeHelper.create({

    start: function() {
        console.log("Starting node helper for: " + this.name);
    },

	/* getParams
	 * Generates an url with api parameters based on the config.
	 *
	 * return String - URL params.
	 */
	
	getParams: function() {
			var params;
			params = {
				url: this.config.apiBase,
				form: {
					method:"getTimes",
					p0:'{"symbol":"'+this.config.stopID+'"}'
				}
			};
			return params;
	},
	
    	socketNotificationReceived: function(notification, payload) {
        	if (notification === 'CONFIG') {
            		this.config = payload;
	   		this.getData(this.getParams(),this.config.stopID);
        	}
    	},

    	getData: function(options,stopID) {
		var x = request.post(options, (error, response, body) => {
		if (typeof response !== 'undefined') {
	        if (response.statusCode === 200) {
			this.sendSocketNotification("TRAMS" + stopID, JSON.parse(body).success);
		} else {
                	console.log("Error getting connections " + response.statusCode);
            	}
		} else {
			console.log("Peka response undefined");
			console.log(x);
			console.log(error);
        	}});
    	}
});

