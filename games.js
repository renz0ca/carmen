// games.js

// GLOBALS
var BOT = null
var LOGGING_STRING = "games.js   || "

// RACE-RELATED GLOBALS
var ANIMAL_LIST = [":dolphin:", ":whale2:", ":unicorn:", ":horse:", ":elephant:", ":snake:", ":chipmunk:", ":penguin:", ":camel:", ":poodle:", ":rabbit2:", ":turkey:"]
var JUMP_INTERVALS = [0, 1, 3, 5, 6, 10]
var CURRENTLY_RACING = {}
var TRACK_LENGTH = 106
var TIME_BEFORE_RACE = 10000
var ERR_NO_RACE_TO_JOIN = "There's no race to join. You can use `$race` to start one though!"
var ERR_NOT_ENOUGH_PLAYERS = "Looks like I'll have to call off the race, there aren't enough players :pensive:"
var ERR_RACE_EXISTS = "A race is already underway! Use `$jr` to join!"
var ERR_NO_ANIMALS_LEFT = "Sorry I've run out of animals! Maybe you can join the next race? Really sorry about that :confounded:"

// 8BALL-RELATED GLOBALS
var ball = [
    "It is certain", "It is decidedly so", "Without a doubt", "Yes, definitely", 
    "You may rely on it", "As I see it, yes", "Most likely", "Outlook good", 
    "Yes", "Signs point to yes", "Reply hazy try again", "Ask again later", 
    "Better not tell you now", "Cannot predict now", "Concentrate and ask again", 
    "Don't count on it", "My reply is no", "My sources say no", 
    "Outlook not so good", "Very doubtful"
]

// RATEWAIFU-RELATED GLOBALS
var thinking_prefix = [
    "hmmmmm... ",
    "Let's see... ",
    "Let me think... ",
    "No doubt in my mind ",
    ""
]
var waifu_rates = [
    "0/10 absolutely *NOT* waifu material",
    "1/10 totally garbage waifu",
    "2/10 low-tier waifu, you clearly don't have great taste",
    "3/10 terrible waifu",
    "4/10 average waifu, you can do better :unamused:",
    "5/10 mid-tier waifu",
    "6/10 pretty cute waifu",
    "7/10 well above average waifu, not bad :thumbsup:",
    "8/10 almost perfect waifu, you have good taste :ok_hand:",
    "9/10 absolutely waifuliscious",
    "10/10 waifu, who even needs real people?",
    "10/10 EXCELLENT waifu material",
    "11/10 GOD TIER WAIFU"
]


// 1.) ---- PUBLIC FUNCTIONS ------------------------------------------------------------------------ //


