const fetch = require('node-fetch');
const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient();

AWS.config.update({
    region: "us-west-2"
});

exports.handler = async (event) => {
    let language = "";
    var dbParams = {
        TableName: "mlsupport-Messages",
        Key: {
            MsgGroup: "1000_GreetingLanguage"
        }
    };

    dynamodb.get(dbParams, (error, data) => {
        if (error) {
            console.log(error);
            language = "en-US";
        } else {
            language = data.Item.CurrentLanguage;
        }

    });



    const res = await fetch("https://www.thecocktaildb.com/api/json/v1/1/random.php");

    const json = await res.json();

    const drinkName = json["drinks"][0]["strDrink"];
    const instructions = json["drinks"][0]["strInstructions"]

    let ingridientI = "strIngredient";
    let counter = 1;
    let index = ingridientI + counter;
    let str = ""
    let conjuction = "and "

    if (language === "es-US") {
        conjuction = "y "
    }
    while (json["drinks"][0][index] !== null) {

        if (json["drinks"][0][ingridientI + (counter + 1)] === null) {
            str += conjuction + json["drinks"][0][index];
            counter++;
            index = ingridientI + counter
            continue;
        }
        str += json["drinks"][0][index] + ", ";
        counter++;
        index = ingridientI + counter

    }
    let myMessage = "";

    if (language === "en-US") {
        myMessage += "I found you a random drink. The drink name is: " + drinkName + ".";
        myMessage += "Here are the main ingredients: " + str + ". ";
        myMessage += "Here's how to make it: " + instructions + "\n";

    } else {
        myMessage += "Te encontré una bebida al azar. El nombre de la bebida es: " + drinkName + ".";
        myMessage += "Estos son los ingredientes principales: " + str + ". ";
        myMessage += "He aquí cómo hacerlo:" + instructions + "\n";
    }
    let {
        name,
        slots
    } = event.currentIntent;


    return {
        dialogAction: {
            type: "Close",
            fulfillmentState: "Fulfilled",
            message: {
                contentType: "PlainText",
                content: myMessage
            }
        }
    }







};