
//process.binding('http_parser').HTTPParser = require('http-parser-js').HTTPParser;

const request = require('request');
const NodeHelper = require("node_helper");

var mm_kvv_up_detected = false; //whether some other module e.g. Pir ever has sent USER_PRESENCE Event
var mm_kvv_upresent = true; //current status of user presence

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
		if (notification === 'USER_PRESENCE') {
 			mm_kvv_up_detected = true;
 			mm_kvv_upresent = payload;
 		}
    	},

    	getData: function(options,stopID) {
		if (!mm_kvv_up_detected || mm_kvv_upresent) { // do anything only if user is present
		var x = request.post(options, (error, response, body) => {
		if (typeof response !== 'undefined') {
	        if (response.statusCode === 200) {
			var res = JSON.parse(body);
			if (typeof res.success !== 'undefined') {
				this.sendSocketNotification("TRAMS" + stopID, res.success);
			} else {
				this.sendSocketNotification("TRAMSFAIL" + stopID, res);
			}
		} else {
                	console.log("Error getting connections " + response.statusCode);
            	}
		} else {
			console.log("Peka response undefined");
			console.log(x);
			console.log(error);
		}})};
    	}
});