module.exports = {
    
    // Sets the global bot variable and returns the module's command dictionary.
    //
    // @param BOT The bot being used.
    // @return The module's command dictionary
    //
    init_module: function(bot){ 
        log_event("Initizaling Games Module...")
        BOT = bot
        return command_dict
    },
    
    // Sends an 8Ball Prediction to the chat.
    //
    // @param USERID The ID of the user making the command.
    // @param CHANNELID The ID of the channel the command was made in.
    // @param MESSAGE The whole message containing the command.
    // @param PARAMETER_SET A dictionary containing any parameters specified with the command.
    //
    eight_ball: function(userID, channelID, message, parameter_set){
        if(parameter_set['question'] == "") BOT.sendMessage({ to: channelID, message: "You need to ask a question!" });
        else BOT.sendMessage({ to: channelID, message: ":8ball: " + ball[get_random_int(0, ball.length)]  + " :8ball:" });
    },

    // Simulates a random dice roll and sends the result to the chat.
    //
    // @param USERID The ID of the user making the command.
    // @param CHANNELID The ID of the channel the command was made in.
    // @param MESSAGE The whole message containing the command.
    // @param PARAMETER_SET A dictionary containing any parameters specified with the command.
    // @return The numerical result of the dice throw.
    //
    roll: function(userID, channelID, message, parameter_set){ 
        dice = get_random_int(1, 7)
        log_event(BOT['users'][userID]['username'] + "(ID:" + userID + ") rolled a " + dice)
        BOT.uploadFile({
            to: channelID, message: "<@" + userID + "> rolled a `" + dice + "`",
            file: "./image_assets/dice/dice_" + dice + ".png"
        });
        return dice
    },
    
    // Simulates a random coin flip and sends the result to the chat.
    //
    // @param USERID The ID of the user making the command.
    // @param CHANNELID The ID of the channel the command was made in.
    // @param MESSAGE The whole message containing the command.
    // @param PARAMETER_SET A dictionary containing any parameters specified with the command.
    // @return The result of the coin flip.
    //
    flip: function(userID, channelID, message, parameter_set){ 
        coin = get_random_int(0, 2)
        flip = "heads"
        if(coin == 1) flip = "tails"
        log_event(BOT['users'][userID]['username'] + "(ID:" + userID + ") flipped " + flip)
        BOT.uploadFile({
            to: channelID, message: "<@" + userID + "> flipped `" + flip + "`",
            file: "./image_assets/coin/" + flip + ".png"
        });
        return flip
    },
    
    // Randomly picks a user from the server and sends the selection to the chat.
    //
    // @param USERID The ID of the user making the command.
    // @param CHANNELID The ID of the channel the command was made in.
    // @param MESSAGE The whole message containing the command.
    // @param PARAMETER_SET A dictionary containing any parameters specified with the command.
    //
    raffle: function(userID, channelID, message, parameter_set){
        server_users = BOT.servers[BOT.channels[channelID]['guild_id']]['members']
        user_ids = Object.keys(server_users)
        raffle_user = BOT['users'][user_ids[ user_ids.length * Math.random() << 0]];
        log_event("Raffled User: " + raffle_user['username'] + "#" + raffle_user['discriminator'])
        BOT.sendMessage({ to: channelID, embed: {
            color: 7458112,
            title: ":tickets: Raffled user",
            description: "**" + raffle_user['username'] + "#" + raffle_user['discriminator'] + "**"
        }})
    },
    
    // Rates a waifu specified by a single parameter and then sends the result to the chat.
    //
    // @param USERID The ID of the user making the command.
    // @param CHANNELID The ID of the channel the command was made in.
    // @param MESSAGE The whole message containing the command.
    // @param PARAMETER_SET A dictionary containing any parameters specified with the command.
    //
    rate_waifu: function(userID, channelID, message, parameter_set){
        if(parameter_set['waifu'] === "") 
            BOT.sendMessage({ to: channelID, message: "Who's your waifu?" });
        else {
            thinking = get_random_int(0, thinking_prefix.length)
            rate = get_random_int(0, waifu_rates.length)
            BOT.sendMessage({ to: channelID, message: thinking_prefix[thinking] + waifu_rates[rate] });
        }
    },
    
    // Builds a race object using the channelID as the raceID.
    //
    // @param USERID The ID of the user making the command.
    // @param CHANNELID The ID of the channel the command was made in.
    // @param MESSAGE The whole message containing the command.
    // @param PARAMETER_SET A dictionary containing any parameters specified with the command.
    //
    race: function(userID, channelID, message, parameter_set){
        if(CURRENTLY_RACING[channelID] === undefined){
            log_event("Race queued in channel " + channelID)
            BOT.sendMessage({ 
                to: channelID, 
                message: "Alright! I'll start the race in **" + (TIME_BEFORE_RACE/1000) + " seconds**! Use `$jr` to join!" 
            });
            CURRENTLY_RACING[channelID] = { 
                animals: ANIMAL_LIST.slice(), player: [], player_animal: [], progress: [], place: [],
            }
            setTimeout(function(){ execute_race(channelID) }, TIME_BEFORE_RACE)
        } else BOT.sendMessage({ to: channelID, message: ERR_RACE_EXISTS });
    },
    
    // Adds a user to the race object in their channel (if one exists).
    //
    // @param USERID The ID of the user making the command.
    // @param CHANNELID The ID of the channel the command was made in.
    // @param MESSAGE The whole message containing the command.
    // @param PARAMETER_SET A dictionary containing any parameters specified with the command.
    //
    join_race: function(userID, channelID, message, parameter_set){
        if(CURRENTLY_RACING[channelID] !== undefined){
            race = CURRENTLY_RACING[channelID]
            //if(!race['player'].includes(userID)){
                // Only add player if there are animals left
                if(race['animals'].length != 0){
                    random_index = get_random_int(0, race['animals'].length)
                    animal = race['animals'].splice(random_index, 1)[0]
                    race['player'].push(userID)
                    race['player_animal'].push(animal)
                    race['progress'].push(0)
                    race['place'].push(0)
                    username = BOT['users'][userID]['username']
                    log_event("RACE (ID:" + channelID + "): " + username + " joined as a " + animal)
                    BOT.sendMessage({ to: channelID, embed:{ color: 7458112,
                        description: "<@" + userID + "> **joined as a** " + animal
                    }});
                } else BOT.sendMessage({ to: channelID, message: ERR_NO_ANIMALS_LEFT });
            //}
        } else BOT.sendMessage({ to: channelID, message: ERR_NO_RACE_TO_JOIN });
    },    
    
}


