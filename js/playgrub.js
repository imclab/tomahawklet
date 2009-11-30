Playgrub = {
    PGHOST: 'http://localhost:8080/',
    VERSION: '0.8',
    playlist: {},
    client: {},
    player: {},
    source: {},
    bookmarklet: {},
    content: {}
};

Playgrub.Events = {

    // Playgrub init
    init: function() {
        // new Playgrub.Playlist();
        // new Playgrub.ScraperSource();
        // new Playgrub.RemoteSource();
        // new Playgrub.Client();
        // new Playgrub.Bookmarklet();
        // new Playgrub.Content();
    },

    // no scraper found for this domain
    noScraper: function() {
        // Playgrub.container.set_status("This site is currently not supported by Playgrub");
    },

    // scraper found but there were no songs
    noSongs: function() {
        // Playgrub.container.set_status(Playgrub.source.error);
    },

    // scraper done finding songs
    foundSongs: function() {
        // Playgrub.playlist.url = window.location;
        // Playgrub.playlist.title = document.title;

        // write to playgrub server
        // Playgrub.client.write_playlist(Playgrub.playlist);

    },

    // Playgrub.client is done broadcasting playlist
    clientPlaylistPublished: function() {
        // Post to Twitter
        // Playgrub.Util.inject_script(Playgrub.PGHOST+'twitter_post?playlist='+Playgrub.playlist.id);

        // Playgrub.container.playlist_loaded();
    },

    // Playgrub.client is broadcasting a playlist track
    clientTrackPublished: function() {
        // Playgrub.container.track_broadcast();
    }
};

Playgrub.Playlist = function() {
    Playgrub.playlist = this;
};

Playgrub.Playlist.prototype = {
    id: '',
    title: '',
    url: '',
    xspf: '',
    tracks: [],

    add_track: function(artist, song) {
        this.tracks.push([artist, song]);
    },

    to_html: function() {
        var html ='';
        html = html+'<div class=\'playgrub-playlist\'>';
        for (var i in this.tracks) {
            if(this.tracks[i][0] && this.tracks[i][1])
                html = html+'<div class=\'playgrub-playlist-track\'>'+decodeURIComponent(this.tracks[i][0])+' - '+decodeURIComponent(this.tracks[i][1])+'</div>';
        }
        html = html+'</div>';

        return html;
    },

    xspf_url: function() {
        if(this.id != '')
            return Playgrub.PGHOST+this.id+".xspf";
        else if(this.xspf != '')
            return this.xspf;
        // no xspf url for some reason
        return false;
    }

};

Playgrub.Client = function() {
    Playgrub.client = this;

    this.broadcast_index = 0;

    this.write_playlist = function(playlist) {
        var data;

        if(playlist.tracks.length == 0){
            return false;
        }

        if(this.broadcast_index > playlist.tracks.length) {
            Playgrub.Events.clientPlaylistPublished();
            return false;
        }

        if(this.broadcast_index == 0) {
            // first song in playlist, write header
            data = Playgrub.PGHOST+'playlist_header.js?songs='+playlist.tracks.length+
                '&title='+encodeURIComponent(playlist.title)+'&url='+encodeURIComponent(playlist.url);
            Playgrub.Util.inject_script(data);
        } else {
            // write current track
            data = Playgrub.PGHOST+'playlist_track.js?artist='+encodeURIComponent(playlist.tracks[this.broadcast_index-1][0])+'&track='+
                encodeURIComponent(playlist.tracks[this.broadcast_index-1][1])+'&index='+encodeURIComponent(this.broadcast_index)+'&playlist='+playlist.id;
            Playgrub.Util.inject_script(data);
            Playgrub.Events.clientTrackPublished();
        }
    }
};

Playgrub.Sidebar = function() {
    Playgrub.container = this;

    this.title = '';
    this.url = '';

    Playgrub.Util.inject_css(Playgrub.PGHOST+'css/sidebar.css');
    $('body').prepend(this.base_html());
};

