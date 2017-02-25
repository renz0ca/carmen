var fs = require('fs');
var ytdl = require('ytdl-core');
var cheerio = require("cheerio")
var request = require("tinyreq")

var AUDIO_STREAM = null;

function send_message(bot, channelID, message){
    bot.sendMessage({to: channelID, message: message});
}

function grab_url(message){
    URL_List = message.match(/(https?:\/\/[^\s]+)/g);
    return URL_List && URL_List[0]
}

function fetch_primary_voice_channel(bot, channelID) {
    var voice_channel_name = "General"
    var server_id = bot.channels[channelID].guild_id
    var channels = bot.servers[server_id].channels;
    for (var channel in channels) {
        if (channels[channel].type === 'voice' && channels[channel].name === voice_channel_name)
            return channels[channel]
    }
}

function fetch_website_content(stream_details) {
    //Determine Webservice
    if(stream_details['url'].includes("youtube.com")) callback = stream_youtube_video
    //else if(stream_details['url'].includes("soundcloud.com")) callback = stream_soundcloud_audio
    else {
        stream_details['bot'].sendMessage({to: stream_details['channelID'], message: "Sorry I don't support that service :confused:"});
        return;
    }
    //Fetch Website Contents and then Init Streaming via Callback
    request(url, function(err, body){
        if (err){ console.log("Could not resolve URL"); return null; }
        let $ = cheerio.load(body), pageData = {};
        pageData = {site_title: $('title').text()}
        callback(stream_details, pageData);
    });
}

function stream_youtube_video(stream_details, siteData){
    console.log("Fetching Youtube Content - " + url)
    stream_details['bot'].sendMessage({
        to: stream_details['channelID'], message: "— *Fetching Youtube Content* - `" + url + "` —"}, (err, response) => { //Send Message Callback Functions
        // Download Youtube Content
        ytdl(url,{filter: 'audioonly'}).pipe(fs.createWriteStream('audio_cache.flv')).on('finish', function() {
            console.log("Now Playing - " + siteData['site_title'])
            stream_details['bot'].editMessage({
                channelID: stream_details['channelID'], 
                messageID: response.id, 
                message: "**Now Playing** — " + siteData['site_title'] + " — `" + url + "`"
            }) 
            stream_details['bot'].joinVoiceChannel(stream_details['voiceChannelID'], function(error, events) {
                //Check to see if any errors happen while joining.
                if (error) return console.error(error);
                //Get the audio context
                stream_details['bot'].getAudioContext(stream_details['voiceChannelID'], function(error, stream) {
                //Once again, check to see if any errors exist
                    if (error) return console.error(error);
                    AUDIO_STREAM = fs.createReadStream('audio_cache.flv')
                    AUDIO_STREAM.pipe(stream, {end: false});
                    stream.on('done', function() {
                        stream_details['bot'].leaveVoiceChannel(stream_details['voiceChannelID']);
                    });
                });
            });
        });
    });
}

module.exports = {
    playsong: function (bot, channelID, message) {
        url = grab_url(message)
        if(url === null) send_message(bot, channelID, "You can only specify a song by it's URL, sorry")    
        else {
            stream_details = { url: url, bot: bot, channelID: channelID,
                              voiceChannelID: fetch_primary_voice_channel(bot, channelID)['id'] }
            fetch_website_content(stream_details)
        }
    },
    stopsong: function(bot, channelID){
        AUDIO_STREAM.destroy()
        var voiceChannelID = fetch_primary_voice_channel(bot, channelID)['id']
        bot.leaveVoiceChannel(voiceChannelID);
    }
}

//switch(parse_command(message)){
//        // Music Player
//        case "'play":
//            bot.deleteMessage({ channelID: channelID, messageID: event['d']['id'] })
//            MusicPlayer.playsong(bot, channelID, message);
//            break;
//        case "'stop":
//            bot.deleteMessage({ channelID: channelID, messageID: event['d']['id'] })
//            MusicPlayer.stopsong(bot, channelID)
//            break;
//    }