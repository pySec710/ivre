/*
 * This file is part of IVRE.
 * Copyright 2011 - 2015 Pierre LALET <pierre.lalet@cea.fr>
 *
 * IVRE is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * IVRE is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public
 * License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with IVRE. If not, see <http://www.gnu.org/licenses/>.
 */

/****** Load Configuration *******/

function setdefaultconfig() {
    var defaultconfig = {
	"notesbase": "/dokuwiki/#IP#",
	"cgibase": "/cgi-bin/scanjson.py",
	"dflt": {
	    "limit": 10,
	},
	"warn_dots_count": 20000,
	"publicsrv": false,
	"uploadok": false,
    };

    for(var k in defaultconfig) {
	if (config[k] === undefined) {
	    config[k] = defaultconfig[k];
	}
    }
}

setdefaultconfig();

/****** Global Variables *******/

/* global variables */
var clicktimeout = null;
var wanted_scripts, wanted_hops;

/******* IVRE specific methods *******/

function hideall() {
    $("#notes-container").children().css("display", "none");
}

function addr_links(host) {
    var addr = host.addr.split('.');
    var result = [];
    var net;
    for(var i = 0; i < addr.length; i++) {
	//net = addr.slice(0, i + 1).join('.') + '.0'.repeat(3 - i);
	net = addr.slice(0, i + 1).join('.') + repeat('.0', 3 - i);
	if(i !== 3)
	    net += '/' + (8 * (i+1));
	result.push({
	    "addrpart": addr[i],
	    "net": net,
	});
    }
    return result;
}

function hostnames_links(host) {
    if(!('hostnames' in host))
	return [];
    var hostnames = host.hostnames;
    var results = [];
    for(var i in hostnames) {
	if('name' in hostnames[i]) {
	    var names = hostnames[i].name.split('.');
	    var fullname = names.shift();
	    var result = [{
		'param': 'hostname',
		'value': fullname + '.' + names.join('.'),
		'name': fullname,
	    }];
	    for(var j in names) {
		result.push({
		    'param': 'domain',
		    'value': names.slice(j).join('.'),
		    'name': names[j],
		});
	    }
	    results.push(result);
	}
    }
    return results;
}

function port_summary(host, width) {
    /*
      This function prepares the host with a summary for ports, and
      creates the hostscripts section.
     */
    var result = [], status;
    if(width === undefined)
	width = 4;
    if('extraports' in host) {
	for(status in host.extraports) {
	    var values = host.extraports[status];
	    result.push({"type": "extra", "status": status,
			 "count": values[0] + '',
			 "reasons": values[1]});
	}
    }
    if('ports' in host) {
	var ports = {};
	for(var i in host.ports) {
	    var port = host.ports[i];
	    if(port.port == "host") {
		host.scripts = port.scripts;
	    }
	    else {
		if(port.state_state in ports)
		    ports[port.state_state].push({
			'protocol': port.protocol,
			'port': port.port
		    });
		else
		    ports[port.state_state] = [{'protocol': port.protocol,
						'port': port.port}];
	    }
	}
	for(status in ports) {
	    result.push({"type": "ports", "status": status,
			 "count": ports[status].length,
			 "ports": ports[status]});
	}
    }
    return result;
}

function wait_filter(fct) {
    if(FILTER === undefined) {
	/* XXX Wait for FILTER to be ready. */
	setTimeout(fct, 100);
	return false;
    }
    return true
}

/******* Main function *********/

function load() {
    if(!(wait_filter(load)))
	return;
    window.onhashchange = function() {
	FILTER.query = get_hash();
	if (!(load_params(FILTER)))
	    return;
	FILTER.on_query_update();
    };
    FILTER.callback_pre_get_results = function() {
	clear_hosts();
	hidecharts();
	changefav("favicon-loading.gif");
    };
    FILTER.callback_get_results = function(data) {
	add_hosts(data);
    };
    FILTER.callback_final = function() {
	set_display_mode(getparam(FILTER, 'display'));
    };
    FILTER.callback_post_get_results = function() {
	var hostcount = count_displayed_hosts(),
	limit = getparam(FILTER, 'limit'),
	skip = getparam(FILTER, 'skip');
	if(limit === undefined)
	    limit = config.dflt.limit;
	else
	    limit = limit * 1;
	if(skip === undefined)
	    skip = 0;
	else {
	    skip = skip * 1;
	    if(skip < 0)
		setparam('skip', 0, true);
	}
	var maxres = skip + hostcount;
	if(maxres !== skip) {
	    set_display_bounds(skip + 1, maxres);
	}
	changefav("favicon.png");
	if(hostcount === 1) {
	    toggle_full_display(0);
	}
    };
    document.getElementById("filter-last").focus();
    FILTER.query = get_hash();
    if (!(load_params(FILTER)))
	return;
    FILTER.on_query_update();
}

function init_report() {
    if(!(wait_filter(init_report)))
	return;
    window.onhashchange = init_report;
    FILTER.query = get_hash();
    if (!(load_params(FILTER)))
	return;
    FILTER.on_query_update();
}
