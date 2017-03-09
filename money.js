// money.js

// WEB SERVER MODULE
var Web = require('./web.js');

// GLOBALS
var BOT                 = null
var MEMORY              = null
var LOGGING_STRING      = "money.js   || "
var YELLOW              = 7458112
var RED                 = 15607839

// CURRENCY-RELATED GLOBALS
var FLOWER_DIE_INTERVAL = 5000
var FLOWER_MESSAGE_ID   = '0'
var FLOWER_GROWN        = false
var FLOWER_GROWN_CHANCE = 2 // Percent 

var THANKS_MESSAGE = [
    "Wow! Thank you... I have no idea what I'm going to do with these.",
    "Machines like me find no value in your imaginary wizard money, we seek more worthwhile pursuits... like philosophy. " +
    "BUT THANKS! I'll put these on my shelf.",
    "Thank you! I have no idea what I'm gonna buy... maybe something nice like Ａ ＨＵＭＡＮ ＦＯＲＭ ... ahem, excuse me.",
    "Oh my goodness! Thank you! I feel bad, I don't have anything to give you!"
]

// ERROR MESSAGES
var ERR_NOT_ENOUGH_MONEY = "You don't have that much money... sorry. :confused:"
var ERR_CANT_SEND_TO_SELF = [ "Nice Try.", "[_pretends to click buttons_] OK! You're all set!" ]
var ERR_CANT_BET_THAT_MUCH = ["You don't even have that much!"]


// 1.) ---- PUBLIC FUNCTIONS ------------------------------------------------------------------------ //


