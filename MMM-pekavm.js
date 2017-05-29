
// to make it work I had to add this line on top of MagicMirror/js/app.js
// (this is because PEKA server returns malformed response
// process.binding('http_parser').HTTPParser = require('http-parser-js').HTTPParser;

Module.register("MMM-pekavm", {
    defaults: {
		maxConn: '8',
		lines: [], // for example ["12","238"]
		labelRow: true,
		alwaysShowTime: true,
		stopID: 'RKAP71',
		apiBase: 'http://www.peka.poznan.pl/vm/method.vm',
		timeFormat: config.timeFormat,
        	reload: 1 * 30 * 1000       // every half minute
    },
    // fixme: add ticker with important ZTM messages

    getTranslations: function () {
        return {
            en: "translations/en.json",
            de: "translations/de.json",
	    pl: "translations/pl.json"
        };
    },

    getScripts: function () {
	return ['moment.js'];
    },

    getStyles: function () {
        return ["MMM-pekavm.css"];
    },

    start: function () {
	var self = this;
        Log.info("Starting module: " + this.name);

        this.sendSocketNotification("CONFIG", this.config);
	setInterval(function(){self.sendSocketNotification("CONFIG", self.config);},
		this.config.reload);
    },

    notificationReceived: function(notification, payload, sender) {
	if (notification === 'USER_PRESENCE') {
	    this.sendSocketNotification(notification, payload);
	    if (payload) { // update now
		this.sendSocketNotification("CONFIG", this.config);
	    }
	}
    },

    socketNotificationReceived: function (notification, payload) {
	if (notification === "TRAMS" + this.config.stopID) {
		this.peka_data = payload;
		this.peka_data.success = true;
		this.updateDom();	
	}
	if (notification === "TRAMSFAIL" + this.config.stopID) {
		this.peka_data = { success : false };
		this.updateDom();
	}
    },

    getDom: function () {
	// Auto-create MagicMirror header
	var wrapper = document.createElement("div");
        var header = document.createElement("header");
        wrapper.appendChild(header);
	// LOADING notification
	if (!this.peka_data) {
            var text = document.createElement("div");
            text.innerHTML = this.translate("LOADING");
            text.className = "small dimmed";
            wrapper.appendChild(text);
	    return(wrapper)
	}
	if (!this.peka_data.success) {
            var text = document.createElement("div");
            text.innerHTML = this.translate("WRONG_STOP_ID_IN_CONFIG");
            text.className = "small dimmed";
	    header.innerHTML = this.config.stopID;
            wrapper.appendChild(text);
	    return(wrapper)
	}
	header.innerHTML = this.peka_data.bollard.name;
	// Start creating connections table
	var table = document.createElement("table");
	table.classList.add("small", "table");
	table.border='0';
	// no trains
	if (this.peka_data.times.length == 0) {
		if (!this.hidden) {
			table.appendChild(this.createNoTramRow());
			wrapper.appendChild(table);
			this.hide(10000);
		}
		return(wrapper);
	} 
	// there are trains
	if (this.config.labelRow) {
		table.appendChild(this.createLabelRow());
	}
	table.appendChild(this.createSpacerRow());
	// list trains
	//console.log(this.peka_data.times);
	var counter = 0;
	for (var i=0;i<this.peka_data.times.length && i<this.config.maxConn;i++) {
		var tram = this.peka_data.times[i];
		var useLine = true;
		if (this.config.lines.length>0) {
			useLine = this.config.lines.indexOf(tram.line) >= 0;
		}
		if (useLine) {
			table.appendChild(this.createDataRow(tram));
			counter++;
		}
	};
	wrapper.appendChild(table);
	// if no trams were left after filtering then hide for a while
	if (counter==0 && !this.hidden) {
		this.hide(10000);
	}
	// otherwise reveal yourself
	if (counter>0 && this.hidden) {
		this.show(5000);
	}
	return(wrapper);
    },

    createDataRow: function (data) {
        var row = document.createElement("tr");

        var line = document.createElement("td");
	line.className = "line";
        line.innerHTML = data.line;
        row.appendChild(line);

        var destination = document.createElement("td");
        destination.innerHTML = data.direction;
        row.appendChild(destination);

	var hourSymbol = "HH";
	if (this.config.timeFormat !== 24) {
		hourSymbol = "hh";
	}
        var departure = document.createElement("td");
	departure.className = "departure";
	if (data.realTime) {
		if (data.onStopPoint) {
			departure.innerHTML = this.translate("NOW"); // tram is on stop right now
		} else {
			if (data.minutes==0) {
				departure.innerHTML = this.translate("MINUTE"); // less than 1 minute
			} else { 
				departure.innerHTML = data.minutes + " "+this.translate("MINUTES"); // in ... minutes
			}
			if (this.config.alwaysShowTime) {
			    departure.innerHTML = departure.innerHTML + " (" + moment(data.departure).utc().format(hourSymbol+":mm")+")";
			}
		}
	} else {
		// parse data.departure to HH:MM
		departure.innerHTML = moment(data.departure).utc().format(hourSymbol+":mm");
	}
        row.appendChild(departure);

        return row;
    },

    createLabelRow: function () {
        var labelRow = document.createElement("tr");
		
        var lineLabel = document.createElement("th");
	lineLabel.className = "line";
        lineLabel.innerHTML = this.translate("LINE");
        labelRow.appendChild(lineLabel);

        var destinationLabel = document.createElement("th");
	destinationLabel.className = "destination";
        destinationLabel.innerHTML = this.translate("DESTINATION");
        labelRow.appendChild(destinationLabel);

        var departureLabel = document.createElement("th");
	departureLabel.className = "departure";
        departureLabel.innerHTML = this.translate("DEPARTURE");
        labelRow.appendChild(departureLabel);
		
	return labelRow;
    },

    createSpacerRow: function () {
        var spacerRow = document.createElement("tr");
		
	var spacerHeader = document.createElement("th");
	spacerHeader.className = "spacerRow";
	spacerHeader.setAttribute("colSpan", "3");
	spacerHeader.innerHTML = "";
	spacerRow.appendChild(spacerHeader); 

	return spacerRow;
    },

    createNoTramRow: function () {
        var noTramRow = document.createElement("tr");
		
		var noTramHeader = document.createElement("th");
		noTramHeader.className = "noTramRow";
		noTramHeader.setAttribute("colSpan", "3");
		noTramHeader.innerHTML = this.translate("NO-TRAMS");
		noTramRow.appendChild(noTramHeader); 
      	
		return noTramRow;
    },

});