Playgrub.Sidebar.prototype = {
    base_html: function() {
        return "<div id='playgrub-bookmarklet'>"
        +"<div id='playgrub-bookmarklet-background'></div>"
        +"<div id='playgrub-bookmarklet-body'>"
        +"<div id='playgrub-bookmarklet-header'>"
        +"<span id='playgrub-playlist-title' class='playgrub-clickable'><a href='"+this.url+"' target='_blank'>"+this.title+"</a></span>"
        +"</div>"
        +"<div id='playgrub-bookmarklet-content'>"
        +'<iframe id=\'playgrub-server-iframe\' name=\'playgrub-server-iframe\' scrolling=\'no\' src=\''+Playgrub.PGHOST+'bookmarklet_iframe?\'></iframe>'
        +"</div>"
        +"</div>"
        +"</div>";
    },

    iframe_loaded: function() {
        var iframe = window.frames['playgrub-server-iframe'];
        iframe.postMessage(Playgrub.Util.JSONstringify(Playgrub.playlist), '*');
        $("#playgrub-bookmarklet-content").slideDown("normal", function(){ });
    },

    playlist_loaded: function() {
        // playlist loaded, setup iframe
        var iframe = window.frames['playgrub-server-iframe'];
        // TODO check to see if iframe is ready for postMessage with src # polling
        if(typeof(iframe.postMessage) != undefined) {
            setTimeout(Playgrub.container.iframe_loaded, 2000);
        }
    },

    track_broadcast: function() {
    },

    set_title: function(title, url) {
        this.title = title;
        this.url = url;
        this.update_title();
    },

    update_title: function() {
        var title_html = "<a href='"+this.url+"' target='_blank'>"+this.title+"</a>";
        $('#playgrub-playlist-title').html(title_html);
    }
}

Playgrub.Standalone = function() {
    Playgrub.container = this;
    Playgrub.Util.inject_css(Playgrub.PGHOST+'css/standalone.css');
    $('body').prepend(this.base_html);
};

Playgrub.Standalone.prototype = {
    base_html: "<div id='playgrub-bookmarklet'>"
        +"<div id='playgrub-bookmarklet-background'></div>"
        +"<div id='playgrub-bookmarklet-body'>"
        +"<div id='playgrub-bookmarklet-header'>"
        +"<span class='playgrub-clickable' onclick='window.open(\""+Playgrub.PGHOST+"\")'><img src=\'"+Playgrub.PGHOST+"images/logo-sm.gif\' /></span>"
        +"</div>"
        +"<div id='playgrub-bookmarklet-content'>"
        +'<iframe id=\'playgrub-server-iframe\' name=\'playgrub-server-iframe\' scrolling=\'no\' src=\''+Playgrub.PGHOST+'bookmarklet_iframe?\'></iframe>'
        +"</div>"
        +"</div>"
        +"</div>",

    iframe_loaded: function() {
        var iframe = window.frames['playgrub-server-iframe'];
        iframe.postMessage(Playgrub.Util.JSONstringify(Playgrub.playlist), '*');
        $("#playgrub-bookmarklet-content").slideDown("normal", function(){ });
    },

    playlist_loaded: function() {
        // playlist loaded, setup iframe
        var iframe = window.frames['playgrub-server-iframe'];
        // TODO check to see if iframe is ready for postMessage with src # polling
        if(typeof(iframe.postMessage) != undefined) {
            setTimeout(Playgrub.container.iframe_loaded, 2000);
        }

        // set the document title to the playlist title
        document.title = 'Playgrub - '+Playgrub.playlist.title;
    },

    track_broadcast: function() {
    }
}

Playgrub.Bookmarklet = function() {
    Playgrub.container = this;

    Playgrub.Util.inject_css(Playgrub.PGHOST+'css/bookmarklet.css');
    $('body').prepend(this.base_html);
    this.set_status("Loading...");
    $('#playgrub-bookmarklet-content').hide();
};

Playgrub.Bookmarklet.prototype = {
    base_html: "<div id='playgrub-bookmarklet'>"
        +"<div id='playgrub-bookmarklet-background'></div>"
        +"<div id='playgrub-bookmarklet-body'>"
        +"<div id='playgrub-bookmarklet-header'>"
        +"<div id='playgrub-bookmarklet-close' class='playgrub-clickable' onclick='$(\"#playgrub-bookmarklet\").remove(); return false;'>"
        +"close"
        +"</div>"
        +"<span class='playgrub-clickable' onclick='window.open(\""+Playgrub.PGHOST+"\")'><img src=\'"+Playgrub.PGHOST+"images/logo-sm.gif\' /></span>"
        +"</div>"
        +"<div id='playgrub-bookmarklet-content'>"
        +'<iframe id=\'playgrub-server-iframe\' name=\'playgrub-server-iframe\' scrolling=\'no\' src=\''+Playgrub.PGHOST+'bookmarklet_iframe?\'></iframe>'
        +"</div>"
        +"<div id='playgrub-bookmarklet-status'></div>"
        +"</div>"
        +"</div>",

    iframe_loaded: function() {
        var iframe = window.frames['playgrub-server-iframe'];
        iframe.postMessage(Playgrub.Util.JSONstringify(Playgrub.playlist), '*');
        Playgrub.container.hide_status();
        $("#playgrub-bookmarklet-content").slideDown("normal", function(){ });
    },

    playlist_loaded: function() {
        // playlist loaded, setup iframe
        var iframe = window.frames['playgrub-server-iframe'];
        // TODO check to see if iframe is ready for postMessage with src # polling
        if(typeof(iframe.postMessage) != undefined) {
            setTimeout(Playgrub.container.iframe_loaded, 2000);
        }
    },

    track_broadcast: function() {
    },

    set_status: function(new_status) {
        $("#playgrub-bookmarklet-status").html(new_status);
    },

    show_status: function(new_status) {
        $("#playgrub-bookmarklet-status").show();
    },

    hide_status: function(new_status) {
        $("#playgrub-bookmarklet-status").hide();
    }

};

