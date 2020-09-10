const fetch = require("node-fetch");

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
            MsgGroup: "1000_GreetingLanguage",
        },
    };

    dynamodb.get(dbParams, (error, data) => {
        if (error) {
            console.log(error);
            language = "en-US";
        } else {
            language = data.Item.CurrentLanguage;
        }
    });

    let {
        name,
        slots
    } = event.currentIntent;
    if (slots.ingredients) {
        let link =
            "https://www.thecocktaildb.com/api/json/v1/1/filter.php?i=" +
            slots.ingredients;
        //+ slots.ingredient;

        try {
            const res = await fetch(link);

            const json = await res.json();

            let drinkIngredients = [];

            for (let i = 0; i < 10; i++) {
                let drinkid = json["drinks"][i]["idDrink"];
                let drinkName = json["drinks"][i]["strDrink"];

                let linkid =
                    "https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=" + drinkid;

                const mydrink = await fetch(linkid);
                const drinkJson = await mydrink.json();

                let ingridientI = "strIngredient";
                let counter = 1;
                let index = ingridientI + counter;
                //let str = '{"ingredients" :{';
                let ingredients = [];

                while (drinkJson["drinks"][0][index] !== null) {
                    //str +=  '"' + counter + '":' +  ' "' + drinkJson["drinks"][0][index] + '",';
                    ingredients.push(drinkJson["drinks"][0][index]);
                    counter++;
                    index = ingridientI + counter;
                }

                var drinkObj = {};

                drinkObj.name = drinkName;
                drinkObj.ingredients = ingredients;

                drinkIngredients.push(drinkObj);
            }

            let response = "";
            if (language === "en-US") {
                response =
                    "Here is a list of 10 drinks you can make with " +
                    slots.ingredients +
                    ". You can make ";
                for (let i = 0; i < drinkIngredients.length - 1; i++) {
                    response += drinkIngredients[i].name + "s, ";
                }
                response +=
                    " and " + drinkIngredients[drinkIngredients.length - 1].name + "s.";
            } else {
                response =
                    "Aquí tienes una lista de 10 bebidas que puedes preparar con " +
                    slots.ingredients +
                    ". Puedes preparar ";
                for (let i = 0; i < drinkIngredients.length - 1; i++) {
                    response += drinkIngredients[i].name;
                }
                response +=
                    " y " + drinkIngredients[drinkIngredients.length - 1].name + ".";
            }

            return {
                dialogAction: {
                    type: "ElicitIntent",
                    message: {
                        contentType: "PlainText",
                        content: response,
                    },
                },
            };
        } catch (error) {
            return {
                dialogAction: {
                    type: "ElicitIntent",
                    message: {
                        contentType: "PlainText",
                        content: "There was an error witht that request. Please try again.",
                    },
                },
            };
        }
    } else {
        //user did not provide an ingredient
        return {
            dialogAction: {
                type: "ElicitIntent",
                message: {
                    contentType: "PlainText",
                    content: "Please provide an ingredient",
                },
            },
        };
    }
};

// this function helps match a list of ingredeints to a user provided list of ingredients
// with more time this can be developed so the user can offer more ingredients and it 
//would provide a drink or list of drinks with those ingredients. 
function matchesIngredients(arr, toCompare) {
    return arr.every((ingredients) => toCompare.includes(ingredients));
}