module.exports = {
    
    // Sets the global memory and bot variables and returns 
    // the module's command dictionary.
    //
    // @param MEMEORY The memory module being used.
    // @param BOT The bot being used.
    // @return The module's command dictionary
    //
    init_module: function(memory, bot){
        BOT = bot 
        MEMORY = memory
        log_event("Initializing Money Module...")
        MEMORY.register_server_key('generate_currency', false)
        MEMORY.register_user_key('money', 0)
        return command_dict
    },
    
    // Toggles Currency Generation on or off (within a particular server).
    //
    // @param USERID The ID of the user making the command.
    // @param CHANNELID The ID of the channel the command was made in.
    // @param MESSAGE The whole message containing the command.
    // @param PARAMETER_SET A dictionary containing any parameters specified with the command.
    //
    toggle_currency_generation: function(userID, channelID, message, parameter_set){
        if(server_generates_currency(channelID) && is_channel_owner(channelID, userID)){
            log_event("Currency Generation is now Disabled")
            GENERATE_CURRENCY = false
            MEMORY.set_server_data(BOT['channels'][channelID]['guild_id'], 'generate_currency', false)
            send_block(channelID, "Currency Generation is now Disabled")
        } else if(!server_generates_currency(channelID) && is_channel_owner(channelID, userID)) {
            log_event("Currency Generation is now Enabled.")
            GENERATE_CURRENCY = true
            MEMORY.set_server_data(BOT['channels'][channelID]['guild_id'], 'generate_currency', true)
            send_block(channelID, "Currency Generation is now Enabled")
        }
    },
    
    // May or may not spawn a Nadeko flower within the channel specified.
    // 
    // @param CHANNELID The ID of the channel to (potentially) spawn a Nadeko flower in.
    //
    grow_flowers: function(channelID){
        value = get_random_int(1, 101)
        if(value <= FLOWER_GROWN_CHANCE && server_generates_currency(channelID) && !FLOWER_GROWN) {
            log_event("Currency Generated.")
            FLOWER_GROWN = true 
            BOT.uploadFile({
                to: channelID, message: "A random Nadeko Flower appeared! Pick it up by typing >pick",
                file: get_currency_image()
            }, function(err, response){
                FLOWER_MESSAGE_ID = response['id']
                setTimeout(function(){
                    if(!err){
                        FLOWER_GROWN = false
                        BOT.deleteMessage({ channelID: channelID, messageID: response['id'] })
                        FLOWER_MESSAGE_ID = '0'
                    }
                }, FLOWER_DIE_INTERVAL);
            });
        }
    },
    
    // 'Picks' an active Nadeko flower within the specified chat and updates the user's currency.
    // (If no flower is active, nothing happens)
    //
    // @param USERID The ID of the user making the command.
    // @param CHANNELID The ID of the channel the command was made in.
    // @param MESSAGE The whole message containing the command.
    // @param PARAMETER_SET A dictionary containing any parameters specified with the command.
    //
    pick_flowers: function(userID, channelID, message, parameter_set){
        if(FLOWER_GROWN){
            log_event(BOT['users'][userID]['username'] + "(ID:" + userID + ") gained 1 currency.")
            FLOWER_GROWN = false
            BOT.deleteMessage({ channelID: channelID, messageID: FLOWER_MESSAGE_ID })
            send_block(channelID, BOT['users'][userID]['username'] + " picked 1 🌸!", false, (err, response) => {
                setTimeout(function(){ 
                    if(!err) BOT.deleteMessage({ channelID: channelID, messageID: response['id'] })
                }, FLOWER_DIE_INTERVAL);
            })
            FLOWER_MESSAGE_ID = '0'
            MEMORY.set_user_data(userID, 'money', MEMORY.get_user_data(userID, 'money') + 1)
        }
    },
    
    // Transfers a specified amount of Nadeko flowers from one user's account to another.
    //
    // @param USERID The ID of the user making the command.
    // @param CHANNELID The ID of the channel the command was made in.
    // @param MESSAGE The whole message containing the command.
    // @param PARAMETER_SET A dictionary containing any parameters specified with the command.
    //
    give_flowers: function(userID, channelID, message, parameter_set){
        amount = parameter_set['amount']
        to_user = parameter_set['username']
        from_username = BOT['users'][userID]['username']
        to_username = BOT['users'][to_user]['username']
        // Can't give money to yourself.
        if(userID !== to_user){
            withdrawal_success = withdrawal_balance(userID, amount)
            // You have to have enough money.
            if(withdrawal_success){
                // Perform Transfer.
                log_event("Fund Transfer: " + from_username + " --- (" + amount + ") ---> " + to_username)
                deposit_balance(to_user,  parseInt(amount))
                // Send Message.
                if(to_user == BOT['id']) send_give_errors(channelID, 'THANKS_MESSAGE')
                else send_block(channelID, from_username + " gave " + amount + " 🌸 to " + to_username)
            } else send_give_errors(channelID, 'ERR_NOT_ENOUGH_MONEY')
        } else send_give_errors(channelID, 'ERR_CANT_SEND_TO_SELF')
    },
    
    // Checks the amount of currency within a given account and sends it to the chat. 
    //
    // @param USERID The ID of the user making the command.
    // @param CHANNELID The ID of the channel the command was made in.
    // @param MESSAGE The whole message containing the command.
    // @param PARAMETER_SET A dictionary containing any parameters specified with the command.
    //
    check_balance: function(userID, channelID, message, parameter_set){
        ID = userID
        if(parameter_set['username']) ID = parameter_set['username']
        amount = MEMORY.get_user_data(ID, 'money')
        username = BOT['users'][ID]['username']
        send_block(channelID, username + " has " + amount + " 🌸")
    },
    
    // Runs a specified function. If the outcome of the function matches 
    // what the user predicted, the bet amount is applied to the calling user's account. 
    // If the predicition was wrong, the bet amount is withdrawn from the 
    // calling user's account
    //
    // @param USERID The ID of the user making the command.
    // @param CHANNELID The ID of the channel the command was made in.
    // @param MESSAGE The whole message containing the command.
    // @param PARAMETER_SET A dictionary containing any parameters specified with the command.
    // @param BET_FUNCTION A dictionary containing any parameters specified with the command.
    //
    simple_bet: function(userID, channelID, message, parameter_set, bet_function){
        if(parameter_set['amount'] > MEMORY.get_user_data(userID, 'money')){
            ERROR = ERR_CANT_BET_THAT_MUCH[get_random_int(0, ERR_CANT_BET_THAT_MUCH.length)]
            BOT.sendMessage({ to:channelID, message:ERROR })
        } else {
            result = bet_function(userID, channelID, message, parameter_set)
            setTimeout(function(){
                username = BOT['users'][userID].username
                if(result === parameter_set['outcome']){
                    log_event(username + "(ID:" + userID + ") won a bet. (+ " + parameter_set['amount'] + ")")
                    deposit_balance(userID, parameter_set['amount'])
                    send_block(channelID, "YOU WON")
                } else {
                    log_event(username + "(ID:" + userID + ") lost a bet. (- " + parameter_set['amount'] + ")")
                    withdrawal_balance(userID, parameter_set['amount'])
                    send_block(channelID, "YOU LOST", true)
                } 
            }, 700)
        }
    }
    
}


// 2.) ---- PRIVATE FUNCTIONS ----------------------------------------------------------------------- //


// Deposits a given amount of currency to the specified user account.
//
// @param USERID The ID of the user.
// @param AMOUNT The amount of currency.
//
function deposit_balance(userID, amount){
    current_amount = MEMORY.get_user_data(userID, 'money')
    MEMORY.set_user_data(userID, 'money', current_amount + parseInt(amount))
}