Playgrub.Content = function() {
    Playgrub.content = this;

    this.show_resolved_only = false;

    this.base_html = function() {
        return ""
        +"<div id='playgrub-playdar-frame'>"
        +"<div id='playgrub-playdar-status'></div>"
        +"<div id='playgrub-playdar-loading'></div>"
        +"</div>";
    };

    this.playlist_html = function() {
        return ""
        +"<div id='playgrub-bookmarklet-buttons'>"
        +"<span id='playgrub-bookmarklet-play-button' class='playgrub-clickable playgrub-button'>"
        +"&#9654;"
        +"</span>"
        +"<span id='playgrub-bookmarklet-next-button' class='playgrub-clickable playgrub-button'>"
        +"&#9654;l"
        +"</span>"
        +"<span class='playgrub-clickable playgrub-button' "
        +"onClick='window.open(\"http://j.mp/?v=3&u="+encodeURIComponent(Playgrub.Util.playgrub_link(Playgrub.playlist.xspf_url()))+"&s="+encodeURIComponent(Playgrub.playlist.title)+"\");'>"
        +"Share"
        +"</span>"
        +"<span id='playgrub-tracks-toggle' class='playgrub-clickable playgrub-button' "
        +"onClick='Playgrub.content.toggle_tracks();'>"
        +"Playable"
        +"</span>"
        +"</div>"
        +"<div id='playgrub-bookmarklet-links'>"
        +"<span style='margin-right: 10px;'>More:</span>"
        +"<span class='playgrub-clickable playgrub-link' onClick='window.open(\""+Playgrub.Util.playlick_link(Playgrub.playlist.xspf_url())+"\");'>Playlick</span>"
        +"<span class='playgrub-clickable playgrub-link' onClick='window.open(\""+Playgrub.Util.spiffdar_link(Playgrub.playlist.xspf_url())+"\");'>Spiffdar</span>"
        +"<span class='playgrub-clickable playgrub-link' onClick='window.open(\""+Playgrub.playlist.xspf_url()+"\");'>Download XSPF</span>"
        +"</div>";
    };

    this.display_playlist = function() {
        $('#playgrub-iframe-content').prepend(Playgrub.content.playlist_html());
        $('#playgrub-iframe-content').prepend(Playgrub.playlist.to_html());

        // set ui to show or hide unresolved songs
        if(this.show_resolved_only) {
            $('.playgrub-playlist-track').hide();
            $("#playgrub-tracks-toggle").addClass("playgrub-tracks-toggle-on");
        } else {
            $("#playgrub-tracks-toggle").removeClass("playgrub-tracks-toggle-on");
        }

        // setup play button
        $('#playgrub-bookmarklet-play-button').click(function() {
            PlaygrubFrame.play_playlist(); // TODO fix this
        });

        // setup next button
        $('#playgrub-bookmarklet-next-button').click(function() {
            PlaygrubFrame.play_next(); // TODO fix this
        });

    };

    this.display_playdar_status = function(pstatus) {
        $('#playgrub-playdar-status').html(pstatus);
    };

    this.playdar_active = function() {
        $('#playgrub-playdar-loading').html("<img src='"+Playgrub.PGHOST+"images/loading.gif' style='border: 0px;' />");
    };

    this.playdar_idle = function() {
        $('#playgrub-playdar-loading').html("");
    }

    this.show_all_tracks = function() {
        $('div.playgrub-playlist-track').show()
    };

    this.hide_unresolved_tracks = function() {
        $('div.playgrub-playlist-track').hide()
        $('div.playgrub-playlist-track-resolved').show()
    };

    this.toggle_tracks = function() {
        if(this.show_resolved_only) {
            $("#playgrub-tracks-toggle").removeClass("playgrub-tracks-toggle-on");
            this.show_all_tracks();
            this.show_resolved_only = false;
        } else {
            $("#playgrub-tracks-toggle").addClass("playgrub-tracks-toggle-on");
            this.hide_unresolved_tracks();
            this.show_resolved_only = true;
        }
    }

    $('#playgrub-iframe-content').append(Playgrub.content.base_html());
},