// 2.) ---- RACING SPECIFIC FUNCTIONS --------------------------------------------------------------- //


// Sets up the race "track" and starts the race for the given race object.
//
// @param RACEID The ID of the race object.
//
function execute_race(raceID){
    // If there aren't enough players, cancel the race.
    log_event("RACE (ID:" + raceID + "): Running...")
    if(CURRENTLY_RACING[raceID]['player'].length < 2){
        BOT.sendMessage({ to: raceID, message: ERR_NOT_ENOUGH_PLAYERS });
        log_event("RACE (ID:" + raceID + "): Race has been cancelled due to a lack of players")
        delete CURRENTLY_RACING[raceID]
        return
    }
    // Generate Track
    race_obj = CURRENTLY_RACING[raceID]
    race_string = "***GOOOOOOOOOOOOOOOOOOOO!!!***\n\n🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁:end:"
    for(var animal in race_obj['player_animal']) race_string += "\n" + race_obj['player_animal'][animal]
    race_string += "\n🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁:end:"
    BOT.sendMessage({ to: raceID, message: race_string }, (err, response) => {
        // If the track couldn't be sent, for whatever reason, wait and then try to send it again before giving up.
        if(err){
            log_event("RACE (ID:" + raceID + "): ERROR STARTING RACE - RETRYING...")
            setTimeout(function(){
                BOT.sendMessage({ to: raceID, message: race_string }, (err, response) => {
                    if(err){
                        log_event("RACE (ID:" + raceID + "): RACE COULD NOT BE STARTED! ERROR DATA:")
                        console.log(err)
                        BOT.sendMessage({ to: raceID, embed: {
                            color: 15607839,
                            description: "An unexpected error occured, the race has been cancelled. Please try again."
                        }})
                        delete CURRENTLY_RACING[raceID]
                    } else race_loop(raceID, response['id'], 0)
                });
            }, 1200)
        } else race_loop(raceID, response['id'], 0)               
    });
}


// Simulates a race in the chat.
//
// @param RACEID The ID of the race object.
// @param MESSAGEID The ID of the message containing the original race "track" to be edited.
// @param PLACE The amount of players that have finished the race.
//
function race_loop(raceID, messageID, place){
    race_obj = CURRENTLY_RACING[raceID]
    // If nobody has place '0' then that means everyone has completed the track and the race is over.
    if(!race_obj['place'].includes(0)){ complete_race(raceID); return;}
    for(var i in race_obj['progress']){
        // If the still have place '0' move the player forward.
        if(race_obj['place'][i] == 0)
            race_obj['progress'][i] = race_obj['progress'][i] + JUMP_INTERVALS[get_random_int(0, JUMP_INTERVALS.length)]
        // If they are currently at or past TRACK_LENGTH set their position to TRACK_LENGTH and assign them their place. 
        if(race_obj['place'][i] == 0 && race_obj['progress'][i] >= TRACK_LENGTH){
            race_obj['progress'][i] = TRACK_LENGTH
            race_obj['place'][i] = place + 1
            place++;
        }
    } 
    BOT.editMessage({ channelID: raceID, messageID: messageID, message: render_race_track(raceID) })
    // Recursively call self to get the next position for each player.
    setTimeout(function(){ race_loop(raceID, messageID, place) }, 1000)
}