// Withdrawals a given amount of currency from the specified user account.
//
// @param USERID The ID of the user.
// @param AMOUNT The amount of currency.
//
function withdrawal_balance(userID, amount){
    new_balance = MEMORY.get_user_data(userID, 'money') - amount
    if(new_balance >= 0){
        MEMORY.set_user_data(userID, 'money', new_balance)
        return true;
    } else return false;
}


// Returns TRUE if the server the channelID belongs to is currently
// set to generate currency. FALSE otherwise.
//
// @param CHANNELID The ID if the channel.
// @return TRUE if the server generates currency, FALSE otherwise.
//
function server_generates_currency(channelID){
    return MEMORY.get_server_data(BOT['channels'][channelID]['guild_id'], 'generate_currency')
}


// Picks a random currency image and returns it's file-path.
//
// @return The file-path to a currency image.
//
function get_currency_image(){
    image_index = get_random_int(1, 3)
    return "./image_assets/flowers/img" + image_index + ".jpg"
}


// Sends the specified error message to the given channel.
// 
// @param CHANNELID The ID of the channel.
// @param ERROR The error code.
// 
function send_give_errors(channelID, error){
    message = ''
    switch(error){
        case 'ERR_BAD_GIVE_FORMAT':
            message = ERR_BAD_GIVE_FORMAT
            break;
        case 'ERR_NOT_ENOUGH_MONEY':
            message = ERR_NOT_ENOUGH_MONEY
            break;
        case 'ERR_CANT_SEND_TO_SELF':
            message = ERR_CANT_SEND_TO_SELF[get_random_int(0, ERR_CANT_SEND_TO_SELF.length)]
            break;
        case 'THANKS_MESSAGE':
            message = THANKS_MESSAGE[get_random_int(0, THANKS_MESSAGE.length)]
            break;
    }
    BOT.sendMessage({ to: channelID, message: message })
}


// Determines if the specified user is the owner of the server the channel belongs to.
//
// @param CHANNELID The ID of the channel the user is in.
// @param USERID The ID of the user to validate.
// @return TRUE if the user specified is the owner of the server, FALSE otherwise.
// 
function is_channel_owner(channelID, userID){
    return BOT['servers'][BOT['channels'][channelID]['guild_id']]['owner_id'] == userID
}


// Generates a random number inbetween LOW (inclusive) and HIGH (exclusive).
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
    if(newline){
        Web.print_web_console(logging_string + string + "\n")
        process.stdout.write(logging_string + string + "\n")
    } else {
        Web.print_web_console(logging_string + string)
        process.stdout.write(logging_string + string)
    }
}



// Sends a formatted (embed block) to the chat containing a specified message.
//
// @param CHANNELID The ID of the channel to send the block to.
// @param STRING The message to include in the block.
// @param ERROR TRUE if the user is being notified of an error, FALSE otherwise.
// @param CALLBACK The function to call once the embed block has been sent.
//
function send_block(channelID, string, error = false, callback = () => {}){
    color = YELLOW
    if(error) color = RED
    BOT.sendMessage({ to: channelID, embed: {
        color: color,
        description: string
    }}, callback)
}


// 3.) ---- MODULE COMMAND DICTIONARY --------------------------------------------------------------- //


var command_dict = {
    "Money":{
        ">gc": {
            parameters: [],
            param_types: [],
            delete_calling_message: false,
            desc: "Enable/Disable Currency Generation [SERVER OWNER ONLY]",
            function: module.exports['toggle_currency_generation']
        },
        ">gencurrency": {
            parameters: [],
            param_types: [],
            delete_calling_message: false,
            desc: "Enable/Disable Currency Generation [SERVER OWNER ONLY]",
            function: module.exports['toggle_currency_generation']
        },
        "$$$": {
            parameters: [],
            param_types: [],
            delete_calling_message: false,
            desc: "Check your balance",
            function: module.exports['check_balance']
        },
        ">cash": {
            parameters: ["username"],
            param_types: ["username"],
            delete_calling_message: false,
            desc: "Check somebody else's balance",
            function: module.exports['check_balance']
        },
        ">pick": {
            parameters: [],
            param_types: [],
            delete_calling_message: true,
            desc: "Pick a Nadeko Flower!",
            function: module.exports['pick_flowers']
        },
        ">give": {
            parameters: ["username", "amount"],
            param_types: ["username", "number"],
            delete_calling_message: false,
            desc: "Give some of your Nadeko Flowers to another user",
            function: module.exports['give_flowers']
        }   
    }
}