Playgrub.XSPFSource = function(xspf_url) {
    Playgrub.source = this;

    this.start = function(data) {
        var jspf = eval("("+xml2json(data,'')+")");
        var jplaylist = jspf.playlist;
        Playgrub.playlist.url = Playgrub.source.url;
        Playgrub.playlist.xspf = Playgrub.source.url;
        Playgrub.playlist.title = jplaylist.title;
        // Playgrub.playlist.id = rplaylist.id;
        for(n in jplaylist.trackList.track) {
            Playgrub.playlist.add_track(jplaylist.trackList.track[n].creator,jplaylist.trackList.track[n].title);
        }
        Playgrub.Events.foundSongs();
    };

    this.url = xspf_url;

    // make sure js/xml2json.js is loaded in whatever called this constructor
    $.get(this.url, function(data){ Playgrub.source.start(data); });

};

Playgrub.XSPFSource.prototype = {
    url: ''
};

Playgrub.RemoteSource = function() {
    Playgrub.source = this;

    this.start = function(e) {
        var rplaylist = Playgrub.Util.JSONparse(e.data);
        Playgrub.playlist.id = rplaylist.id;
        Playgrub.playlist.xspf = rplaylist.xspf;
        Playgrub.playlist.url = rplaylist.url;
        Playgrub.playlist.title = rplaylist.title;
        Playgrub.playlist.tracks = eval(rplaylist.tracks);
        Playgrub.Events.foundSongs();
    };

    window.addEventListener("message", function(e) { Playgrub.source.start(e); }, false);
}

Playgrub.ScraperSource = function() {
    Playgrub.source = this;

    Playgrub.Util.inject_script(Playgrub.PGHOST+'scraper.js?url='+encodeURIComponent(window.location));

    this.start = function() {
        var regex = new RegExp(this.url);
        if(this.scrape && regex.exec(window.location)) {
            this.scrape();
            if(Playgrub.playlist.tracks.length > 0){
                Playgrub.playlist.url = window.location;
                Playgrub.playlist.title = document.title;

                Playgrub.Events.foundSongs();
                return true;
            }
        }
        Playgrub.Events.noSongs();
        return false;
    }

};

Playgrub.ScraperSource.prototype = {
    url: '',
    error: '',
    scrape: null
};


Playgrub.Util = {

    inject_script: function (script) {
        var script_element = document.createElement('script');
        script_element.type = 'text/javascript';
        script_element.src = script;
        document.getElementsByTagName('head')[0].appendChild(script_element);
    },

    inject_css: function (css) {
        var css_element = document.createElement('link');
        css_element.type = 'text/css';
        css_element.rel = 'stylesheet';
        css_element.href = css;
        document.getElementsByTagName('head')[0].appendChild(css_element);
    },

    load_remotes: function(remotes, callback) {
        var index = 0;
        var remotes_callback = function() {
            if(index == remotes.length){
                callback();
            } else {
                Playgrub.Util.load_remote(remotes[index][0], remotes[index][1], remotes_callback);
                index++;
            }
        };
        remotes_callback();
    },

    load_remote: function(object_type, remote_url, callback) {
        Playgrub.Util.inject_script(remote_url);
        var poll = function() { Playgrub.Util.load_remote_poll(object_type, callback); };
        setTimeout(poll, 5);
    },

    load_remote_poll: function(object_type, callback){
        if (eval('typeof('+object_type+')') == 'undefined') {
            var poll = function() { Playgrub.Util.load_remote_poll(object_type, callback); };
            setTimeout(poll, 50);
        } else {
            // document set up, start doing stuff
            callback();
        }
    },

    playlick_link: function(xspf) {
        return "http://www.playlick.com/#xspf="+xspf;
    },

    spiffdar_link: function(xspf) {
        return "http://spiffdar.org/?spiff="+encodeURIComponent(xspf);
    },

    playgrub_link: function(xspf) {
        return Playgrub.PGHOST+"player?xspf="+encodeURIComponent(xspf);
    },

    // implement JSON.stringify and JSON.parse serialization
    // from http://www.sitepoint.com/blogs/2009/08/19/javascript-json-serialization/
    JSONstringify: function (obj) {
        var t = typeof (obj);
        if (t != "object" || obj === null) {
            // simple data type
            if (t == "string") obj = '"'+obj+'"';
            return String(obj);
        }
        else {
            // recurse array or object
            var n, v, json = [], arr = (obj && obj.constructor == Array);
            for (n in obj) {
                v = obj[n]; t = typeof(v);
                if (t == "string") v = '"'+v+'"';
                else if (t == "object" && v !== null) v = JSON.stringify(v);
                json.push((arr ? "" : '"' + n + '":') + String(v));
            }
            return (arr ? "[" : "{") + String(json) + (arr ? "]" : "}");
        }
    },

    JSONparse: function(str) {
        if (str === "") str = '""';
        eval("var p=" + str + ";");
        return p;
    }

};