// Converts a race object into a string.
//
// @param RACEID The ID of the race object.
//
function render_race_track(raceID){
    race_string = "***GOOOOOOOOOOOOOOOOOOOO!!!***\n\n🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁:end:"
    for(var animal in race_obj['player_animal']){
        spaces = Array(race_obj['progress'][animal] + 1).join(" "), award = ""
        if(race_obj['place'][animal] == 1) award = ":trophy:"
        else if(race_obj['place'][animal] == 2) award = "`2nd`"
        else if(race_obj['place'][animal] == 3) award = "`3rd`"
        else if(race_obj['place'][animal] > 3) award = "`" + race_obj['place'][animal] + "th`"
        race_string += "\n" + spaces + race_obj['player_animal'][animal] + award
    }
    race_string += "\n🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁🏁:end:"
    return race_string
}

// Announces the winner of the race in the chat and then destroys the race object.
//
// @param RACEID The ID of the race object.
//
function complete_race(raceID){
    log_event("RACE (ID:" + raceID + "): RACE COMPLETE!")
    race_obj = CURRENTLY_RACING[raceID]
    winner = race_obj['player'][race_obj['place'].indexOf(1)]
    BOT.sendMessage({ to: raceID, message: "Congratulations <@" + winner + "> you won 1st place!" });
    delete CURRENTLY_RACING[raceID]
}


// 3.) ---- HELPER FUNCTIONS ------------------------------------------------------------------------ //


// Generates a random number inbetween low (inclusive) and high (exclusive).
//
// @param LOW The lowest number to generate
// @param HIGH The highest number to generate + 1
// @return a random number inbetween low and high exclusive.
//
function get_random_int(low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}


// Logs Output to the NODEJS Console.
//
// @param STRING The string to log.
// @param NEWLINE If TRUE a newline will be appended to the end of
//                the string.
// @param INCLUDE_LOG_STRING If TRUE the LOGGING_STRING will be included.
//
function log_event(string, newline = true, include_log_string = true){
    logging_string = ''
    if(include_log_string) logging_string = LOGGING_STRING
    if(newline) process.stdout.write(logging_string + string + "\n")
    else process.stdout.write(logging_string + string)
}


// 4.) ---- MODULE COMMAND DICTIONARY --------------------------------------------------------------- //


var command_dict = {
    "Games":{
        "$roll":{
            parameters: [],
            param_types: [],
            delete_calling_message: false,
            desc: "Roll a Dice",
            function: module.exports['roll']
        },
        "$flip":{
            parameters: [],
            param_types: [],
            delete_calling_message: false,
            desc: "Flip a Coin",
            function: module.exports['flip']
        },
        "$8ball":{
            parameters: ["question"],
            param_types: ["whole_string"],
            delete_calling_message: false,
            desc: "Reveal your fortune",
            function: module.exports['eight_ball']
        }, 
        "$raffle":{
            parameters: [],
            param_types: [],
            delete_calling_message: false,
            desc: "Choose a random member of the server",
            function: module.exports['raffle']
        },
        "$ratewaifu":{
            parameters: ["waifu"],
            param_types: ["whole_string"],
            delete_calling_message: false,
            desc: "Rate a Waifu",
            function: module.exports['rate_waifu']
        },
        "$race":{
            parameters: [],
            param_types: [],
            delete_calling_message: false,
            desc: "Start a Race",
            function: module.exports['race']
        },
        "$jr":{
            parameters: [],
            param_types: [],
            delete_calling_message: false,
            desc: "Join a Race",
            function: module.exports['join_race']
        }   
    }
}
